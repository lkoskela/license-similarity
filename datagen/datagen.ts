// import { generateLicenseData, GeneratedLicenseData } from './update-licenses-from-spdx'
import { generateLicenseData } from 'licenses-from-spdx'
import { precomputeData } from './update-precomputed-data'

const mainSequence = async () => {
    const generatedData = await generateLicenseData('tests/codegen/licenses.json', 'tests/codegen/exceptions.json')
    await precomputeData(generatedData)
}

(async () => { try { await mainSequence() } catch (e) { console.error(e) } })()
