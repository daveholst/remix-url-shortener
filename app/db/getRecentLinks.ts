import { AWSError, DynamoDB } from 'aws-sdk'
import { QueryInput } from 'aws-sdk/clients/dynamodb'
import { ShortUrlItem } from './createLink'

export async function getRecentLinks() {
    const dbTableName = process.env.DYNAMODB_NAME || 'brokenass-local-table'

    // TODO could porbably getting some better config handling for this
    const isLocal = process.env.NODE_ENV !== 'production'
    const db = isLocal
        ? new DynamoDB({
              endpoint: 'http://localhost:4567',
          })
        : new DynamoDB({})

    const getItemInput: QueryInput = {
        TableName: dbTableName,
        IndexName: 'createdAtIndex',
        ScanIndexForward: false,
        Limit: 50,
        KeyConditionExpression: '#3fee0 = :3fee0 And #3fee1 < :3fee1',
        ExpressionAttributeValues: {
            ':3fee0': {
                S: 'shortUrl',
            },
            ':3fee1': {
                N: new Date().getTime().toString(),
            },
        },
        ExpressionAttributeNames: {
            '#3fee0': 'pk',
            '#3fee1': 'createdAtEpoch',
        },
    }

    try {
        const getItemOutput = await db.query(getItemInput).promise()
        // sanitze the data
        const cleanItems: ShortUrlItem[] | undefined = getItemOutput.Items?.map(
            item => ({
                // TODO this empty string typing isn't ideal
                createdAt: item.createdAt.S || '',
                createdAtEpoch: parseInt(item.createdAt.N || ''),
                longUrl: item.longUrl.S || '',
                pk: item.pk.S || '',
                urlHash: item.urlHash.S || '',
            })
        )
        return cleanItems
    } catch (error) {
        console.error(error)
    }
}
