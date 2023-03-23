import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { fileSync as createTempFile } from 'tmp'
import { readFileAsString } from '../../src/filesystem/file-utils'

import { samples } from '../samples/samples'
import { isFile, isExecutable } from '../_utils'


type ShellCommandOutput = {
    stdout: string
    stderr: string
}
const executeShellCommand = (cmd: string): ShellCommandOutput => {
    let stdin = createTempFile({prefix: 'stdin-'})
    let stdout = createTempFile({prefix: 'stdout-'})
    let stderr = createTempFile({prefix: 'stderr-'})
    execSync(cmd, { stdio: [ stdin.fd, stdout.fd, stderr.fd ] })
    return {
        stdout: readFileAsString(stdout.name, { encoding: 'utf-8' }),
        stderr: readFileAsString(stderr.name, { encoding: 'utf-8' })
    }
}

const pathToApache2 = samples('Apache-2.0')[0].path

/**
 * Utility for toggling between skipping and not skipping a given test.
 *
 * @param condition pass a truthy value to execute the test, falsy to skip it
 * @returns either Jest's standard {@link it} or {@link it.skip}
 */
const itif = (condition: any) => (!!condition) ? it : it.skip

describe('CLI', () => {

    const packageJson = JSON.parse(readFileAsString('package.json', { encoding: 'utf-8' }))
    const binScript: string|undefined = packageJson.bin?.identifylicense
    const definedBinScriptExists = isFile(binScript)

    describe('project configuration (package.json)', () => {

        it('defines a bin script', () => {
            expect(binScript).toBeDefined()
            expect(definedBinScriptExists).toBeTrue()
        })

        itif(definedBinScriptExists)('the bin script has a shebang', () => {
            expect(binScript).toBeDefined()
            const binScriptSource = readFileSync(binScript as string, { encoding: 'utf-8' })
            const lines = binScriptSource.split('\n')
            expect(lines).toInclude('#!/usr/bin/env node')
            expect(lines[0]).toStartWith('#!/usr/bin/env node')
        })

        itif(definedBinScriptExists)('the bin script is executable', () => {
            expect(binScript).toBeDefined()
            expect(isExecutable(binScript)).toBeTrue()
        })
    })

    describe('CLI execution', () => {

        beforeAll(() => {
            // make sure our "bin" script is linked, putting the `spdx` executable in the path
            if (binScript) {
                try {
                    executeShellCommand(`which ${binScript}`)
                } catch {
                    executeShellCommand('npm link')
                }
            }
        })

        it('without an explicit "mode" implies -i (i.e. identify)', () => {
            const outputWithImplicitMode = executeShellCommand(`${binScript} ${pathToApache2}`).stdout
            const outputWithExplicitParseMode = executeShellCommand(`${binScript} -i ${pathToApache2}`).stdout
            expect(outputWithImplicitMode).toBe(outputWithExplicitParseMode)
        })

        describe('identifying a license (-i)', () => {

            it(`identifies a license from a known-good sample (${binScript} --identify ${pathToApache2})`, () => {
                expect(executeShellCommand(`${binScript} --identify ${pathToApache2}`).stdout.trimEnd()).toStrictEqual('Apache-2.0')
            })

            describe('parameter aliases', () => {
                it('--identify is equivalent to -i', () => {
                    const dash = executeShellCommand(`${binScript} -i ${pathToApache2}`).stdout
                    const dashdash = executeShellCommand(`${binScript} --identify ${pathToApache2}`).stdout
                    expect(dashdash).toStrictEqual(dash)
                })
            })
        })

        describe('matching all licenses (-a)', () => {

            describe('parameter aliases', () => {
                it('--all is equivalent to -a', () => {
                    const dash = executeShellCommand(`${binScript} -a ${pathToApache2}`).stdout
                    const dashdash = executeShellCommand(`${binScript} --all ${pathToApache2}`).stdout
                    expect(dash).toStrictEqual(dashdash)
                })
            })
      })
  })
})