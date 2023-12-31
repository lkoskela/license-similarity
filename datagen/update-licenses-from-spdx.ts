import { createHash } from 'crypto'
import { pipeline } from 'stream'
import { XMLParser } from 'fast-xml-parser'
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

const attemptXmlRdfFallback = async (url: string): Promise<any> => {
    let match = url.match(/https:\/\/spdx.org\/licenses\/(.*?).json/)
    if (match && match[1]) {
        let licenseId = match[1]
        let xmlUrl = `https://raw.githubusercontent.com/spdx/license-list-data/main/rdfxml/${licenseId}.rdf`
        try {
            let xmlDoc = await downloadXML(xmlUrl, false)
            console.debug(`Error parsing JSON from ${url} but found an XML fallback from ${xmlUrl}`)
            return convertLicenseXmlToJsonObject(xmlDoc)
        } catch (err: any) {
            console.debug(`Could not find ${xmlUrl} either as a fallback for ${url} either: ${err}`, err.stack)
            throw err
        }
    }
    return Promise.reject()
}

const downloadJSON = async (url: string): Promise<any> => {
    const rawJson = await downloadRawContentFrom(url)
    try {
        return JSON.parse(rawJson)
    } catch (err) {
        // Since the SPDX project's data is often messed up such that a given license's JSON file is missing
        // even though the equivalent XML source file exists, let's fall back to downloading and parsing the
        // XML file is it exists.
        return attemptXmlRdfFallback(url).catch(() => {
            const errorPayload = {
                error: `Error parsing JSON from ${url}: ${err}`,
                details: `Raw content received:\n${rawJson}`
            }
            console.error(`${errorPayload.error}\n\n${errorPayload.details}`)
            return errorPayload
        })
    }
}

const downloadRawContentFrom = async (url: string): Promise<any> => {
    const rawContent = await new Promise<string>((resolve, _reject) => {
        const tmpFilePath = path.join(tmpdir(), hash(url))
        get(url, (response) => {
            const callback = (err: NodeJS.ErrnoException|null) => {
                if (err) {
                    console.warn(`Could not download content from ${url} - ${err}`)
                    resolve('{}')
                } else {
                    resolve(readFileSync(tmpFilePath).toString())
                }
            }
            pipeline(response, createWriteStream(tmpFilePath), callback)
        })
    })
    return rawContent
}

const downloadXML = async (url: string, preserveOrder: boolean = true): Promise<any> => {
    const rawXml = await downloadRawContentFrom(url)
    try {
        const options = {
            ignoreAttributes: false,
            allowBooleanAttributes: true,
            preserveOrder: preserveOrder,
            attributeNamePrefix : "",
            attributesGroupName : "@",
            commentPropName: "#comment"
        }
        const parser = new XMLParser(options)
        const xml = parser.parse(rawXml)
        return xml
    } catch (err) {
        console.error(`Error parsing XML from ${url}: ${err}\n\nRaw content:\n${rawXml}`)
        return Promise.reject({
            error: `Error parsing XML from ${url}: ${err}`,
            details: `Raw content received:\n${rawXml}`
        })
    }
}

type NamespaceMappings = {
    [name: string]: string
}

type Namespaces = {
    byUri(uri: string): string
}

const parseNamespaces = (mappings: NamespaceMappings|undefined): Namespaces => {
    const keyedByPrefix: { [name:string]: string } = {}
    const keyedByURI: { [name:string]: string } = {}
    if (mappings) {
        Object.keys(mappings).forEach(ns => {
            let prefix = ns.replace(/^xmlns:/, '')
            let uri = mappings[ns]
            keyedByPrefix[prefix] = uri
            keyedByURI[uri] = prefix
        })
    }
    const byUri = (uri: string): string => { return keyedByURI[uri] || '' }
    return { byUri }
}

