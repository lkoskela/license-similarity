import { extractLicenseText } from "../../src/matching/extraction"

describe('extractLicenseText', () => {

    describe('input not starting with a comment', () => {
        it('gets returned as-is', () => {
            [
                'not\na\ncomment',
                'not a comment',
                '  not a comment',
                '   not\n    a\n comment',
            ].forEach(input => {
                expect(extractLicenseText(input)).toStrictEqual(input)
            })
        })
    })

    describe('Non-license header comment syntax', () => {
        it('comments after code are never considered a license header comment', () => {
            [
                '   code // here\'s a comment',
                'foo   #it would look like this in Python, for example',
                'between /* a quick note */ code',
                'ignoring /* multi\n * line\n * comments, \n */ between code too',
            ].forEach(input => expect(extractLicenseText(input)).toStrictEqual(input))
        })

        it('a single single-line code comment is not enough to be treated as a license header comment', () => {
            [
                '//    code sample',
                '#  also a sample',
                '/* just a comment */',
            ].forEach(input => expect(extractLicenseText(input)).toStrictEqual(input))
        })

        it('multiple single-line comments are not enough either without code that follows', () => {
            const input = '// one\n// two\n// three\n//four\n//five\n'
            expect(extractLicenseText(input)).toStrictEqual(input)
        })

        it('a multi-line C-style comments is not enough either without code that follows', () => {
            [
                '/**\n multi\n * line\n * comments, \n */',
                '/*\n multi\n * line\n * comments, \n */',
                '/* multi\n * line\n * comments, \n */',
                '/*  // this, too */',
                '/*\n// this, too\n*/',
            ].forEach(input => expect(extractLicenseText(input)).toStrictEqual(input))
        })
    })

    describe('Source files with a leading license header', () => {

        describe('C-style comment header followed by code', () => {
            it('is treated as the effective input', () => {
                const sample = [
                    '/**',
                    ' * This is a',
                    ' * multi-line',
                    ' * license header.',
                    ' */',
                    'This',
                    '',
                    'is code {',
                    '    following()',
                    '    the.license("header");',
                    '}',
                ].join('\n')
                expect(extractLicenseText(sample)).toStrictEqual('This is a\nmulti-line\nlicense header.')
            })

            it('leading whitespace is trimmed to match original indentation', () => {
                const sample = [
                    '/**',
                    ' * This is a',
                    ' * \t\tmulti-line',
                    ' *  license header!',
                    ' */',
                    'This',
                    '',
                    'is code {',
                    '    following()',
                    '    the.license("header");',
                    '}',
                ].join('\n')
                expect(extractLicenseText(sample)).toStrictEqual('This is a\n\t\tmulti-line\n license header!')
            })
        })

        describe('dash-dash style comment header followed by code', () => {
            it('is treated as the effective input', () => {
                const sample = [
                    '// This is a',
                    '// multi-line',
                    '// license header',
                    'This is code {',
                    '    following()',
                    '    the.license("header");',
                    '}',
                ].join('\n')
                expect(extractLicenseText(sample)).toStrictEqual('This is a\nmulti-line\nlicense header')
            })

            it('leading whitespace is trimmed to match original indentation', () => {
                const sample = [
                    '//   This is a',
                    '//  multi-line',
                    '// license header...',
                    'This is code {',
                    '    following()',
                    '    the.license("header");',
                    '}',
                ].join('\n')
                expect(extractLicenseText(sample)).toStrictEqual('  This is a\n multi-line\nlicense header...')
            })
        })
    })
})

