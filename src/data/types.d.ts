export type Exception = {
    licenseExceptionId: string,
    licenseExceptionText: string,
    licenseExceptionTemplate: string,
    name: string
}

export type License = {
    name: string,
    licenseId: string,
    licenseText: string,
    isDeprecated: boolean,
}

export type Licenses = {
    licenseListVersion: string,
    releaseDate: string,
    licenses: License[]
}

export type Exceptions = {
    licenseListVersion: string,
    releaseDate: string,
    exceptions: Exception[]
}

export type TokenDatabaseData = {
    vocabulary: {[word: string]: number},
    tokenizedTexts: {[licenseId:string]: number[]}
}

export type PrecomputedData = {
    licenseListVersion: string,
    licenseListReleaseDate: string,
    licenseDeprecations: {[licenseId:string]: boolean},
    licenseLengths: {[licenseId:string]: number},
    licenses: License[],
    exceptions: Exception[],
    tokendatabase: TokenDatabaseData
}
