import { existsSync, statSync, constants } from 'fs'

import { permutationsOf } from '../src/algorithms/permutations'


export type PairOf<T> = {
    left: T,
    right: T
}

export function pairsOf<T>(values: T[]): Array<PairOf<T>> {
    const permutations = permutationsOf<T>(values, 2)
    return permutations.filter(combo => combo.length === 2).map(combo => {
        return { left: combo[0], right: combo[1] }
    })
}

export const isFile = (path: string|undefined): boolean => !!path && existsSync(path) && statSync(path).isFile()

export const isExecutable = (path: string|undefined): boolean => !!path && !!(statSync(path).mode & constants.S_IXUSR)
