import { createHash } from 'crypto'
import { pipeline } from 'stream'
import * as path from 'path'
import { get } from 'https'
import { readFileSync, writeFileSync, createWriteStream, existsSync, statSync, mkdirSync } from 'fs'
import { tmpdir } from 'os'
import { readFileAsString } from '../src/filesystem/file-utils'
import { Exceptions, Licenses } from '../src/data/types'


const LICENSE_FILE_URL = "https://raw.githubusercontent.com/spdx/license-list-data/master/json/licenses.json"
const EXCEPTIONS_FILE_URL = "https://raw.githubusercontent.com/spdx/license-list-data/master/json/exceptions.json"
const EXCEPTION_DETAILS_FILE_BASEURL = "https://raw.githubusercontent.com/spdx/license-list-data/master/json/exceptions/"
const DETAILS_DOWNLOAD_BATCH_SIZE = 10


const hash = (str: string): string => {
    let shasum = createHash('sha1')
    shasum.update(str)
    return shasum.digest('hex')
}

const downloadJSON = async (url: string): Promise<any> => {
    const rawJson = await new Promise<string>((resolve, _reject) => {
        const tmpFilePath = path.join(tmpdir(), hash(url))
        get(url, (response) => {
            const callback = (err: NodeJS.ErrnoException|null) => {
                if (err) {
                    console.warn(`Could not download JSON from ${url} - ${err}`)
                    resolve('{}')
                } else {
                    resolve(readFileSync(tmpFilePath).toString())
                }
            }
            pipeline(response, createWriteStream(tmpFilePath), callback)
        })
    })
    try {
        return JSON.parse(rawJson)
    } catch (err) {
        console.error(`Error parsing JSON from ${url}: ${err}\n\nRaw content:\n${rawJson}`)
        return {
            error: `Error parsing JSON from ${url}: ${err}`,
            details: `Raw content received:\n${rawJson}`
        }
    }
}

function sliceIntoChunks<T>(arr: T[], chunkSize: number): T[][] {
    const res: T[][] = []
    for (let i = 0; i < arr.length; i += chunkSize) {
        const chunk: T[] = arr.slice(i, i + chunkSize)
        res.push(chunk)
    }
    return res
}

const downloadManyJSONFiles = async (arrayOfURLs: string[]): Promise<any[]> => {
    const batches = sliceIntoChunks(arrayOfURLs, DETAILS_DOWNLOAD_BATCH_SIZE)
    const results: any[] = []
    for (let b = 0; b < batches.length; b++) {
        const batch = batches[b]
        console.log(`Downloading batch ${b+1} (${batch.length} entries)`)
        const batchResults = await Promise.all(batch.map(downloadJSON))
        batchResults.forEach(result => results.push(result))
    }
    return results
}

const readLicenseListVersionFromJsonObject = (jsonObj: any): string => jsonObj.licenseListVersion

const readLicensesFromFile = (file_path: string): any[] => {
    if (existsSync(file_path)) {
        const jsonObj = JSON.parse(readFileSync(file_path).toString())
        return jsonObj.licenses.filter((x: any) => !!x)
    }
    console.warn(`File ${file_path} does not exist - can't read licenses from it`)
    return []
}

const readLicenseListVersionFromFile = (file_path: string): string => {
    if (existsSync(file_path)) {
        const jsonObj = JSON.parse(readFileSync(file_path).toString())
        return readLicenseListVersionFromJsonObject(jsonObj)
    }
    return ''
}

const updateFileFromURL = async (destinationFilePath: string, sourceUrl: string, entryListKey: string, detailsUrlMapper: (obj: any) => string, detailsObjectMapper: (obj: any) => any) => {
    const json = await downloadJSON(sourceUrl)
    const latestVersion = readLicenseListVersionFromJsonObject(json)
    const localVersion = readLicenseListVersionFromFile(destinationFilePath)
    if (!!latestVersion && latestVersion === localVersion) {
        console.log(`${destinationFilePath} already has version ${latestVersion} from ${sourceUrl} --> skip update`)
    } else {
        console.log(`Update available (from ${localVersion} to ${latestVersion}) --> updating ${entryListKey}`)
        const urls = json[entryListKey].map(detailsUrlMapper)
        const details = await downloadManyJSONFiles(urls)
        json[entryListKey] = details.filter(x => !!x && !x.error).map(detailsObjectMapper)
        const str = JSON.stringify(json, null, 2)
            .replace(/[\u{003e}]/gu, '>')   // replace the closing bracket (greater than)
            .replace(/[\u{003c}]/gu, '<')   // replace the opening bracket (less than)
            .replace(/[\u{0027}]/gu, '\'')  // replace the apostrophe
            .replace(/[^\x00-\x7F]/g, '')   // Throw the rest away
        mkdirSync(path.dirname(destinationFilePath), { recursive: true })
        writeFileSync(destinationFilePath, str, { encoding: 'utf8' })
        console.log(`Updated ${destinationFilePath} with version ${latestVersion} from ${sourceUrl}`)
    }
}

