import * as pulumi from '@pulumi/pulumi'
import * as aws from '@pulumi/aws'
import * as awsx from '@pulumi/awsx'
import { bundleAndZip } from './utils/bundleLambda'
import { crawlDirectory } from './utils/crawlDirectory'
import { getDomainAndSubdomain } from './utils/getDomain'
import { ApiGatewayLambdaProxy } from '@wanews/pulumi-apigateway-lambda-proxy'
import path from 'path'
import * as mime from 'mime'
// Bundle Remix build files pragmatically

// build script
// ;(async () => {
//     const bundleResult = await bundleAndZip()
// })()

// // Create an AWS resource (S3 Bucket)
// const bucket = new aws.s3.Bucket('template-test-bucket')

// // Export the name of the bucket
// export const bucketName = bucket.id

// This is the path to the other project relative to the CWD
const projectRoot = './'
const staticFiles = '../public'

// const stackName = pulumi.getStack()
const name = 'link-shortener'
const domain = 'link.dh.wtf'
const dbName = 'link-shortener-table'
const domainParts = getDomainAndSubdomain(domain)
const tenMinutes = 60 * 10

const existingCertArn =
    'arn:aws:acm:us-east-1:739766728346:certificate/fb2c29a3-f51f-4ac8-9813-89c5ecd7a13b'

// TODO see what is up here
function getTags(name: string) {
    // Use whatever logic you like to construct your tags
    return {
        Name: name,
        Product: 'link-shortener-service',
    }
}

/**
 * Domain & Certs
 */

// create the zone if running on local stack
// const selectedZone = new aws.route53.Zone(domainParts.parentDomain, {})

// Get the hosted zone by domain name
const selectedZone = pulumi.output(
    aws.route53.getZone({ name: domainParts.parentDomain }, { async: true })
)

// Per AWS, ACM certificate must be in the us-east-1 region.
// const eastRegion = new aws.Provider(`${name}-east-1-provider`, {
//     profile: 'pulumi-admin',
//     region: 'us-east-1',
// })

//  Create the SSL Certificate
// const certificate = new aws.acm.Certificate(
//     `${name}-certificate`,
//     {
//         domainName: domain,
//         validationMethod: 'DNS',
//     },
//     { provider: eastRegion }
// )

// Create the Certificate Validation Records in the DNS
// const certificateValidationDomain = new aws.route53.Record(
//     `${name}-validation`,
//     {
//         name: certificate.domainValidationOptions[0].resourceRecordName,
//         zoneId: selectedZone.zoneId,
//         type: certificate.domainValidationOptions[0].resourceRecordType,
//         records: [certificate.domainValidationOptions[0].resourceRecordValue],
//         ttl: tenMinutes,
//     },
//     { provider: eastRegion }
// )

// Wait for Certificate to be validated
// const certificateValidation = new aws.acm.CertificateValidation(
//     `${name}-certificate-validation`,
//     {
//         certificateArn: certificate.arn,
//         validationRecordFqdns: [certificateValidationDomain.fqdn],
//     }
// )

/**
 * Database
 */

// Create a Database infrastructure
const linksTable = new aws.dynamodb.Table(dbName, {
    attributes: [
        {
            name: 'urlHash',
            type: 'S',
        },
        {
            name: 'longUrl',
            type: 'S',
        },
        {
            name: 'createdAt',
            type: 'N',
        },
    ],
    hashKey: 'urlHash',
    rangeKey: 'longUrl',
    globalSecondaryIndexes: [
        {
            hashKey: 'createdAt',
            name: 'createdAtIndex',
            nonKeyAttributes: ['urlHash', 'longUrl'],
            projectionType: 'INCLUDE',
            rangeKey: 'urlHash',
            readCapacity: 10,
            writeCapacity: 10,
        },
    ],
    billingMode: 'PROVISIONED',
    readCapacity: 10,
    writeCapacity: 10,
})

/**
 * Lambda and API Gateway
 */

// lambda role
const lambdaRole = new aws.iam.Role(`${name}-lambda-role`, {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: 'lambda.amazonaws.com',
    }),
})

// lambda policy
const policy = new aws.iam.RolePolicy(`${name}-lambda-policy`, {
    role: lambdaRole,
    policy: linksTable.arn.apply(arn =>
        JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Action: [
                        // TODO tighten this up?
                        'dynamodb:*',
                        // 'dynamodb:CreateTable',
                        // 'dynamodb:ListTables',
                        // 'dynamodb:UpdateItem',
                        // 'dynamodb:PutItem',
                        // 'dynamodb:GetItem',
                        // 'dynamodb:DescribeTable',
                    ],
                    Resource: [arn, `${arn}/index/*`],
                    Effect: 'Allow',
                },
                {
                    Action: ['logs:*', 'cloudwatch:*'],
                    Resource: '*',
                    Effect: 'Allow',
                },
            ],
        })
    ),
})

