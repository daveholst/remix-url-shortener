import { build } from 'esbuild'
import { zip } from 'zip-a-folder'
import path from 'path'

async function zipper(bundle: string) {
    // const zip = new JSZip()
    // zip.file('index.js', bundle)
    // const buf = await zip.generateAsync()
    // return buf
}

// TODO come back to writing this. just going to use a package for now.

const projectRoot = '../server'
const entryPoint = path.resolve(projectRoot, 'index.ts')

// bundle the files from remix
export async function bundleAndZip() {
    const buildRes = await build({
        bundle: true,
        entryPoints: [entryPoint],
        outdir: './bundled',
        platform: 'node',
        target: 'node14',
        external: ['aws-sdk'],
        sourcesContent: false,
        sourcemap: true,
        logLevel: 'debug',
        define: {
            'require.resolve': null,
        },
    }).catch(() => process.exit(1))
    console.log('Build Result :: ', buildRes)
    // const zipRes = await zipper('./bundled')
    const zipRes = await zip('./bundled', './lambda-bundle.zip')
    console.log('Zip Result :: ', zipRes)
    return { buildRes, zipSuccess: !zipRes && true }
}
