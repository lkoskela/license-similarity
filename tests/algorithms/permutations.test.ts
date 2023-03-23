import { permutationsOf } from "../../src/algorithms/permutations";

const sortPermutations = (a: Array<any>, b: Array<any>): number => {
    const lengthBasedSort = a.length - b.length
    if (lengthBasedSort !== 0) return lengthBasedSort
    return JSON.stringify(a).localeCompare(JSON.stringify(b))
}
const sortedPermutationsOf = (values: Array<any>, size?: number): Array<Array<any>> => permutationsOf(values, size).sort(sortPermutations)

describe('permutationsOf', () => {
    it('computes permutations of 2 values', () => {
        expect(permutationsOf([1, 2])).toStrictEqual([[1], [2], [1, 2], [2, 1]])
        expect(permutationsOf([1, 2], 1)).toStrictEqual([[1], [2]])
        expect(permutationsOf([1, 2], 2)).toStrictEqual([[1], [2], [1, 2], [2, 1]])
        expect(permutationsOf([1, 2], 3)).toStrictEqual([[1], [2], [1, 2], [2, 1]])
    })

    it('computes permutations of 3 values', () => {
        expect(sortedPermutationsOf([1, 2, 3], 1)).toStrictEqual(
            [[1], [2], [3]
        ])
        expect(sortedPermutationsOf([1, 2, 3], 2)).toStrictEqual([
            [1], [2], [3],
            [1, 2], [1, 3], [2, 1], [2, 3], [3, 1], [3, 2]
        ])
        expect(sortedPermutationsOf([1, 2, 3], 3)).toStrictEqual([
            [1], [2], [3],
            [1, 2], [1, 3], [2, 1], [2, 3], [3, 1], [3, 2],
            [1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]
        ])
        expect(sortedPermutationsOf([1, 2, 3])).toStrictEqual(sortedPermutationsOf([1, 2, 3], 3))
    })
})
