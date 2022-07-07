import { createRequestHandler } from '@remix-run/architect'
import { ServerBuild } from '@remix-run/node'

const build = require('./build') as ServerBuild

exports.handler = createRequestHandler({
    build,
    getLoadContext(event) {
        console.log('GW EVENT :: ', event)
        // use lambda event to generate a context for loaders
        return {}
    },
})
