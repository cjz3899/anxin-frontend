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

test('accessToken 只在业务请求里注入一处，且不随文件直传给对象存储', async () => {
  const requestSource = await readFile(new URL('../src/utils/request.ts', import.meta.url), 'utf8')
  const usages = requestSource.match(/createAuthorizationHeader\(authorization\)/g) ?? []

  //内网 callContainer 与本地 http 共用同一个 request()，注入点只应有一处；
  //出现第二处就说明两条通道各写了一份，迟早会漂移成一边跳登录一边不跳
  assert.equal(usages.length, 1)
  assert.doesNotMatch(requestSource, /\btoken\s*:/i)

  //uploadToOss 打的是第三方域名，把 JWT 带过去等于白送
  const ossStart = requestSource.indexOf('export function uploadToOss')
  assert.ok(ossStart > 0, '直传封装应当仍在 request.ts 内')
  assert.doesNotMatch(requestSource.slice(ossStart), /createAuthorizationHeader|STORAGE_KEYS/)
})