// attach lambda role and policy - not sure if required

// lambda
const lambda = new aws.lambda.Function(`${name}-lambda-fucntion`, {
    code: new pulumi.asset.FileArchive(
        path.resolve(projectRoot, 'lambda-bundle.zip')
    ),
    runtime: 'nodejs14.x',
    role: lambdaRole.arn,
    handler: 'index.handler',
    memorySize: 2048,
})

// api gateway
const apiGateway = new aws.apigatewayv2.Api(`${name}-gateway`, {
    protocolType: 'HTTP',
})

// lambda permissions
const lambdaPermission = new aws.lambda.Permission(
    `${name}-lambda-permission`,
    {
        action: 'lambda:InvokeFunction',
        principal: 'apigateway.amazonaws.com',
        function: lambda,
        sourceArn: pulumi.interpolate`${apiGateway.executionArn}/*/*`,
    },
    { dependsOn: [apiGateway, lambda] }
)

// lambda intergration
const integration = new aws.apigatewayv2.Integration(
    `${name}-lambda-integration`,
    {
        apiId: apiGateway.id,
        integrationType: 'AWS_PROXY', //TODO should this be HTTP proxy??
        integrationUri: lambda.arn,
        integrationMethod: 'POST', //TODO this should prob also be all?
        payloadFormatVersion: '2.0',
        passthroughBehavior: 'WHEN_NO_MATCH',
    }
)

// api gateway route
const route = new aws.apigatewayv2.Route(`${name}-gateway-route`, {
    apiId: apiGateway.id,
    routeKey: '$default',
    target: pulumi.interpolate`integrations/${integration.id}`,
})

// api gateway domain
// const gatewayDomainName = new aws.apigatewayv2.DomainName(
//     `${name}-gateway-domain`,
//     {
//         domainName: domain,
//         domainNameConfiguration: {
//             certificateArn: certificate.arn,
//             endpointType: 'REGIONAL',
//             securityPolicy: 'TLS_1_2',
//         },
//     },
//     { dependsOn: [certificate, certificateValidation] }
// )

// api gateway stage //TODO wtf is this?
const stage = new aws.apigatewayv2.Stage(
    `${name}-gateway-stage`,
    {
        apiId: apiGateway.id,
        name: '$default',
        routeSettings: [
            {
                routeKey: route.routeKey,
                throttlingBurstLimit: 5000,
                throttlingRateLimit: 10000,
            },
        ],
        autoDeploy: true,
    },
    { dependsOn: [route] }
)

// api gateway mapping
// const mapping = new aws.apigatewayv2.ApiMapping(`${name}-api-mapping`, {
//     apiId: apiGateway.id,
//     domainName: gatewayDomainName.id,
//     stage: stage.name,
// })

/**
 * Static Assets Bucket
 */

// Create an s3 bucket
const staticFilesBucket = new aws.s3.Bucket(`${name}-static-files-bucket`, {
    bucket: domain,
    acl: 'public-read',
    // website: {
    //     indexDocument: 'index.html',
    // },
})

// Place files from public into bucket
const webContentsRootPath = path.join(process.cwd(), staticFiles)

crawlDirectory(webContentsRootPath, (filePath: string) => {
    const relativeFilePath = filePath.replace(webContentsRootPath + '/', '')
    const contentFile = new aws.s3.BucketObject(
        relativeFilePath,
        {
            key: relativeFilePath,

            acl: 'public-read',
            bucket: staticFilesBucket,
            contentType: mime.getType(filePath) || undefined,
            source: new pulumi.asset.FileAsset(filePath),
        },
        {
            parent: staticFilesBucket,
        }
    )
})

/**
 * CDN
 */

// Cloudfront Distribution config