const updateLicenseFileAt = async (destinationFilePath: string) => {
    const licenseDetailsUrlMapper = (license: any) => license.detailsUrl
    const licenseDetailsObjectMapper = (license: any) => {
        if (license && license.licenseId) {
            return {
                name: license.name,
                licenseId: license.licenseId,
                licenseText: license.licenseText,
                isDeprecated: license.isDeprecatedLicenseId,
                //standardLicenseTemplate: license.standardLicenseTemplate
            }
        }
        return undefined
    }
    try {
        await updateFileFromURL(destinationFilePath, LICENSE_FILE_URL, 'licenses', licenseDetailsUrlMapper, licenseDetailsObjectMapper)
    } catch (err) {
        console.error(`Updating ${destinationFilePath} failed: ${err}`, err)
    }
}

const updateExceptionsFileAt = async (exceptionsFilePath: string, licensesFilePath: string) => {
    const exceptionDetailsUrlMapper = (entry: any) => EXCEPTION_DETAILS_FILE_BASEURL + entry.reference.replace(/^.\//, '')
    const exceptionDetailsObjectMapper = (_licenses: any[]) => {
        return (entry: any) => {
            return {
                name: entry.name,
                licenseExceptionId: entry.licenseExceptionId,
                licenseExceptionText: entry.licenseExceptionText,
                licenseExceptionTemplate: entry.licenseExceptionTemplate
            }
        }
    }
    try {
        const licenses = readLicensesFromFile(licensesFilePath)
        await updateFileFromURL(exceptionsFilePath, EXCEPTIONS_FILE_URL, 'exceptions', exceptionDetailsUrlMapper, exceptionDetailsObjectMapper(licenses))
    } catch (err) {
        console.error(`Updating ${exceptionsFilePath} failed: ${err}`, err)
    }
}

const fileIsOlderThan = (oldestAcceptableTimestamp: Date, filePath: string): boolean => {
    return statSync(filePath).mtime < oldestAcceptableTimestamp
}

const updateLicenseFileIfOlderThan = async (oldestAcceptableTimestamp: Date, filePath: string) => {
    if (!existsSync(filePath) || fileIsOlderThan(oldestAcceptableTimestamp, filePath)) {
        return await updateLicenseFileAt(filePath)
    } else {
        console.log(`Not updating ${filePath} (it's recent enough)`)
    }
}

const updateExceptionsFileIfOlderThan = async (oldestAcceptableTimestamp: Date, filePath: string, licenseFilePath: string) => {
    if (!existsSync(filePath) || fileIsOlderThan(oldestAcceptableTimestamp, filePath)) {
        return await updateExceptionsFileAt(filePath, licenseFilePath)
    } else {
        console.log(`Not updating ${filePath} (it's recent enough)`)
    }
}

const dateHoursBeforeNow = (hours: number): Date => {
    const d = new Date()
    const nowInMillis = d.getTime()
    return new Date(nowInMillis - hours * 60 * 60 * 1000)
}

const main = async (licenseFilePath: string, exceptionsFilePath: string) => {
    const oldestAcceptableTimestamp = dateHoursBeforeNow(24)
    await updateLicenseFileIfOlderThan(oldestAcceptableTimestamp, licenseFilePath)
    await updateExceptionsFileIfOlderThan(oldestAcceptableTimestamp, exceptionsFilePath, licenseFilePath)
}

export type GeneratedLicenseData = {
    licenses: Licenses,
    exceptions: Exceptions
}

export const generateLicenseData = async (): Promise<GeneratedLicenseData> => {
    const licensesFile = 'tests/codegen/licenses.json'
    const exceptionsFile = 'tests/codegen/exceptions.json'
    await main(licensesFile, exceptionsFile)
    return {
        licenses: JSON.parse(readFileAsString(licensesFile)),
        exceptions: JSON.parse(readFileAsString(exceptionsFile))
    }
}
