import { AWSError, DynamoDB } from 'aws-sdk'
import { GetItemInput } from 'aws-sdk/clients/dynamodb'
import { ShortUrlItem } from './createLink'

export async function getLink(hash: string) {
    const dbTableName = process.env.DYNAMODB_NAME || 'brokenass-local-table'

    const isLocal = process.env.NODE_ENV !== 'production'

    const db = isLocal
        ? new DynamoDB.DocumentClient({
              endpoint: 'http://localhost:4567',
          })
        : new DynamoDB.DocumentClient({})

    // TODO errors on types if I use GetItemInput - needs to be redone without using deprecated Key Prop, byt works now so mehhh
    const getItemInput = {
        TableName: dbTableName,
        Key: {
            pk: 'shortUrl',
            urlHash: hash,
        },
    }

    try {
        const getItemOutput = await db.get(getItemInput).promise()
        // TODO ooooof prob need to sort this
        return getItemOutput.Item as ShortUrlItem
    } catch (error) {
        console.error(error)
    }
}
