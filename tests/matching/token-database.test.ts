import { License } from "../../src/data/types";
import { TokenDatabase } from "../../src/matching/token-database";

const licenses: License[] = [
    {
        name: 'License A',
        licenseId: 'Lic-A',
        licenseText: 'License A gives you the permission to redistribute freely',
        isDeprecated: false,
    },
    {
        name: 'License B',
        licenseId: 'Lic-B',
        licenseText: 'License B gives you permission to modify and redistribute',
        isDeprecated: false,
    },
]


describe('TokenDatabase', () => {
    let database: TokenDatabase

    beforeAll(() => {
        database = TokenDatabase.fromLicenses(licenses)
    })

    it('produces one token per word', () => {
        expect(database.tokenize('one').length).toBe(1)
        expect(database.tokenize('one two').length).toBe(2)
        expect(database.tokenize('one two three').length).toBe(3)
    })

    it('tokenizes previously tokenized words the same way', () => {
        const tokenized = database.tokenize('permission to redistribute')
        expect(tokenized).toStrictEqual([
            database.getToken('permission'),
            database.getToken('to'),
            database.getToken('redistribute'),
        ])
    })

    it('tokenizes new words and adds them to the vocabulary', () => {
        expect(database.hasToken('no')).toBe(false)
        const tokenized = database.tokenize('no permission to redistribute')
        expect(database.hasToken('no')).toBe(true)
        expect(tokenized).toStrictEqual([
            database.getToken('no'),
            database.getToken('permission'),
            database.getToken('to'),
            database.getToken('redistribute'),
        ])
    })
})