import { generateLicenseData, GeneratedLicenseData } from './update-licenses-from-spdx'
import { precomputeData } from './update-precomputed-data'

const mainSequence = async () => {
    const generatedData = await generateLicenseData()
    await precomputeData(generatedData)
}

(async () => { try { await mainSequence() } catch (e) { console.error(e) } })()
