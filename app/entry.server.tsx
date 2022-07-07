import type { EntryContext } from '@remix-run/node'
import { RemixServer } from '@remix-run/react'
import ReactDOMServer from 'react-dom/server'
import { getCssText } from './styles/stitches.config'

export default function handleRequest(
    request: Request,
    responseStatusCode: number,
    responseHeaders: Headers,
    remixContext: EntryContext
) {
    // let markup = renderToString(
    //     <RemixServer context={remixContext} url={request.url} />
    // )
    console.log('REQUEST REC :: ', request)
    /* Getting stitches working in remix as per https://rossmoody.com/writing/remix-stitches */
    const markup = ReactDOMServer.renderToString(
        <RemixServer context={remixContext} url={request.url} />
    ).replace(/<\/head>/, `<style id="stitches">${getCssText()}</style></head>`)

    responseHeaders.set('Content-Type', 'text/html')

    return new Response('<!DOCTYPE html>' + markup, {
        status: responseStatusCode,
        headers: responseHeaders,
    })
}
