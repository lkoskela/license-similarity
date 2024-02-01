import { extractLicenseText } from "../matching/extraction"

const URL_REGEX = /http[s]?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+/g
const COPYRIGHT_NOTICE_REGEX = /((?<=\n)|.*?)Copyright.+?(?=\n)|(Copyright.+?\n)/i
const COPYRIGHT_SYMBOLS = /[©Ⓒⓒ]/g
const BULLETS_NUMBERING_REGEX = /\s(([0-9a-z]\.\s)+|(\([0-9a-z]\)\s)+|(\*\s)+)|(\s\([i]+\)\s)/g
const PUNCTUATION_REGEX = /[,_\-"'*]|((?<=[a-zA-Z]{2})\.)/g
const QUOTES_REGEX = /["'`´\u201C\u201D\u2018\u2019]/g
const CSTYLE_COMMENTS_REGEX = /\/\*.*?\*\//sg
const COMMENTS_REGEX = /(\/\/|#).*(\n|$)/g
const EXTRANEOUS_REGEX = /\s*end of terms and conditions.*/sig
const ADDENDIUM_EXHIBIT_REGEX = /(APPENDIX|APADDENDUM|EXHIBIT).*/
const VARIETAL_WORDS_SPELLING: {[name:string]: string} = {
    'acknowledgment': 'acknowledgement',
    'analogue': 'analog',
    'analyse': 'analyze',
    'artefact': 'artifact',
    'authorisation': 'authorization',
    'authorised': 'authorized',
    'calibre': 'caliber',
    'cancelled': 'canceled',
    'capitalisations': 'capitalizations',
    'catalogue': 'catalog',
    'categorise': 'categorize',
    'centre': 'center',
    'emphasised': 'emphasized',
    'favour': 'favor',
    'favourite': 'favorite',
    'fulfil': 'fulfill',
    'fulfilment': 'fulfillment',
    'initialise': 'initialize',
    'judgment': 'judgement',
    'labelling': 'labeling',
    'labour': 'labor',
    'licence': 'license',
    'maximise': 'maximize',
    'modelled': 'modeled',
    'modelling': 'modeling',
    'offence': 'offense',
    'optimise': 'optimize',
    'organisation': 'organization',
    'organise': 'organize',
    'practise': 'practice',
    'programme': 'program',
    'realise': 'realize',
    'recognise': 'recognize',
    'signalling': 'signaling',
    'sub-license': 'sublicense',
    'sub license': 'sublicense',
    'utilisation': 'utilization',
    'whilst': 'while',
    'wilful': 'wilfull',
    'non-commercial': 'noncommercial',
    'per cent': 'percent',
    'owner': 'holder',
    'what\'s': 'what is',
    'that\'s': 'that is',
    'it\'s': 'it is',
    'how\'s': 'how is',
    'who\'s': 'who is',
}


const normalizeLicenseText = (licenseText: string): string => {
    // To avoid a possibility of a non-match due to urls not being same.
    licenseText = licenseText.replace(URL_REGEX, 'xxxxx')

    // To avoid the license mismatch merely due to the existence or absence of code comment indicators placed within the license text, they are just removed.
    licenseText = licenseText.replace(CSTYLE_COMMENTS_REGEX, ' ')

    licenseText = licenseText.replace(COMMENTS_REGEX, '')

    // We'll also ignore punctuation
    licenseText = licenseText.replace(PUNCTUATION_REGEX, ' ')

    // Remove single/double quotes
    licenseText = licenseText.replace(QUOTES_REGEX, ' ')

    // To avoid a license mismatch merely because extraneous text that appears at the end of the terms of a license is different or missing.
    licenseText = licenseText.replace(EXTRANEOUS_REGEX, ' ')

    licenseText = licenseText.replace(ADDENDIUM_EXHIBIT_REGEX, ' ')

    // By using a default copyright symbol (c)", we can avoid the possibility of a mismatch.
    licenseText = licenseText.replace(COPYRIGHT_SYMBOLS, '(c)')

    // To avoid a license mismatch merely because the copyright notice is different, it is not substantive and is removed.
    const [head, ...tail] = licenseText.split(/\n\n(?=[A-Z])/)
    if (tail.length > 0 && tail[0].length > 0 && head.startsWith('Copyright') && head.length < 1000) {
        licenseText = tail.join('\n\n')
    } else {
        licenseText = licenseText.replace(COPYRIGHT_NOTICE_REGEX, '')
    }

    // To avoid a possibility of a non-match due to case sensitivity.
    licenseText = licenseText.toLowerCase()

    // To remove the license name or title present at the beginning of the license text.
    const lines = licenseText.split('\n')
    if (lines.length > 1 && lines[0].includes('license')) {
        licenseText = lines.slice(1).join('\n')
    }

    // To avoid the possibility of a non-match due to variations of bullets, numbers, letter, or no bullets used are simply removed.
    licenseText = licenseText.replace(BULLETS_NUMBERING_REGEX, " ")

    // To avoid the possibility of a non-match due to the same word being spelled differently.
    Object.keys(VARIETAL_WORDS_SPELLING).forEach(original => {
        let replacement = VARIETAL_WORDS_SPELLING[original] as string
        licenseText = licenseText.replace(new RegExp(original, 'g'), replacement)
    })

    // To avoid the possibility of a non-match due to different spacing of words, line breaks, or paragraphs.
    licenseText = licenseText.replace(/\s+/sg, ' ')

    // Trim
    licenseText = licenseText.trim()

    return licenseText
}

/**
 * Normalize the given input into a canonical form that can be used for comparison algorithms.
 *
 * @param licenseText The plain license text to be normalized or source code (e.g. Java, Python, etc.)
 *                    with the license text embedded in a header comment.
 * @returns The normalized license text extracted from the input.
 */
export const normalize = (licenseText: string): string => {
    return normalizeLicenseText(extractLicenseText(licenseText))
}
