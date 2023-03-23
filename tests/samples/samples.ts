import path, { join } from 'path'
import { statSync, readdirSync, writeFileSync } from 'fs'
import assert from 'assert'

import { normalize } from '../../src/algorithms/normalize'
import { License, Licenses } from '../../src/data/types'
import { readFileAsString } from '../../src/filesystem/file-utils'

import licensesJson from '../codegen/licenses.json'
const licenses = (licensesJson as Licenses).licenses


export type Sample = {
    licenseId: string,
    text: string,
    path: string,
    relativePath: string,
}

const findLicenseData = (licenseId: string): License => {
    const license = licenses.find(l => l.licenseId === licenseId) as License
    assert.ok(!!license, `License ${licenseId} was not found from our license data!`)
    return license
}

const readTemplate = (templateName: string) => {
    const filePath = join(__dirname, '_templates', templateName)
    if (!statSync(filePath).isFile()) throw new Error(`Template not found: ${filePath}`)
    return readFileAsString(filePath)
}

type IntermediateFormatHandler = {
    fileNameSuffix: string,
    contentFrom(originalContent: string): string
}

const intermediateFormats: IntermediateFormatHandler[] = [
    {
        // The normalized text that we analyze for similarity
        // (only for manual verification/debugging purposes!)
        fileNameSuffix: '.normalized',
        contentFrom: (original: string) => normalize(original)
    },
    {
        // Single-line comment style header in a (tiny) Python source file
        fileNameSuffix: '.source-header-small-python-class',
        contentFrom: (original: string) => {
            const header = original.split('\n').map(line => `# ${line}`).join('\n')
            const template = readTemplate('PythonClass.py')
            return `${header}\n${template}`
        }
    },
    {
        /**
         * C-style header in a Java source file
         */
        fileNameSuffix: '.cstyle-source-header-small-java-class',
        contentFrom: (original: string) => {
            const header = ['/**'].concat(original.split('\n').map(line => ` * ${line}`)).concat([' */']).join('\n')
            const template = readTemplate('JavaClass.java')
            return `${header}\n${template}`
        }
    },
    {
        /**
         * C-style header in a Java source file
         */
        fileNameSuffix: '.cstyle-source-header-large-java-class',
        contentFrom: (original: string) => {
            const header = ['/**'].concat(original.split('\n').map(line => ` * ${line}`)).concat([' */']).join('\n')
            const template = readTemplate('LargeJavaClass.java')
            return `${header}\n${template}`
        }
    },
    {
        // Single-line comment style header in a (tiny) Java source file
        fileNameSuffix: '.source-header-small-java-class',
        contentFrom: (original: string) => {
            const header = original.split('\n').map(line => `// ${line}`).join('\n')
            const template = readTemplate('JavaClass.java')
            return `${header}\n${template}`
        }
    },
    {
        // Single-line comment style header in a (large) Java source file
        // where the volume of source code would obviously affect score unless
        // "normalized away" by our pre-processing.
        fileNameSuffix: '.source-header-large-java-class',
        contentFrom: (original: string) => {
            const header = original.split('\n').map(line => `// ${line}`).join('\n')
            const template = readTemplate('LargeJavaClass.java')
            return `${header}\n${template}`
        }
    }
]

const persistIntermediateFormatsToDisk = (originalFilePath: string, originalContent: string) => {
    const folder = path.dirname(originalFilePath)
    intermediateFormats.forEach(format => {
        const outputFileName = `${path.basename(originalFilePath)}${format.fileNameSuffix}`
        const outputFilePath = path.join(folder, outputFileName)
        writeFileSync(outputFilePath, format.contentFrom(originalContent))
    })
}

const persistLicenseTextToDisk = (licenseId: string) => {
    const license = findLicenseData(licenseId)
    const folder = join(__dirname, licenseId)
    writeFileSync(join(folder, 'api.txt'), license.licenseText)
    readdirSync(folder).filter(f => f.endsWith('.txt')).forEach(f => {
        const filePath = join(folder, f)
        const content = readFileAsString(filePath)
        persistIntermediateFormatsToDisk(filePath, content)
    })
}

const sampleDirectories = (): string[] => {
    return readdirSync(__dirname)
        .map(name => join(__dirname, name))
        .filter(filepath => statSync(filepath).isDirectory())           // directories only
        .filter(filepath => !path.basename(filepath).startsWith('_'))   // exclude "_templates" et al.
}

const sampleLicenseIds = (): string[] => {
    return sampleDirectories().map(filepath => path.basename(filepath))
}

export const samples = (licenseId: string): Sample[] => {
    return sampleDirectories()
        .filter(filepath => path.basename(filepath) === licenseId)
        .flatMap(filepath => readdirSync(filepath).map(f => join(filepath, f)))
        .flatMap(filepath => {
            return {
                licenseId: licenseId,
                text: readFileAsString(filepath),
                path: filepath,
                relativePath: path.relative(path.dirname(__dirname), filepath)
            }
        })
        .filter(sample => !sample.path.endsWith('.normalized'))
}

export const samplesByLicense = (): {[licenseId:string]: Sample[]} => {
    const data: {[licenseId:string]: Sample[]} = {}
    sampleLicenseIds().forEach(licenseId => {
        data[licenseId] = samples(licenseId)
    })
    return data
}

export const updateSampleLicenseOriginals = () => {
    sampleLicenseIds().forEach(licenseId => persistLicenseTextToDisk(licenseId))
}
