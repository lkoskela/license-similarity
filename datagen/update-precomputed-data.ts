import { writeFileSync } from 'fs'
import { join } from 'path'
import { GeneratedLicenseData, License, Exception } from 'licenses-from-spdx'

import { normalize } from "../src/algorithms/normalize"
import { computeLength } from "../src/algorithms/text-length"
import { TokenDatabase } from "../src/matching/token-database"
import { PrecomputedData } from "../src/data/types"
import { serializePrecomputedData } from "../src/data/precomputed"

const generatePrecomputedData = async (licenseData: GeneratedLicenseData): Promise<PrecomputedData> => {
    const normalizedLicenses = licenseData.licenses.licenses.map((license: License): License => {
        return {
            name: license.name,
            licenseId: license.licenseId,
            licenseText: normalize(license.licenseText),
            isDeprecated: license.isDeprecated,
            seeAlso: license.seeAlso,
        }
    })

    const normalizedExceptions = licenseData.exceptions.exceptions.map((exception: Exception): Exception => {
        return {
            name: exception.name,
            licenseExceptionId: exception.licenseExceptionId,
            licenseExceptionText: normalize(exception.licenseExceptionText),
            licenseExceptionTemplate: exception.licenseExceptionTemplate,
        }
    })

    const licenseLengths: {[licenseId:string]: number} = ((): {[licenseId:string]: number} => {
        const data: {[licenseId:string]: number} = {}
        normalizedLicenses.forEach((license: License) => data[license.licenseId] = computeLength(license.licenseText))
        return data
    })()

    const shortestLicenseText = Math.min(...Object.values(licenseLengths))
    const longestLicenseText = Math.max(...Object.values(licenseLengths))

    const licenseDeprecations: {[licenseId:string]: boolean} = ((): {[licenseId:string]: boolean} => {
        const data: {[licenseId:string]: boolean} = {}
        normalizedLicenses.forEach((license: License) => data[license.licenseId] = license.isDeprecated)
        return data
    })()

    const tokenDatabase = TokenDatabase.fromLicenses(normalizedLicenses)

    return {
        licenseListVersion: licenseData.licenses.licenseListVersion,
        licenseListReleaseDate: licenseData.licenses.releaseDate,
        licenseDeprecations,
        licenseLengths,
        shortestLicenseText,
        longestLicenseText,
        licenses: normalizedLicenses,
        exceptions: normalizedExceptions,
        tokendatabase: tokenDatabase.toJsonObject()
    }
}

const persistPrecomputedData = async (data: PrecomputedData): Promise<void> => {
    const outputFilePath = join(__dirname, '../src/codegen/precomputed.json')
    writeFileSync(outputFilePath, serializePrecomputedData(data))
}

export const precomputeData = async (licenseData: GeneratedLicenseData): Promise<void> => {
    const data = await generatePrecomputedData(licenseData)
    await persistPrecomputedData(data)
}
