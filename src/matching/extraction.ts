
type HeaderAndTail = {
    header: string,
    tail: string
}

interface HeaderAndTailMatcher {
    /**
     * Parse the given input into {@link HeaderAndTail}, i.e. the contents of a leading
     * header comment (without the surrounding comment syntax) and the tail of content
     * coming after the header comment.
     *
     * @param input The contents of a source file
     * @returns a {@link HeaderAndTail} or `undefined` if the input doesn't match the expected pattern.
     */
    match(input: string): HeaderAndTail|undefined
}

const removeCommonWhitespacePrefix = (lines: string[]): string[] => {
    const nonEmptyLines = lines.filter(line => line.trim().length > 0)

    // If there's 0 or 1 non-empty lines, just remove any leading whitespace from all lines
    if (nonEmptyLines.length < 2) {
        return lines.map(line => line.trimStart())
    }

    // Look for the longest common all-whitespace prefix among the non-empty lines
    let stillCommonPrefix = true
    let leadingPrefixLength = 0
    const shortestLineLength = Math.min(...nonEmptyLines.map(line => line.trimEnd().length))
    for (let i = 1; i < shortestLineLength && stillCommonPrefix; i++) {
        for (let l = 1; l < nonEmptyLines.length && stillCommonPrefix; l++) {
            let prev = nonEmptyLines[l - 1].slice(0, i)
            let next = nonEmptyLines[l].slice(0, i)
            stillCommonPrefix = prev === next
        }
        if (stillCommonPrefix) {
            leadingPrefixLength = i
        }
    }

    // Strip the leading all-whitespace prefix from all lines
    return lines.map(line => {
        if (line.trim().length === 0) return ''
        return line.slice(leadingPrefixLength)
    })
}

/**
 * {@link HeaderAndTailMatcher} implementation for C-style comment syntax (such as this).
 */
class CStyleHeaderAndTailMatcher implements HeaderAndTailMatcher {
    match(input: string): HeaderAndTail|undefined {
        const cstyleHeaderMatch = input.match(/^\/\*[\S\s]*?\*\//gm)
        if (cstyleHeaderMatch) {
            const tail = input.substring(cstyleHeaderMatch[0].length)
            let lines = cstyleHeaderMatch[0].split('\n')

            // Trim/remove the comment-starting pattern
            lines[0] = lines[0].replace(/^\/\*+/, '')
            // if (lines[0].trim().length === 0) {
            //     lines = lines.slice(1)
            // }

            // Trim/remove the comment-ending pattern
            // (and the line entirely if otherwise empty)
            lines[lines.length - 1] = lines[lines.length - 1].replace(/\*\/$/, '')
            if (lines[lines.length - 1].trim().length === 0) {
                lines = lines.slice(0, lines.length - 1)
            }

            const removeLeadingAsterisks = lines.slice(1).reduce((prev: boolean, curr: string) => prev && curr.trim().startsWith('*'), true)
            if (removeLeadingAsterisks) {
                lines = lines.slice(0, 1).concat(lines.slice(1).map(line => line.replace(/^\s*\*/, '')))
            }

            // Remove any leading and trailing empty lines
            while (lines.length > 0 && lines[0].trim().length === 0) {
                lines = lines.slice(1)
            }
            while (lines.length > 0 && lines[lines.length - 1].trim().length === 0) {
                lines = lines.slice(0, -1)
            }

            lines = removeCommonWhitespacePrefix(lines)

            const header = lines.join('\n')
            return { header, tail }
        }
        return undefined
    }
}

/**
 * {@link HeaderAndTailMatcher} implementation for line-scoped, prefix-based comment
 * syntax such as "// comment" or "# comment".
 */
class LinePrefixBasedHeaderAndTailMatcher implements HeaderAndTailMatcher {

    private readonly prefix: string

    constructor(prefix: string) {
        this.prefix = prefix
    }

    match(input: string): HeaderAndTail | undefined {
        if (input.trimStart().startsWith(this.prefix)) {
            let lines = input.split('\n').map(line => line.trim())
            const headerLines: string[] = []
            while (lines.length > 0 && lines[0].startsWith(this.prefix)) {
                headerLines.push(lines[0].substring(this.prefix.length))
                lines = lines.slice(1)
            }
            const header = removeCommonWhitespacePrefix(headerLines).join('\n')
            const tail = lines.join('\n')
            return { header, tail }
        }
        return undefined
    }
}

// Here, order matters because it's somewhat common for a C-style comment to be present
// *after* a line-prefix license header.
const headerAndTailMatchers: HeaderAndTailMatcher[] = [
    new LinePrefixBasedHeaderAndTailMatcher('//'),
    new LinePrefixBasedHeaderAndTailMatcher('#'),
    new CStyleHeaderAndTailMatcher(),
]

/**
 * Extracts (potential) license text to be parsed from the given input. For source files
 * with a leading multi-line comment followed by other text-based content (presumed to be
 * program code), extracts the contents of the header comment alone. For inputs that don't
 * look like source code with a header comment, returns the given input as-is.
 *
 * @param input The contents to extract a potential license text from.
 * @returns The input as-is or the contents of a potential license text embedded in a header comment.
 */
export const extractLicenseText = (input: string): string => {
    for (let i=0; i < headerAndTailMatchers.length; i++) {
        const match = headerAndTailMatchers[i].match(input)
        if (match) {
            const tail = match.tail.trim()
            if (tail.length > 0 && tail.split('\n').length >= 1) {
                return match.header.trimEnd()
            }
        }
    }
    return input
}