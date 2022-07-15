export function getShortName(url: string) {
    if (url.includes('www')) {
        return url.split('.')[1]
    } else {
        // short url ie. https://github.com/localstack/localstack
        const splitDomain = url.split('//')[1]
        if (url.includes('.')) {
            return splitDomain?.split('.')[0]
        }
        return '???'
    }
}
