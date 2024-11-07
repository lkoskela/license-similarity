import { diceCoefficientForVectors } from '../../src/algorithms/dice-coefficient'
import { normalize } from '../../src/algorithms/normalize'
import { TokenDatabase } from '../../src/matching/token-database'

describe('Dice-coefficient for vectors', () => {

    const database = TokenDatabase.fromLicenses([])

    // Shorthand for the vector-based API/implementation:
    const diceCoefficient = (text1: string, text2: string): number => {
        const vector1 = database.tokenize(normalize(text1))
        const vector2 = database.tokenize(normalize(text2))
        return diceCoefficientForVectors(vector1, vector2)
    }

    describe('Universal rules', () => {

        it('empty values lead to a score of 0', () => {
            expect(diceCoefficient('', 'not empty')).toBe(0)
            expect(diceCoefficient('', '')).toBe(0)
        })

        it('identical values lead to a score of 1', () => {
            const text = 'little red fox did something'
            expect(diceCoefficient(text, text)).toBe(1)
        })

        it('non-empty, non-identical values lead to a score between 0 and 1', () => {
            const score = diceCoefficient('this is something else', 'something else entirely')
            expect(score).toBeGreaterThan(0)
            expect(score).toBeLessThan(1)
        })

        it('case does not matter', () => {
            const a = "nIghT wAtcH"
            const b = "NACHt WAtCh"
            expect(diceCoefficient(a, b)).toBeCloseTo(diceCoefficient(a.toLowerCase(), b.toUpperCase()), 5)
        })

        it('order does not matter', () => {
            const a = "foo bar"
            const b = "FU BAR"
            expect(diceCoefficient(a, b)).toBeCloseTo(diceCoefficient(b, a), 5)
        })

        it('whitespace does not matter (at least much)', () => {
            const noSpace = diceCoefficient("foo bar", "FU BAR")
            const littleSpace = diceCoefficient("foo  bar", "FU       BAR")
            const lottaSpace = diceCoefficient("foo    \t bar", "FU BAR")
            const linefeeds = diceCoefficient("\nfoo    \n bar\n", "FU BAR")
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
        it('empty lines do not matter in front of longer texts', () => {
            const lines = [
                '',
                '',
                '',
                '',
                'Copyright (c) <year> <owner>',
                'Redistribution and use in source and binary forms:',
                '1. Redistributions of source code must retain the above copyright notice',
                '2. Redistributions in binary form must reproduce the above copyright notice',
                'THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"'
            ]
            const a = lines.join('\n')
            const b = lines.filter(line => line.length > 0).join('\n')
            expect(diceCoefficient(a, b)).toBeCloseTo(1.0, 2)
        })

        it('empty lines do not matter in the end of longer texts', () => {
            const lines = [
                'Copyright (c) <year> <owner>',
                'Redistribution and use in source and binary forms:',
                '1. Redistributions of source code must retain the above copyright notice',
                '2. Redistributions in binary form must reproduce the above copyright notice',
                'THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"',
                '',
                '',
                '',
                '',
            ]
            const a = lines.join('\n')
            const b = lines.filter(line => line.length > 0).join('\n')
            expect(diceCoefficient(a, b)).toBeCloseTo(1.0, 2)
        })

        it('empty lines do not matter inside longer texts', () => {
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
})
