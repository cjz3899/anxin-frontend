import { stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const WXSS_LIMIT_BYTES = 244 * 1024

export function isWithinWxssLimit(sizeBytes, limitBytes = WXSS_LIMIT_BYTES) {
  return sizeBytes < limitBytes
}

export async function checkWeappSize(projectRoot = process.cwd()) {
  const wxssPath = path.join(projectRoot, 'dist', 'app-origin.wxss')
  const { size } = await stat(wxssPath)
  return { path: wxssPath, size, limit: WXSS_LIMIT_BYTES, passed: isWithinWxssLimit(size) }
}

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isDirectRun) {
  try {
    const result = await checkWeappSize()
    const actualKiB = (result.size / 1024).toFixed(2)
    if (!result.passed) {
      console.error(`app-origin.wxss is ${actualKiB} KiB; it must stay below 244 KiB.`)
      process.exitCode = 1
    } else {
      console.log(`app-origin.wxss size check passed: ${actualKiB} KiB < 244 KiB.`)
    }
  } catch (error) {
    console.error(`Unable to check app-origin.wxss: ${error.message}`)
    process.exitCode = 1
  }
}
