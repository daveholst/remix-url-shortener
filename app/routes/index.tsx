import { ActionFunction, json } from '@remix-run/node'
import { Banner } from '~/components/Banner'
// import { LinkForm } from '~/components/LinkForm'
import { GeneratedLink, StyledLinkForm } from './index.styled'
import { Form, useActionData, useCatch, useTransition } from '@remix-run/react'
import { createLink } from '~/utils/createLink'

/* Serverside Form handler -- I imagine this would work better hitting a microservice */
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

    // return formData
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
    const actionData = useActionData<ActionData | undefined>()

    const transition = useTransition()
    return (
        <>
            <Banner />
            <StyledLinkForm method="post">
                <fieldset disabled={transition.state === 'submitting'}>
                    <label>
                        <input
                            type="text"
                            name="rawurl"
                            // defaultValue={actionData?.fields?.rawurl}
                            // value={linkInput}
                            placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                        />
                    </label>
                    {/* TODO does an api exist that listens to the paste event??? */}
                    <button type="submit">
                        {transition.state === 'submitting'
                            ? 'Creating...'
                            : 'Bill Shorten'}
                    </button>
                </fieldset>
                {/* TODO just a placeholder for now */}
                {actionData && (
                    // TODO is there a better Link style component for this?
                    <GeneratedLink href={actionData.urlHash}>
                        {`https://link.dh.wtf/${actionData.urlHash}`}
                    </GeneratedLink>
                )}

                {/* TODO style this error box out? */}
                {/* {actionData && actionData.errors.rawurl ? (
                    <p style={{ color: 'red' }}>
                        {actionData.errors.description}
                    </p>
                ) : null} */}
            </StyledLinkForm>
        </>
    )
}

export function CatchBoundary() {
    const caught = useCatch()

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
