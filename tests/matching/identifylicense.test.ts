import { identifyLicense, matchLicenses } from '../../src/index'
import { samples } from '../samples/samples'
import { Licenses } from '../../src/data/types'

import licensesJson from '../codegen/licenses.json'
const licenses = (licensesJson as Licenses).licenses

const licenseTextFor = (licenseId: string): string => {
    return licenses.find(l => l.licenseId === licenseId)?.licenseText as string
}

describe('identifyLicense', () => {

    test.each(['Apache-2.0', '0BSD', 'MIT', 'GPL-3.0-or-later'])('%s', (licenseId: string) => {
        expect(identifyLicense(licenseTextFor(licenseId))).toStrictEqual(licenseId)
    })

    describe('The Unlicense', () => {
        it('Unlicense text from the SPDX database', () => {
            expect(identifyLicense(licenseTextFor('Unlicense'))).toStrictEqual('Unlicense')
        })

        it('Unlicense text from a Github repo', () => {
            const text =
                'This is free and unencumbered software released into the public domain.\n' +
                '\n' +
                'Anyone is free to copy, modify, publish, use, compile, sell, or\n' +
                'distribute this software, either in source code form or as a compiled\n' +
                'binary, for any purpose, commercial or non-commercial, and by any\n' +
                'means.\n' +
                '\n' +
                'In jurisdictions that recognize copyright laws, the author or authors\n' +
                'of this software dedicate any and all copyright interest in the\n' +
                'software to the public domain. We make this dedication for the benefit\n' +
                'of the public at large and to the detriment of our heirs and\n' +
                'successors. We intend this dedication to be an overt act of\n' +
                'relinquishment in perpetuity of all present and future rights to this\n' +
                'software under copyright law.\n' +
                '\n' +
                'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,\n' +
                'EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\n' +
                'MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.\n' +
                'IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR\n' +
                'OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,\n' +
                'ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR\n' +
                'OTHER DEALINGS IN THE SOFTWARE.\n' +
                '\n' +
                'For more information, please refer to <http://unlicense.org/>'

            // console.warn(`From Github: ${text}\nFrom SPDX: ${licenseTextFor('Unlicense')}`)
            // console.warn(`matchLicenses when forceCharacterBasedDice: false => ${JSON.stringify(matchLicenses(text, { forceCharacterBasedDice: false, threshold: 0.75 }), null, 2)}`)
            // console.warn(`matchLicenses when forceCharacterBasedDice: true => ${JSON.stringify(matchLicenses(text, { forceCharacterBasedDice: true, threshold: 0.75 }), null, 2)}`)

            expect(identifyLicense(text, { forceCharacterBasedDice: true, threshold: 0.75, max: 1 })).toStrictEqual('Unlicense')

        })
    })

    describe('GPL-3.0 and GPL-3.0+', () => {

        it('GPL-3.0 and GPL-3.0-or-later have identical license text', () => {
            expect(licenseTextFor('GPL-3.0')).toStrictEqual(licenseTextFor('GPL-3.0-or-later'))
        })

        it('GPL-3.0/GPL-3.0-or-later text is resolved to the non-deprecated version', () => {
            const text = licenseTextFor('GPL-3.0-or-later')
            expect(identifyLicense(text)).toStrictEqual('GPL-3.0-or-later')
        })
    })

    describe.each(['BSD-2-Clause', 'MIT', 'Apache-2.0'])('Variations of %s', (licenseId: string) => {
        samples(licenseId).forEach(sample => {
            it(sample.relativePath, () => {
                expect(identifyLicense(sample.text)).toStrictEqual(licenseId)
            })
        })
    })
})
