import * as pulumi from '@pulumi/pulumi'
import * as aws from '@pulumi/aws'
import {
    crawlDirectory,
    getDomainAndSubdomain,
    BundleLambdaFiles,
} from './utils'
import path from 'path'
import * as mime from 'mime'

// This is the path to the other project relative to the CWD
const projectRoot = './'
const staticFiles = '../public'

// const stackName = pulumi.getStack()
const name = 'link-shortener'
const domain = 'link.dh.wtf'
const dbName = 'link-shortener-table'
const domainParts = getDomainAndSubdomain(domain)
const tenMinutes = 60 * 10

// TODO move this out to config
const existingCertArn =
    'arn:aws:acm:us-east-1:739766728346:certificate/fb2c29a3-f51f-4ac8-9813-89c5ecd7a13b'

/**
 * Domain & Certs
 */

// create the zone if running on local stack
// const selectedZone = new aws.route53.Zone(domainParts.parentDomain, {})

// Get the hosted zone by domain name
const selectedZone = pulumi.output(
    aws.route53.getZone({ name: domainParts.parentDomain }, { async: true })
)

// TODO keeping these incase they have to be mocked in localstack env

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
            name: 'pk',
            type: 'S',
        },
        {
            name: 'urlHash',
            type: 'S',
        },
        {
            name: 'createdAtEpoch',
            type: 'N',
        },
    ],
    hashKey: 'pk',
    rangeKey: 'urlHash',
    globalSecondaryIndexes: [
        {
            hashKey: 'pk',
            name: 'createdAtIndex',
            projectionType: 'ALL',
            rangeKey: 'createdAtEpoch',
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
// bundle and zip files for lambda
const lambdaBundle = new BundleLambdaFiles(`${name}-bundle-files`, {
    buildDir: '../server',
    entryFile: 'index.ts',
})

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
const lambda = new aws.lambda.Function(
    `${name}-lambda-fucntion`,
    {
        code: new pulumi.asset.FileArchive(
            path.resolve(projectRoot, 'lambda-bundle.zip')
        ),
        runtime: 'nodejs14.x',
        role: lambdaRole.arn,
        handler: 'index.handler',
        memorySize: 2048,
        environment: {
            variables: {
                DYNAMODB_NAME: linksTable.name,
            },
        },
    },
    { dependsOn: lambdaBundle }
)

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
        integrationType: 'AWS_PROXY',
        integrationUri: lambda.arn,
        integrationMethod: 'POST',
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

// api gateway stage
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

/**
 * Static Assets Bucket
 */

// Create an s3 bucket
const staticFilesBucket = new aws.s3.Bucket(`${name}-static-files-bucket`, {
    bucket: domain,
    acl: 'public-read',
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
    aliases: [domain],

    origins: [
        {
            originId: 'static-bucket',
            domainName: staticFilesBucket.bucketDomainName,
            customOriginConfig: {
                // Amazon S3 doesn't support HTTPS connections when using an S3 bucket
                originProtocolPolicy: 'http-only',
                httpPort: 80,
                httpsPort: 443,
                originSslProtocols: ['TLSv1.2'],
            },
        },
        {
            originId: 'ssr-lambda',
            // CF required the domain name to not be prefixed with http/https
            domainName: apiGateway.apiEndpoint.apply(url =>
                url.replace(/^https?:\/\//, '')
            ),
            customOriginConfig: {
                originProtocolPolicy: 'https-only',
                httpPort: 80,
                httpsPort: 443,
                originSslProtocols: ['TLSv1.2'],
            },
        },
    ],
    defaultCacheBehavior: {
        targetOriginId: 'ssr-lambda',
        viewerProtocolPolicy: 'https-only',
        allowedMethods: [
            'GET',
            'HEAD',
            'OPTIONS',
            'PUT',
            'PATCH',
            'POST',
            'DELETE',
        ],
        cachedMethods: ['GET', 'HEAD', 'OPTIONS'],

        forwardedValues: {
            cookies: { forward: 'all' },
            queryString: true,
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
                queryString: true,
                headers: ['Origin'],
                cookies: {
                    forward: 'all',
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
    priceClass: 'PriceClass_All',

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

// Create CloudFront Distribution from config
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
            },
        ],
    },
    { dependsOn: [apiGateway] }
)
// }

exports.dbArn = linksTable.arn
exports.dbName = linksTable.name
