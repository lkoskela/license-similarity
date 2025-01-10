// Note: An alternative implementation of the Dice coefficient can be found from e.g the Natural library:
// https://naturalnode.github.io/natural/string_distance.html
import stringComparison from "string-comparison"

import { normalize } from "./normalize"


export const diceCoefficient = (text1: string, text2: string): number => {
    const normalized1 = normalize(text1)
    const normalized2 = normalize(text2)
    if (normalized1.length < 2 || normalized2.length < 2) return 0
    if (normalized1 === normalized2) return 1
    return stringComparison.diceCoefficient.similarity(normalized1, normalized2)
}

export const diceCoefficientForVectors = (text1: number[], text2: number[]): number => {
    const getBigrams = (vector: number[]): Array<number[]> => {
        const hashes: {[key:number]: number} = {}
        const bigrams: Array<number[]> = []
        for (let i = 0; i < vector.length - 1; i++) {
            let bigram = vector.slice(i, i + 2)
            let key = bigram.reduce((prev, curr, index) => prev + (curr * Math.pow(10000, index+1)), 0)
            //console.log(`vector ${JSON.stringify(bigram)} => key ${key}`)
            if (hashes[key] === undefined) {
                bigrams.push(bigram)
                hashes[key] = key
            }
        }
        return [...bigrams]
    }

    const intersectionSize = (left: Array<number[]>, right: Array<number[]>): number => {
        let index = -1
        let intersections = 0
        while (++index < left.length) {
            const leftPair: number[] = left[index]
            let offset = -1
            while (++offset < right.length) {
                const rightPair: number[] = right[offset]
                if (leftPair[0] === rightPair[0] && leftPair[1] === rightPair[1]) {
                    // Count the intersection
                    intersections++
                    // Make sure this pair never matches again.
                    right[offset] = []
                    break
                }
            }
        }
        return intersections
    }

    const bigrams1 = getBigrams(text1)
    const bigrams2 = getBigrams(text2)
    if (bigrams1.length === 0 || bigrams2.length === 0) return 0 // throw new Error(`Empty bigrams from vectors sized ${text1.length} and ${text2.length}`)
    return (2 * intersectionSize(bigrams1, bigrams2)) / (bigrams1.length + bigrams2.length)
}

// let matches = findBestMatch("healed", [ "edward", "sealed", "theatre" ])
