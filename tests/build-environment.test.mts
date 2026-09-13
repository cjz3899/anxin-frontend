import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('完整验证完成后保留可连接本地后端的微信调试包', async () => {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  const verifyCommand = packageJson.scripts.verify as string

  assert.match(verifyCommand, /pnpm build:weapp(?:\s|$)/)
  assert.doesNotMatch(verifyCommand, /pnpm build:weapp:prod(?:\s|$)/)
})