const convertLicenseXmlToJsonObject = (doc: any): any => {
    let root = doc[Object.keys(doc)[0]]
    let namespaces = parseNamespaces(root["@"])
    let nsRdf = namespaces.byUri('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
    let nsSpdx = namespaces.byUri('http://spdx.org/rdf/terms#')
    let nsRdfs = namespaces.byUri('http://www.w3.org/2000/01/rdf-schema#')

    const getBooleanValueFromRoot = (node: any, childName: string, defaultValue: boolean = false): boolean => {
        let childNode = node[childName]
        if (childNode && childNode["#text"] !== undefined) {
            if (childNode["@"][`${nsRdf}:datatype`] !== "http://www.w3.org/2001/XMLSchema#boolean") {
                console.warn(`Unexpected datatype for a boolean: ${JSON.stringify(childNode, null, 2)}`)
            }
            return childNode["#text"]
        }
        return defaultValue
    }

    const getIntegerValueFromRoot = (node: any, childName: string, defaultValue: number = 0): number => {
        let childNode = node[childName]
        if (childNode && childNode["#text"] !== undefined) {
            if (childNode["@"][`${nsRdf}:datatype`] !== "http://www.w3.org/2001/XMLSchema#int") {
                console.warn(`Unexpected rdf:datatype for an integer: ${JSON.stringify(childNode, null, 2)}`)
            }
            return childNode["#text"]
        }
        return defaultValue
    }

    const getStringValueFromRoot = (node: any, childName: string): string|undefined => {
        let childNode = node[childName]
        if (childNode && typeof(childNode) === 'string') return childNode.trim()
        return undefined
    }

    let listedLicense = root[`${nsSpdx}:ListedLicense`]
    let licenseId = getStringValueFromRoot(listedLicense, `${nsSpdx}:licenseId`)
    let isOsiApproved = getBooleanValueFromRoot(listedLicense, `${nsSpdx}:isOsiApproved`)
    let isFsfLibre = getBooleanValueFromRoot(listedLicense, `${nsSpdx}:isFsfLibre`)
    let isDeprecatedLicenseId = getBooleanValueFromRoot(listedLicense, `${nsSpdx}:isDeprecatedLicenseId`)
    let name = getStringValueFromRoot(listedLicense, `${nsSpdx}:name`)
    let standardLicenseHeader = getStringValueFromRoot(listedLicense, `${nsSpdx}:standardLicenseHeader`)
    let standardLicenseHeaderHtml = getStringValueFromRoot(listedLicense, `${nsSpdx}:standardLicenseHeaderHtml`)
    let standardLicenseHeaderTemplate = getStringValueFromRoot(listedLicense, `${nsSpdx}:standardLicenseHeaderTemplate`)
    let standardLicenseTemplate = getStringValueFromRoot(listedLicense, `${nsSpdx}:standardLicenseTemplate`)
    let licenseText = getStringValueFromRoot(listedLicense, `${nsSpdx}:licenseText`)
    let licenseTextHtml = getStringValueFromRoot(listedLicense, `${nsSpdx}:licenseTextHtml`)

    let seeAlso = listedLicense[`${nsRdfs}:seeAlso`]
    if (seeAlso === undefined) {
        seeAlso = []
    } else if (!Array.isArray(seeAlso)) {
        seeAlso = typeof(seeAlso) === 'string' ? [ seeAlso ] : []
    }

    const mapCrossRef = (node: any): any => {
        let element = node[`${nsSpdx}:CrossRef`]
        let order = getIntegerValueFromRoot(element, `${nsSpdx}:order`)
        let match = getBooleanValueFromRoot(element, `${nsSpdx}:match`).toString()
        let url = getStringValueFromRoot(element, `${nsSpdx}:url`)
        let isValid = getBooleanValueFromRoot(element, `${nsSpdx}:isValid`)
        let isLive = getBooleanValueFromRoot(element, `${nsSpdx}:isLive`)
        let isWayBackLink = getBooleanValueFromRoot(element, `${nsSpdx}:isWayBackLink`)
        let timestamp = getStringValueFromRoot(element, `${nsSpdx}:timestamp`)
        return { order, match, url, isValid, isLive, isWayBackLink, timestamp }
    }
    let crossRef = listedLicense[`${nsSpdx}:crossRef`]
    if (crossRef === undefined) {
        crossRef = []
    } else if (Array.isArray(crossRef)) {
        crossRef = crossRef.map(mapCrossRef)
    } else if (typeof(crossRef) === 'object') {
        crossRef = [ mapCrossRef(crossRef) ]
    }
    const jsonizedLicenseObject = {
        isDeprecatedLicenseId,
        isFsfLibre,
        licenseText,
        standardLicenseHeaderTemplate,
        standardLicenseTemplate,
        name,
        licenseId,
        standardLicenseHeader,
        crossRef,
        seeAlso,
        isOsiApproved,
        licenseTextHtml,
        standardLicenseHeaderHtml
    }
    return jsonizedLicenseObject
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
        const urls = json[entryListKey].map(detailsUrlMapper) as string[]
        const details = await downloadManyJSONFiles(urls)
        json[entryListKey] = details.filter(x => !!x && !x.error).map(detailsObjectMapper)
        const str = JSON.stringify(json, null, 2)
            .replace(/[^\x00-\x7F]/g, '')   // Throw unwanted characters away
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
