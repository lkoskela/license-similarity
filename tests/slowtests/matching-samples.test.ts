import { identifyLicense, matchLicenses, Match } from '../../src/index'
import { diceCoefficient } from '../../src/algorithms/dice-coefficient'
import { License, Licenses } from '../../src/data/types'
import { IdentifyOptions } from '../../src/matching/matching'
import { Sample, samples, updateSampleLicenseOriginals, samplesByLicense } from '../samples/samples'
import { extractLicenseText } from '../../src/matching/extraction'
import { PairOf, pairsOf } from '../_utils'

import licensesJson from '../codegen/licenses.json'
const licenses = (licensesJson as Licenses).licenses


updateSampleLicenseOriginals()

const samplesByLicenseId = samplesByLicense()

const bestMatchOptions: IdentifyOptions = { max: 10, threshold: 0.8 }

// Limit the set of samples we test for based on the environment variable "FULL_TESTS"
const testedLicenseIds = process.env.FULL_TESTS ? Object.keys(samplesByLicenseId) : ['MIT', 'Apache-2.0']

describe('Samples are similar to each other', () => {
    testedLicenseIds.forEach(licenseId => {
        describe(licenseId, () => {
            const permutations: Array<PairOf<Sample>> = pairsOf(samplesByLicenseId[licenseId])
            test.each(permutations)(`$left.relativePath vs $right.relativePath`, (pairing: PairOf<Sample>) => {
                const a = extractLicenseText(pairing.left.text)
                const b = extractLicenseText(pairing.right.text)
                expect(diceCoefficient(a, b)).toBeGreaterThan(0.8)
            })
        })
    })
})

describe('Samples are similar to license text coming through our API', () => {
    testedLicenseIds.forEach(licenseId => {
        const license = licenses.find(l => l.licenseId === licenseId) as License
        test.each(samplesByLicenseId[licenseId])(`${licenseId} vs $path`, (sample: Sample) => {
            const a = extractLicenseText(sample.text)
            const b = extractLicenseText(license.licenseText)
            expect(diceCoefficient(a, b)).toBeGreaterThan(0.8)
        })
    })
})

if (process.env.FULL_TESTS) {

    describe('Variations of 0BSD', () => {

        samples('0BSD').forEach(sample => {
            describe(sample.relativePath, () => {
                let identifiedLicense: string|undefined
                let bestMatches: Match[]
                let bestMatchIds: string[]

                beforeAll(() => {
                    identifiedLicense = identifyLicense(sample.text)
                    bestMatches = matchLicenses(sample.text, bestMatchOptions)
                    bestMatchIds = bestMatches.map(x => x.licenseId)
                })

                it('Best matches include ISC, which is almost identical', () => {
                    expect(bestMatchIds).toContainEqual('0BSD')
                    expect(bestMatchIds).toContainEqual('ISC')
                })

                it('The (intended) best match has a high score', () => {
                    const intendedMatch = bestMatches.find(m => m.licenseId === '0BSD')
                    expect(intendedMatch).toBeDefined()
                    expect(intendedMatch?.score).toBeGreaterThan(0.5)
                })

                it('The single best match is correct', () => {
                    expect(identifiedLicense).toStrictEqual('0BSD')
                })
            })
        })
    })

    describe('Variations of BSD-2-Clause', () => {

        samples('BSD-2-Clause').forEach(sample => {
            describe(sample.relativePath, () => {
                let identifiedLicense: string|undefined
                let bestMatches: Match[]
                let bestMatchIds: string[]

                beforeAll(() => {
                    identifiedLicense = identifyLicense(sample.text)
                    bestMatches = matchLicenses(sample.text, bestMatchOptions)
                    bestMatchIds = bestMatches.map(x => x.licenseId)
                })

                it('Best matches include similar BSD licenses', () => {
                    expect(bestMatchIds).toContainEqual('BSD-2-Clause')
                    expect(bestMatchIds).toContainEqual('BSD-2-Clause-FreeBSD')
                    expect(bestMatchIds).toContainEqual('BSD-2-Clause-NetBSD')
                    expect(bestMatchIds).toContainEqual('BSD-2-Clause-Views')
                    expect(bestMatchIds).toContainEqual('BSD-3-Clause')
                })

                it('The (intended) best match has a high score', () => {
                    const intendedMatch = bestMatches.find(m => m.licenseId === 'BSD-2-Clause')
                    expect(intendedMatch).toBeDefined()
                    expect(intendedMatch?.score).toBeGreaterThan(0.5)
                })

                it('The single best match is correct', () => {
                    expect(identifiedLicense).toStrictEqual('BSD-2-Clause')
                })
            })
        })
    })
}
