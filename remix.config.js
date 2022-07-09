/** @type {import('@remix-run/dev').AppConfig} */
// eslint-disable-next-line no-undef
module.exports = {
    appDirectory: "app",
    assetsBuildDirectory: "public/static",
    publicPath: "/static/",
    serverBuildDirectory: "server/build",
    // This seems to fix a gotchya with ESM modules
    serverDependenciesToBundle: ["nanoid"]
}
