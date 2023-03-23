import { readFileSync } from 'fs'
import { isFile } from "../filesystem/file-utils"
import { PrecomputedData } from './types'

export const serializePrecomputedData = (data: PrecomputedData): string => {
    return JSON.stringify(data)
}

export const deserializePrecomputedData = (data: string): PrecomputedData => {
    const serializedForm = isFile(data) ? readFileSync(data).toString() : data
    return JSON.parse(serializedForm) as PrecomputedData
}
