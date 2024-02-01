import { normalize } from "../../src/algorithms/normalize"
import { readFileAsString } from "../../src/filesystem/file-utils"
import { extractLicenseText } from "../../src/matching/extraction"

describe('normalize', () => {

    describe('simple one-line input', () => {
        it('is lowercased', () => {
            expect(normalize('simple')).toStrictEqual('simple')
            expect(normalize('SimPle')).toStrictEqual('simple')
        })

        it('whitespace gets shrunk', () => {
            expect(normalize('one two three')).toStrictEqual('one two three')
            expect(normalize(' one\t two    three   ')).toStrictEqual('one two three')
        })

        it('leading/trailing whitespace gets trimmed', () => {
            expect(normalize('\t one two three')).toStrictEqual('one two three')
            expect(normalize('one two three \t\t')).toStrictEqual('one two three')
            expect(normalize('\t\t   \tone two three \t\t  ')).toStrictEqual('one two three')
        })

        it('newlines get replaced with a space', () => {
            expect(normalize('one\ntwo\nthree')).toStrictEqual('one two three')
            expect(normalize('one\n\t\ntwo\n\nthree')).toStrictEqual('one two three')
        })

        // it('special characters get removed', () => {
        //     expect(normalize('question: what is the meaning of life?')).toStrictEqual('question what is the meaning of life')
        // })
        it('ASCII quotations get removed', () => {
            expect(normalize('it was "great"')).toStrictEqual('it was great')
            expect(normalize('\'maybe\' means \'no\'')).toStrictEqual('maybe means no')
        })

        it('Unicode quotations get removed', () => {
            expect(normalize('it was \u0022great\u0022')).toStrictEqual('it was great')
            expect(normalize('\u0027maybe\u0027 means \u0027no\u0027')).toStrictEqual('maybe means no')
            expect(normalize('what a \u0060brilliant\u00B4 move')).toStrictEqual('what a brilliant move')
            expect(normalize('\u201Cunicode\u201D double quotes get removed')).toStrictEqual('unicode double quotes get removed')
            expect(normalize('\u2018unicode\u2019 single quotes get removed')).toStrictEqual('unicode single quotes get removed')
        })
    })

    describe('Comment syntax', () => {
        it('single-line code comments are removed', () => {
            expect(normalize('//    code sample')).toStrictEqual('')
            expect(normalize('   code // this comment should go away')).toStrictEqual('code')
            expect(normalize('#  removed as well')).toStrictEqual('')
            expect(normalize('foo   #removed as well')).toStrictEqual('foo')
        })

        it('C-style comments are removed', () => {
            expect(normalize('/* remove this comment */')).toStrictEqual('')
            expect(normalize('between /* remove this comment */ code')).toStrictEqual('between code')
            expect(normalize('/* multi\n * line\n * comments, \n */')).toStrictEqual('')
            expect(normalize('and /* multi\n * line\n * comments, \n */ too')).toStrictEqual('and too')
            expect(normalize('/*  // this, too */')).toStrictEqual('')
            expect(normalize('/*\n// this, too\n*/')).toStrictEqual('')
        })
    })

    describe('URLs', () => {
        it('are replaced with a fixed placeholder', () => {
            const input =
                'Go to https://www.acme.co/license.html to read the full text' +
                ' or http://github.com/acme/foo for the source code'
            const expected = 'go to xxxxx to read the full text or xxxxx for the source code'
            expect(normalize(input)).toStrictEqual(expected)
        })
    })

    describe('Copyright statements', () => {

        describe('Copyright (c) 2024 ACME Inc', () => {

            it('with an empty line after the copyright statement', () => {
                const input =
                    'Copyright (c) 2024 ACME Inc\n' +
                    '\n' +
                    'Permission is granted to do whatever you like.'
                const expected = 'permission is granted to do whatever you like'
                expect(normalize(input)).toStrictEqual(expected)
            })

            it('without empty line after the copyright statement', () => {
                const input =
                    'Copyright (c) 2024 ACME Inc\n' +
                    'Permission is granted to do whatever you like.'
                const expected = 'permission is granted to do whatever you like'
                expect(normalize(input)).toStrictEqual(expected)
            })
        })
    })
})

