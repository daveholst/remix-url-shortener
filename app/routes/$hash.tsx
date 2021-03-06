import { json, LoaderFunction, redirect } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { getLink } from '~/db/getLink'

export const loader: LoaderFunction = async ({ params }) => {
    const { hash } = params
    // check the db for the long url, if exists redirect to it
    if (hash) {
        const result = await getLink(hash)
        if (result?.longUrl) {
            throw redirect(result.longUrl)
        }
        return null
    }
}

export default function PostSlug() {
    const result = useLoaderData()
    return (
        <main className="mx-auto max-w-4xl">
            <h1 className="my-6 border-b-2 text-center text-3xl"></h1>
            {/* TODO better ux here  */}
            <p>No redirect found. Result: {JSON.stringify(result, null, 2)}</p>
        </main>
    )
}
