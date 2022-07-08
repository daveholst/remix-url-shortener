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

// currently using ../server

// bundle the files from remix
export async function bundleAndZip(root: string, entry: string) {
    const buildDirRoot = root
    const entryPoint = path.resolve(buildDirRoot, entry)
    try {
        const buildRes = await build({
            bundle: true,
            entryPoints: [entryPoint],
            outdir: './bundled',
            platform: 'node',
            target: 'node14',
            external: ['aws-sdk'],
            sourcesContent: false,
            sourcemap: true,
            logLevel: 'info',
            define: {
                'require.resolve': null,
            },
        }).catch(() => process.exit(1))
        const zipRes = await zip('./bundled', './lambda-bundle.zip')
        const result =
            buildRes.errors.length === 0 && typeof zipRes === undefined
        return result
    } catch (error) {
        console.error(error)
        throw new Error(error)
    }
}