describe('normalize select generated samples', () => {

    it('tests/samples/MIT/github.txt.cstyle-source-header-small-java-class', () => {
        const input = readFileAsString('tests/samples/MIT/github.txt.cstyle-source-header-small-java-class')
        expect(input).toMatch(/\/\*\*\n/g)

        const header = extractLicenseText(input)
        expect(header.trim()).toEqual(
            'Copyright (c) 2001-2023\n' +
            'Allen Short\n' +
            'Amber Hawkie Brown\n' +
            'Andrew Bennetts\n' +
            'Andy Gayton\n' +
            'Antoine Pitrou\n' +
            'Apple Computer, Inc.\n' +
            'Ashwini Oruganti\n' +
            'Benjamin Bruheim\n' +
            'Bob Ippolito\n' +
            'Canonical Limited\n' +
            'Christopher Armstrong\n' +
            'Ciena Corporation\n' +
            'David Reid\n' +
            'Divmod Inc.\n' +
            'Donovan Preston\n' +
            'Eric Mangold\n' +
            'Eyal Lotem\n' +
            'Google Inc.\n' +
            'Hybrid Logic Ltd.\n' +
            'Hynek Schlawack\n' +
            'Itamar Turner-Trauring\n' +
            'James Knight\n' +
            'Jason A. Mobarak\n' +
            'Jean-Paul Calderone\n' +
            'Jessica McKellar\n' +
            'Jonathan D. Simms\n' +
            'Jonathan Jacobs\n' +
            'Jonathan Lange\n' +
            'Julian Berman\n' +
            'Jürgen Hermann\n' +
            'Kevin Horn\n' +
            'Kevin Turner\n' +
            'Laurens Van Houtven\n' +
            'Mary Gardiner\n' +
            'Massachusetts Institute of Technology\n' +
            'Matthew Lefkowitz\n' +
            'Moshe Zadka\n' +
            'Paul Swartz\n' +
            'Pavel Pergamenshchik\n' +
            'Rackspace, US Inc.\n' +
            'Ralph Meijer\n' +
            'Richard Wall\n' +
            'Sean Riley\n' +
            'Software Freedom Conservancy\n' +
            'Tavendo GmbH\n' +
            'Thijs Triemstra\n' +
            'Thomas Grainger\n' +
            'Thomas Herve\n' +
            'Timothy Allen\n' +
            'Tom Most\n' +
            'Tom Prince\n' +
            'Travis B. Hartwell\n' +
            '\n' +
            'and others that have contributed code to the public domain.\n' +
            '\n' +
            'Permission is hereby granted, free of charge, to any person obtaining\n' +
            'a copy of this software and associated documentation files (the\n' +
            '"Software"), to deal in the Software without restriction, including\n' +
            'without limitation the rights to use, copy, modify, merge, publish,\n' +
            'distribute, sublicense, and/or sell copies of the Software, and to\n' +
            'permit persons to whom the Software is furnished to do so, subject to\n' +
            'the following conditions:\n' +
            '\n' +
            'The above copyright notice and this permission notice shall be\n' +
            'included in all copies or substantial portions of the Software.\n' +
            '\n' +
            'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,\n' +
            'EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\n' +
            'MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND\n' +
            'NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE\n' +
            'LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION\n' +
            'OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION\n' +
            'WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n'.trim())

            expect(normalize(header)).toStrictEqual(
                'permission is hereby granted free of charge to any person obtaining ' +
                'a copy of this software and associated documentation files (the ' +
                'software ) to deal in the software without restriction including ' +
                'without limitation the rights to use copy modify merge publish ' +
                'distribute sublicense and/or sell copies of the software and to ' +
                'permit persons to whom the software is furnished to do so subject to ' +
                'the following conditions: ' +
                'the above copyright notice and this permission notice shall be ' +
                'included in all copies or substantial portions of the software ' +
                'the software is provided as is without warranty of any kind ' +
                'express or implied including but not limited to the warranties of ' +
                'merchantability fitness for a particular purpose and ' +
                'noninfringement in no event shall the authors or copyright holders be ' +
                'liable for any claim damages or other liability whether in an action ' +
                'of contract tort or otherwise arising from out of or in connection ' +
                'with the software or the use or other dealings in the software'
            )
    })
})