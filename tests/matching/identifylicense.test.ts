import { identifyLicense } from '../../src/index'
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
