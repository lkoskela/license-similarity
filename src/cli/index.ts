#!/usr/bin/env node

import * as process from 'process'
import { Readable } from 'stream'
import { readFileAsString, isFile } from '../filesystem/file-utils'

import { identifyLicense, matchLicenses } from '../index'
import { extractLicenseText } from '../matching/extraction'
import { parseCLIOptions, CLIOptions, usage } from './options'

const EXECUTABLE_NAME = 'identifylicense'

async function read(stream: Readable) {
    const chunks = []
    for await (const chunk of stream) {
        chunks.push(chunk)
    }
    return Buffer.concat(chunks).toString('utf8')
}

const identifyCommand = (options: CLIOptions): string => {
    return identifyLicense(options.inputfile, {}) || ''
}

const allMatchesCommand = (options: CLIOptions): string => {
    return JSON.stringify(matchLicenses(options.inputfile), null, 2)
}

const extractCommand = (options: CLIOptions): string => {
    return extractLicenseText(options.inputfile)
}

const mapOptionsToCommand = (options: CLIOptions): Function => {
    if (options.command === 'allmatches') {
        return allMatchesCommand
    } else if (options.command === 'extract') {
        return extractCommand
    } else {
        return identifyCommand
    }
}

const cliRunner = async (args: string[]): Promise<void> => {
    try {
        const cliOptions = parseCLIOptions(args)
        cliOptions.inputfile = isFile(cliOptions.inputfile)
            ? readFileAsString(cliOptions.inputfile)         // read input file's contents from the file path provided
            : (await read(process.stdin))                    // read input file's contents from stdin
        const command = mapOptionsToCommand(cliOptions)
        const output = command.call(command, cliOptions)
        if (output !== '') {
            console.log(output)
        }
    } catch (e: any) {
        console.log(usage(EXECUTABLE_NAME, e.message))
    }
}

const runCLI = () => cliRunner(process.argv.slice(2) as string[])

runCLI()
