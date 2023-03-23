import { diceCoefficient } from '../../src/algorithms/dice-coefficient'

describe('Universal rules', () => {

    it('empty values lead to a score of 0', () => {
        expect(diceCoefficient('', 'not empty')).toBe(0)
        expect(diceCoefficient('', '')).toBe(0)
    })

    it('identical values lead to a score of 1', () => {
        const text = 'little red fox did something'
        expect(diceCoefficient(text, text)).toBe(1)
    })

    it('case does not matter', () => {
        const a = "nIghT"
        const b = "NACHt"
        expect(diceCoefficient(a, b)).toBeCloseTo(diceCoefficient(a.toLowerCase(), b.toUpperCase()), 5)
    })

    it('order does not matter', () => {
        const a = "foobar"
        const b = "FUBAR"
        expect(diceCoefficient(a, b)).toBeCloseTo(diceCoefficient(b, a), 5)
    })

    it('whitespace does not matter (at least much)', () => {
        const noSpace = diceCoefficient("foobar", "FUBAR")
        const littleSpace = diceCoefficient("foo bar", "FUBAR")
        const lottaSpace = diceCoefficient("foo    \t bar", "FUBAR")
        const linefeeds = diceCoefficient("\nfoo    \n bar\n", "FUBAR")
        expect(noSpace).toBeCloseTo(littleSpace, 2)
        expect(littleSpace).toBeCloseTo(lottaSpace, 2)
        expect(lottaSpace).toBeCloseTo(linefeeds, 2)
    })

    it('punctuation does not matter (much)', () => {
        const noCommas = diceCoefficient("This is madness and it's wrong!", "This is crazy and wrong")
        const commas = diceCoefficient("This is madness, and it's wrong!", "This is crazy and wrong")
        const extraCommas = diceCoefficient("This is madness, and, it's wrong!", "This is crazy and wrong")
        expect(noCommas).toBeCloseTo(commas, 1)
        expect(commas).toBeCloseTo(extraCommas, 1)
    })
})

describe('License-like examples', () => {
    it('empty lines do not matter in longer texts either', () => {
        const lines = [
            'Copyright (c) <year> <owner>',
            '',
            'Redistribution and use in source and binary forms:',
            '',
            '1. Redistributions of source code must retain the above copyright notice',
            '',
            '2. Redistributions in binary form must reproduce the above copyright notice',
            '',
            'THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"'
        ]
        const a = lines.join('\n')
        const b = lines.filter(line => line.length > 0).join('\n')
        expect(diceCoefficient(a, b)).toBeCloseTo(1.0, 2)
    })
})

describe('Benchmarks', () => {
    describe('from examples of the "string-similarity" (NPM) library', () => {

        it('string-similarity example #1', () => {
            const a = "healed"
            const b = "sealed"
            expect(diceCoefficient(a, b)).toBeCloseTo(0.80, 2)
        })

        it('string-similarity example #2', () => {
            const a = "Olive-green table for sale, in extremely good condition."
            const b = "For sale: table in very good  condition, olive green in colour."
            expect(diceCoefficient(a, b)).toBeCloseTo(0.721, 2)
        })

        it('string-similarity example #3', () => {
            const a = "Olive-green table for sale, in extremely good condition."
            const b = "For sale: green Subaru Impreza, 210,000 miles"
            expect(diceCoefficient(a, b)).toBeCloseTo(0.300, 2)
        })

        it('string-similarity example #4', () => {
            const a = "Olive-green table for sale, in extremely good condition."
            const b = "Wanted: mountain bike with at least 21 gears."
            expect(diceCoefficient(a, b)).toBeCloseTo(0.148, 2)
        })
    })
})
