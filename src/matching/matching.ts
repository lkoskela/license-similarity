import { normalize } from "../algorithms/normalize"
import { computeLength } from "../algorithms/text-length"
import { License } from '../data/types'
import { diceCoefficient, diceCoefficientForVectors } from "../algorithms/dice-coefficient"
import { TokenDatabase } from "./token-database"
import { extractLicenseText } from "./extraction"
import { join } from "path"
import { deserializePrecomputedData } from "../data/precomputed"


const precomputed = deserializePrecomputedData(join(__dirname, '../codegen/precomputed.json'))
const database = TokenDatabase.fromPrecomputedData(precomputed)

/**
 * Record for a computed Match between a given input and a specific license.
 */
export type Match = {
    licenseId: string,
    score: number
}

/**
 * Options for {@link identifyLicense}.
 */
export type IdentifyOptions = {
    /**
     * The (Sorensen-Dice coefficient) similarity score threshold to use
     * as a minimum for a license to be considered a match.
     *
     * Default value: `0.90`
     */
    threshold?: number,

    /**
     * The maximum number of matches to return from {@link matchLicenses}.
     *
     * Default value: `10`
     */
    max?: number,

    /**
     * If `true`, forces a character-wise computed Sorensen-Dice coefficient
     * computation regardless of the analyzed texts' length.
     *
     * Default value: `false`
     */
    forceCharacterBasedDice?: boolean,
}

const defaultOptions: IdentifyOptions = {
    threshold: 0.90,
    max: 10,
    forceCharacterBasedDice: false,
}

/**
 * Filter a list of licenses based on the provided license text's length, only considering
 * licenses whose text is within a certain threshold percentage of the input's length.
 *
 * @param text The text we're going to be comparing licenses to
 * @param licenses The list of licenses to (potentially) compare the input to
 * @param threshold The allowed diff as a percentage of the input's length. E.g. 0.20 means
 *                  don't bother processing texts that differ more than 20% in length.
 * @returns A filtered list of licenses that are realistic candidates based on their length
 */
const filterByLength = (text: string, licenses: License[], threshold: number = 0.2): License[] => {
    const inputLength = computeLength(text)
    return licenses.filter(license => {
        const length = precomputed.licenseLengths[license.licenseId]
        return (Math.abs(length - inputLength) / Math.max(inputLength, length)) < threshold
    })
}

/**
 * Sort matches by score, license deprecation status (e.g. "GPL-3.0") as a tie-breaker, and
 * license identifier length as a last resort.
 *
 * @param matches The matches to sort.
 * @returns Sorted matches.
 */
const sortMatches = (matches: Match[]): Match[] => {
    const compareMatches = (a: Match, b: Match) => {
        // First, sort by score
        const scoreDifference = b.score - a.score
        if (scoreDifference !== 0) return scoreDifference

        // If scores are equal, sort by license being deprecated or not
        const aDeprecationScore = !!precomputed.licenseDeprecations[a.licenseId] ? 0 : 1
        const bDeprecationScore = !!precomputed.licenseDeprecations[b.licenseId] ? 0 : 1
        const deprecationDifference = bDeprecationScore - aDeprecationScore
        if (deprecationDifference !== 0) return deprecationDifference

        // If deprecation statuses are also equal, sort the shorter license ID first
        // because it's probably the more generic and we have no reason to believe
        // that the context would point to the more specific license.
        return b.licenseId.length - a.licenseId.length
    }
    return matches.sort(compareMatches)
}

/**
 * Trim the given list of matches based on options such as `max` (for maximum number
 * of matches to return).
 *
 * @param matches Matches to filter
 * @param options {@link IdentifyOptions} potentially defining a `max` option to apply.
 * @returns A list of matches trimmed according to the provided options.
 */
const filterMatches = (matches: Match[], options: IdentifyOptions): Match[] => {
    const maxMatches = options.max || 0
    if (maxMatches > 0) {
        return matches.slice(0, maxMatches)
    } else {
        return matches
    }
}

const computeMatches = (text: string, licenses: License[], options: IdentifyOptions): Match[] => {
    const threshold = options.threshold || 0
    const matches: Match[] = []
    licenses.forEach(license => {
        const licenseId = license.licenseId
        const score = computeMatch(text, license, !!options.forceCharacterBasedDice)
        if (score >= threshold) {
            matches.push({ licenseId, score })
        }
    })
    return matches
}

const computeMatch = (input: string, candidate: License, forceCharacterBasedDice: boolean): number => {
    if (forceCharacterBasedDice || input.length < 100) {
        return diceCoefficient(input, candidate.licenseText)
    } else {
        let vector1 = database.tokenize(input)
        let vector2 = database.tokenize(candidate.licenseText, candidate.licenseId)
        return diceCoefficientForVectors(vector1, vector2)
    }
}

/**
 * Identify the best matching licenses, sorted closest match first, for the given license text.
 *
 * @param text The license text to match against known SPDX licenses.
 * @param options {@link IdentifyOptions} to configure the matching process with.
 * @returns An array of {@link Match} providing license identifiers along with their respective similarity scores.
 */
export const matchLicenses = (text: string, options?: IdentifyOptions): Match[] => {
    const licenseText = extractLicenseText(text)
    const trimmedText = normalize(licenseText)
    if (trimmedText.length === 0) return []
    const lengthBasedCandidates = filterByLength(trimmedText, precomputed.licenses)
    const effectiveOptions: IdentifyOptions = { ...defaultOptions, ...(options || {}) }
    let matches: Match[] = sortMatches(computeMatches(trimmedText, lengthBasedCandidates, effectiveOptions))
    // if (matches.length > 1 && matches[0] === matches[1] && !effectiveOptions.forceCharacterBasedDice) {
    //     const adjustedOptions = { ...effectiveOptions, forceCharacterBasedDice: true }
    //     const candidates: License[] = lengthBasedCandidates.filter(c => !!matches.find(m => m.licenseId === c.licenseId))
    //     matches = sortMatches(computeMatches(trimmedText, candidates, adjustedOptions))
    // }
    return filterMatches(matches, effectiveOptions)
}

/**
 * Identify which standard (SPDX) license the given license text matches closest to.
 *
 * @param text License text to identify.
 * @param options {@link IdentifyOptions} to configure the matching process with.
 * @returns The best matching license's SPDX identifier, or `undefined` if a good enough match was not found.
 */
export const identifyLicense = (text: string, options?: IdentifyOptions): string|undefined => {
    const matches = matchLicenses(text, options)
    return matches[0]?.licenseId
}
