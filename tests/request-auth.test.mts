import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('access token 只通过 authorization 请求头发送', async () => {
  const { createAuthorizationHeader } = await import('../src/utils/request-auth.ts')

  assert.deepEqual(createAuthorizationHeader('access-token'), {
    authorization: 'access-token',
  })
  assert.deepEqual(createAuthorizationHeader(''), {})
  assert.deepEqual(createAuthorizationHeader(undefined), {})
})

test('普通请求与文件上传都复用 authorization 请求头生成器', async () => {
  const requestSource = await readFile(new URL('../src/utils/request.ts', import.meta.url), 'utf8')
  const usages = requestSource.match(/createAuthorizationHeader\(authorization\)/g) ?? []

  assert.equal(usages.length, 2)
  assert.doesNotMatch(requestSource, /\btoken\s*:/i)
})
