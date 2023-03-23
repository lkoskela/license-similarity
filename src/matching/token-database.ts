import { PathLike, writeFileSync } from 'fs'
import { License, PrecomputedData, TokenDatabaseData } from '../data/types'
import { readFileAsString } from '../filesystem/file-utils'

export class TokenDatabase {
    protected vocabulary: {[word: string]: number} = {}
    protected tokenizedTexts: {[licenseId:string]: number[]} = {}

    static fromPrecomputedData(data: PrecomputedData): TokenDatabase {
        const vocabulary = data.tokendatabase.vocabulary as {[word: string]: number}
        const tokenizedTexts = data.tokendatabase.tokenizedTexts as {[licenseId:string]: number[]}
        return new TokenDatabase(vocabulary, tokenizedTexts)
    }

    static fromFile(filepath: string): TokenDatabase {
        const database = new TokenDatabase()
        database.deserialize(filepath)
        return database
    }

    static fromLicenses(licenses: License[]): TokenDatabase {
        const database = new TokenDatabase()
        licenses.forEach(license => database.tokenize(license.licenseText, license.licenseId))
        return database
    }

    protected constructor(vocabulary: {[word: string]: number} = {}, tokenizedTexts: {[licenseId:string]: number[]} = {}) {
        this.vocabulary = vocabulary
        this.tokenizedTexts = tokenizedTexts
    }

    getToken(word: string): number|undefined {
        return this.vocabulary[word]
    }

    hasToken(word: string): boolean {
        return this.getToken(word) !== undefined
    }

    tokenize(licenseText: string, licenseId?: string): number[] {
        if (licenseId) {
            const cached = this.tokenizedTexts[licenseId]
            if (cached) {
                return cached
            }
        }
        const tokens: number[] = []
        const words = licenseText.split(' ')
        words.forEach(word => {
            const existingToken = this.vocabulary[word]
            if (existingToken) {
                tokens.push(existingToken)
            } else {
                const newlyAddedToken = Object.keys(this.vocabulary).length
                this.vocabulary[word] = newlyAddedToken
                tokens.push(newlyAddedToken)
            }
        })
        if (licenseId) {
            this.tokenizedTexts[licenseId] = tokens
        }
        return tokens
    }

    deserialize(filepath: string) {
        const data = JSON.parse(readFileAsString(filepath))
        this.vocabulary = data.vocabulary as {[word: string]: number}
        this.tokenizedTexts = data.tokenizedTexts as {[licenseId:string]: number[]}
    }

    serialize(filepath: string|PathLike) {
        const content = JSON.stringify(this.toJsonObject)
        writeFileSync(filepath, content, { encoding: 'utf8' })
    }

    toJsonObject(): TokenDatabaseData {
        return {
            tokenizedTexts: this.tokenizedTexts,
            vocabulary: this.vocabulary
        }
    }
}
