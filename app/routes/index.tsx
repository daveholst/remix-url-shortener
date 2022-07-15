import { ActionFunction, json, LoaderFunction } from '@remix-run/node'
import { Banner } from '~/components/Banner'
import { GeneratedLink, StyledLinkForm, StyledSubTitle } from './index.styled'
import {
    useActionData,
    useCatch,
    useLoaderData,
    useTransition,
} from '@remix-run/react'
import { createLink, ShortUrlItem } from '~/db/createLink'
import { getRecentLinks } from '~/db/getRecentLinks'
import { ListedLink } from '~/components/ListedLink'

/* Serverside Form handler */
export const action: ActionFunction = async ({
    request,
}): Promise<Response | ActionData> => {
    const formData = await request.formData()
    const rawUrl = formData.get('rawurl')

    try {
        if (typeof rawUrl === 'string') {
            const dbData = await createLink(rawUrl)
            return json(dbData, { status: 200 })
        }
        return json('rawUrl is not of type string', { status: 500 })
    } catch (error) {
        return json(error, { status: 500 })
    }
}
/* Recent links dataloader */
export const loader: LoaderFunction = async () => {
    const result = await getRecentLinks()
    return result || null
}

// TODO better typing and error handling here
interface ActionData {
    createdAt: string
    createdAtEpoch: number
    longUrl: string
    pk: string
    urlHash: string
}

export default function Index() {
    // Data Loader
    const recentLinks = useLoaderData() as ShortUrlItem[]
    // Form Mutation Handler
    const actionData = useActionData<ActionData | undefined>()
    // Form Submission Status Hook
    const transition = useTransition()

    // copy gnerated hash url to clipboard on form success
    if (actionData?.urlHash && navigator.clipboard) {
        console.log('Clipboard API available')
        navigator.clipboard.writeText(
            `https://link.dh.wtf/${actionData.urlHash}`
        )
    }
    return (
        <>
            <Banner />
            <StyledLinkForm method="post">
                <fieldset disabled={transition.state === 'submitting'}>
                    <label>
                        <input
                            type="text"
                            name="rawurl"
                            placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                        />
                    </label>
                    <button type="submit">
                        {transition.state === 'submitting'
                            ? 'Creating...'
                            : 'El Shorten'}
                    </button>
                </fieldset>
                {actionData && (
                    // TODO is there a better Link style component for this?
                    <GeneratedLink href={actionData.urlHash}>
                        {`https://link.dh.wtf/${actionData.urlHash}`}
                    </GeneratedLink>
                )}
                {/* TODO style this error box out? lol, maybe handle errors, idk */}
                {/* {actionData && actionData.errors.rawurl ? (
                    <p style={{ color: 'red' }}>
                        {actionData.errors.description}
                    </p>
                ) : null} */}
            </StyledLinkForm>
            <StyledSubTitle>Here are some I prepared earlier...</StyledSubTitle>
            {recentLinks &&
                recentLinks.map((link, i) => (
                    <ListedLink
                        key={`prev-link-${i}`}
                        short={link.urlHash}
                        long={link.longUrl}
                    />
                ))}
        </>
    )
}

export function CatchBoundary() {
    const caught = useCatch()
    //TODO write a proper error boundary following pattern below
    // if (caught.status === 401) {
    //   return (
    //     <div className="error-container">
    //       <p>You must be logged in to create a joke.</p>
    //       <Link to="/login">Login</Link>
    //     </div>
    //   );
    // }

    throw new Error(`Unexpected caught response with status: ${caught.status}`)
}
