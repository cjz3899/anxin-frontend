import assert from 'node:assert/strict'
import test from 'node:test'

async function loadRequestCore() {
  try {
    return await import('../src/utils/request-core.ts')
  } catch {
    assert.fail('请求响应校验尚未实现')
  }
}

test('标准业务响应可被解析', async () => {
  const { parseApiResponse } = await loadRequestCore()

  assert.deepEqual(parseApiResponse({ code: 1, data: { id: '1' }, msg: '操作成功' }), {
    code: 1,
    data: { id: '1' },
    msg: '操作成功',
  })
})

test('空响应与非标准响应会明确抛出服务响应格式异常', async () => {
  const { parseApiResponse } = await loadRequestCore()

  assert.throws(() => parseApiResponse(null), /服务响应格式异常/)
  assert.throws(() => parseApiResponse('<html>bad gateway</html>'), /服务响应格式异常/)
  assert.throws(() => parseApiResponse({ data: null }), /服务响应格式异常/)
})

test('传输通道：配了 API_BASE_URL 才走 http，否则走云托管内网', async () => {
  const { resolveTransport } = await loadRequestCore()

  assert.equal(resolveTransport(''), 'cloud')
  assert.equal(resolveTransport(undefined), 'cloud')
  assert.equal(resolveTransport('http://localhost:8080'), 'http')
})

test('容器调用：GET 的查询串自己拼，脏值不能漏进去', async () => {
  const { buildPathWithQuery } = await loadRequestCore()

  assert.equal(buildPathWithQuery('/api/document/list'), '/api/document/list')
  assert.equal(
    buildPathWithQuery('/api/document/list', { pageSize: 10, statusGroup: 'SUCCESS' }),
    '/api/document/list?pageSize=10&statusGroup=SUCCESS'
  )
  //空游标表示首页，拼出 cursor=undefined 会被后端当脏值
  assert.equal(
    buildPathWithQuery('/api/document/list', { pageSize: 10, cursor: null }),
    '/api/document/list?pageSize=10'
  )
  assert.equal(buildPathWithQuery('/api/x', { a: '', b: undefined }), '/api/x')
  //路径已带查询串时用 & 续接，不能出现两个 ?
  assert.equal(buildPathWithQuery('/api/x?a=1', { b: 2 }), '/api/x?a=1&b=2')
  //中文与 & 要编码，否则参数会被截断
  assert.equal(
    buildPathWithQuery('/api/search', { keyword: '保险 条款&免责' }),
    `/api/search?keyword=${encodeURIComponent('保险 条款&免责')}`
  )
})

test('容器调用的响应体可能是字符串，解包前统一收口', async () => {
  const { parseResponsePayload } = await loadRequestCore()

  assert.deepEqual(parseResponsePayload('{"code":1,"data":{"id":"9"},"msg":"ok"}'), {
    code: 1,
    data: { id: '9' },
    msg: 'ok',
  })
  assert.deepEqual(parseResponsePayload({ code: 1, data: null }), { code: 1, data: null })
  //网关错误页这类非 JSON 字符串要抛出来，不能让调用方拿到 undefined 继续往下走
  assert.throws(() => parseResponsePayload('<html>502</html>'))
})

test('优先读取后端业务错误信息', async () => {
  const { getErrorMessage } = await loadRequestCore()

  assert.equal(getErrorMessage({ msg: '微信登录失败: invalid appsecret' }, '登录失败'), '微信登录失败: invalid appsecret')
  assert.equal(getErrorMessage(new Error('网络不可用'), '登录失败'), '网络不可用')
  assert.equal(getErrorMessage(null, '登录失败'), '登录失败')
})
