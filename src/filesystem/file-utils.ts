import { existsSync, statSync, readFileSync } from 'fs'

export const isFile = (f: string|undefined): boolean => !!f && existsSync(f) && statSync(f).isFile()

type ReadFileSyncOptions = { encoding: BufferEncoding, flag?: string | undefined } | BufferEncoding
export const readFileAsString = (f: string, options?: ReadFileSyncOptions): string => {
    return readFileSync(f, options || { encoding: 'utf8' }).toString()
}
