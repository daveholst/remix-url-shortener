import * as pulumi from '@pulumi/pulumi'
import { BuildResult } from 'esbuild'
import { bundleAndZip } from './bundleAndZip'
// import { runCommandThatMustSucceed } from './run-command'

export interface BundleLambdaArgs {
    /**
     * Relative Build files directory location
     */
    buildDir: pulumi.Input<string>
    /**
     * Entry File
     */
    entryFile: pulumi.Input<string>
}

export interface Result {
    buildRes: BuildResult
    zipRes: boolean
}

export class BundleLambdaFiles extends pulumi.ComponentResource {
    public bundleResult: pulumi.Output<boolean>
    public done: pulumi.Output<boolean>

    constructor(
        name: string,
        args: BundleLambdaArgs,
        opts?: pulumi.ComponentResourceOptions
    ) {
        super('bundle-lambda', name, {}, opts)

        const bundleResult = pulumi.output(args).apply(async bundleArgs => {
            if (
                pulumi.runtime.isDryRun() &&
                !pulumi.runtime.isTestModeEnabled()
            ) {
                return bundleAndZip(bundleArgs.buildDir, bundleArgs.entryFile)
            }

            return false
        })

        this.bundleResult = bundleResult
        this.done = bundleResult.apply(() => true)

        this.registerOutputs({
            bundleResult: this.bundleResult,
            done: this.done,
        })
    }
}
