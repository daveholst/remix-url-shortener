import { assert, expect, test } from 'vitest'
import { getShortName } from '.'
const cases = [
    {
        input: 'https://github.com/localstack/localstack',
        expected: 'github',
    },
    {
        input: 'https://www.youtube.com/watch?v=NMWzgy8FsKs',
        expected: 'youtube',
    },
    {
        input: 'http://www.google.com/search?q=Test&sxsrf=ALiCzsZJ7XDjmGTp9BLaIRsCKpwlaQAdfA%3A1657787556137&source=hp&ei=pNTPYpvxBaTR2roPiMuWsAU&iflsig=AJiK0e8AAAAAYs_itMIMVR9SiyodzrFHOONnqst7weID&ved=0ahUKEwib05Pz-_f4AhWkqFYBHYilBVYQ4dUDCAk&uact=5&oq=Test&gs_lcp=Cgdnd3Mtd2l6EAMyBAgjECcyBAgjECcyEQguEIAEELEDEIMBEMcBENEDMgsIABCABBCxAxCDATILCAAQgAQQsQMQgwEyDgguEIAEELEDEMcBENEDMhEILhCABBCxAxCDARDHARDRAzIICAAQgAQQsQMyEQguEIAEELEDEMcBENEDENQCMgsIABCABBCxAxCDAToLCC4QgAQQsQMQgwE6FAguEIAEELEDEIMBEMcBENEDENQCUABYrgRg4wVoAHAAeACAAY0CiAHYA5IBAzItMpgBAKABAQ&sclient=gws-wiz',
        expected: 'google',
    },
]

cases.map(testCase => {
    test(`Correctly shortens URL name - ${testCase.expected} `, () => {
        const result = getShortName(testCase.input)
        expect(result).eq(testCase.expected)
    })
})
