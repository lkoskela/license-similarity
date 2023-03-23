import { matchLicenses } from "../../src"

describe('matchLicenses', () => {

    describe('returns an empty list for obviously non-matching input', () => {
        it('empty text', () => {
            expect(matchLicenses('')).toStrictEqual([])
            expect(matchLicenses('\t\n  \n  \t')).toStrictEqual([])
        })

        it('short text that is obviously not a license', () => {
            expect(matchLicenses('obviously not a license')).toStrictEqual([])
        })

        it('long text that is obviously not a license', () => {
            expect(matchLicenses([
                'This is a long text but obviously',
                'not even close to one of the license',
                'texts that can be found from the SPDX',
                'database of licenses. In order to match,',
                'this text would have to be reasonably',
                'close to a known license both in terms',
                'of length (as measured by characters',
                'after normalization) and content (as',
                'measured by computing a Sorensen-Dice',
                'coefficient between this input and a',
                'known license\'s license text.'
            ].join('\n'))).toStrictEqual([])
        })
    })
})