import { normalize } from "../../src/algorithms/normalize"

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
})