// distributionArgs configures the CloudFront distribution. Relevant documentation:
// https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-values-specify.html
// https://www.terraform.io/docs/providers/aws/r/cloudfront_distribution.html
const distributionArgs: aws.cloudfront.DistributionArgs = {
    enabled: true,
    // Alternate aliases the CloudFront distribution can be reached at, in addition to https://xxxx.cloudfront.net.
    // Required if you want to access the distribution via config.targetDomain as well.
    aliases: [domain],

    origins: [
        {
            // originPath: '/static',
            originId: 'static-bucket',
            domainName: staticFilesBucket.bucketDomainName,
            customOriginConfig: {
                // Amazon S3 doesn't support HTTPS connections when using an S3 bucket configured as a website endpoint.
                // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-values-specify.html#DownloadDistValuesOriginProtocolPolicy
                originProtocolPolicy: 'http-only',
                httpPort: 80,
                httpsPort: 443,
                originSslProtocols: ['TLSv1.2'],
            },
        },
        {
            // originPath: '/',
            originId: 'ssr-lambda',
            domainName: apiGateway.apiEndpoint.apply(url =>
                url.replace(/^https?:\/\//, '')
            ),
            customOriginConfig: {
                // Amazon S3 doesn't support HTTPS connections when using an S3 bucket configured as a website endpoint.
                // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-values-specify.html#DownloadDistValuesOriginProtocolPolicy
                originProtocolPolicy: 'https-only',
                httpPort: 80,
                httpsPort: 443,
                originSslProtocols: ['TLSv1.2'],
            },
        },
    ],

    // defaultRootObject: 'index.html',

    // A CloudFront distribution can configure different cache behaviors based on the request path.
    // Here we just specify a single, default cache behavior which is just read-only requests to S3.
    defaultCacheBehavior: {
        targetOriginId: 'ssr-lambda',
        viewerProtocolPolicy: 'redirect-to-https',
        allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        cachedMethods: ['GET', 'HEAD', 'OPTIONS'],

        forwardedValues: {
            cookies: { forward: 'none' },
            queryString: false,
        },

        minTtl: 0,
        // defaultTtl: tenMinutes,
        defaultTtl: 15,
        // maxTtl: tenMinutes,
        maxTtl: 15,
    },
    orderedCacheBehaviors: [
        {
            pathPattern: '/static/*',
            allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
            cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
            targetOriginId: 'static-bucket',
            forwardedValues: {
                queryString: false,
                headers: ['Origin'],
                cookies: {
                    forward: 'none',
                },
            },
            minTtl: 0,
            defaultTtl: 86400,
            maxTtl: 31536000,
            compress: true,
            viewerProtocolPolicy: 'redirect-to-https',
        },
        {
            pathPattern: '/favicon.ico',
            allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
            cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
            targetOriginId: 'static-bucket',
            forwardedValues: {
                queryString: false,
                headers: ['Origin'],
                cookies: {
                    forward: 'none',
                },
            },
            minTtl: 0,
            defaultTtl: 86400,
            maxTtl: 31536000,
            compress: true,
            viewerProtocolPolicy: 'redirect-to-https',
        },
    ],

    // "All" is the most broad distribution, and also the most expensive.
    // "100" is the least broad, and also the least expensive.
    priceClass: 'PriceClass_100',

    // You can customize error responses. When CloudFront receives an error from the origin (e.g. S3 or some other
    // web service) it can return a different error code, and return the response for a different resource.
    // customErrorResponses: [
    //     { errorCode: 404, responseCode: 404, responsePagePath: '/404.html' },
    // ],

    restrictions: {
        geoRestriction: {
            restrictionType: 'none',
        },
    },

    viewerCertificate: {
        acmCertificateArn: existingCertArn, // Per AWS, ACM certificate must be in the us-east-1 region.
        sslSupportMethod: 'sni-only',
    },
}

// Create CloudFront Distribution
const cdn = new aws.cloudfront.Distribution(`${name}-cdn`, distributionArgs)
/**
 * DNS
 */

//  Create DNS record for apiGateway

const apiDnsRecord = new aws.route53.Record(
    `${name}-dns-record`,
    {
        name: domain,
        type: 'A',
        zoneId: selectedZone.zoneId,
        aliases: [
            {
                evaluateTargetHealth: false,
                name: cdn.domainName,
                zoneId: cdn.hostedZoneId,
                // name: gatewayDomainName.domainNameConfiguration.apply(
                //     domainNameConfiguration =>
                //         domainNameConfiguration.targetDomainName
                // ),
                // zoneId: gatewayDomainName.domainNameConfiguration.apply(
                //     domainNameConfiguration =>
                //         domainNameConfiguration.hostedZoneId
                // ),
            },
        ],
    },
    { dependsOn: [apiGateway] }
)
// }

// exports.url = apiProxy.invokeUrl
exports.dbArn = linksTable.arn
// exports.certUrn = certificate.urn
