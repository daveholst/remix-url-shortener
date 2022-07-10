import { nanoid } from 'nanoid'
import { AWSError, DynamoDB } from 'aws-sdk'

export interface ShortUrlItem {
    pk: string
    urlHash: string
    longUrl: string
    createdAt: string
    createdAtEpoch: number
}

export async function createLink(longUrl: string) {
    // TODO mock in dynalite for local or get localstack working again
    // feels jank, should be programatic
    const dbTableName = process.env.DYNAMODB_NAME || 'brokenass-local-table'
    // hash the url in 6 chars
    const urlHash = nanoid(6)
    const date = new Date()

    const isLocal = process.env.NODE_ENV !== 'production'
    let db

    // if running Remix in local dev, write a table to dynalite if required
    if (isLocal) {
        const dbClient = new DynamoDB({
            endpoint: 'http://localhost:4567',
        })
        const schema = {
            AttributeDefinitions: [
                {
                    AttributeName: 'pk',
                    AttributeType: 'S',
                },
                {
                    AttributeName: 'urlHash',
                    AttributeType: 'S',
                },
                {
                    AttributeName: 'createdAtEpoch',
                    AttributeType: 'N',
                },
            ],
            KeySchema: [
                {
                    AttributeName: 'pk',
                    KeyType: 'HASH',
                },
                {
                    AttributeName: 'urlHash',
                    KeyType: 'RANGE',
                },
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5,
            },
            TableName: dbTableName,
            GlobalSecondaryIndexes: [
                {
                    IndexName: 'createdAtIndex',
                    KeySchema: [
                        {
                            AttributeName: 'pk',
                            KeyType: 'HASH',
                        },
                        {
                            AttributeName: 'createdAtEpoch',
                            KeyType: 'RANGE',
                        },
                    ],
                    Projection: {
                        ProjectionType: 'ALL',
                    },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 5,
                        WriteCapacityUnits: 5,
                    },
                },
            ],
        }
        // check if tables exists

        const tablesList = await dbClient.listTables().promise()

        if (!tablesList.TableNames?.includes(dbTableName)) {
            await dbClient
                .createTable(schema, (e, d) => console.log(e || d))
                .promise()
            const sleep = (delay: number) =>
                new Promise(resolve => setTimeout(resolve, delay))
            sleep(550)
        }

        db = new DynamoDB.DocumentClient({
            endpoint: 'http://localhost:4567',
        })
    } else {
        db = new DynamoDB.DocumentClient()
    }

    console.log('urlhash', urlHash)
    // TODO add some checks that the hash is unique
    // add the key pair to the db
    if (!dbTableName)
        throw new Error('DB table name - environment variable not found')
    try {
        const item: ShortUrlItem = {
            pk: 'shortUrl',
            urlHash,
            longUrl: longUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            createdAt: date.toISOString(),
            createdAtEpoch: date.getTime(),
        }

        await db
            .put({
                TableName: dbTableName,
                Item: item,
                ConditionExpression: 'attribute_not_exists(urlHash)',
            })
            .promise()
        return item
    } catch (e) {
        console.error(e)
        return e as AWSError
    }
}
