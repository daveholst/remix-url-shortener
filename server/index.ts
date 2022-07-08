import { createRequestHandler } from '@remix-run/architect'
import { ServerBuild } from '@remix-run/node'

// const build = require('./build') as ServerBuild
// eslint-disable-next-line @typescript-eslint/no-var-requires
const build = require('./build') as ServerBuild

exports.handler = createRequestHandler({
    build,
    getLoadContext(event) {
        // use lambda event to generate a context for loaders
        return {}
    },
})
