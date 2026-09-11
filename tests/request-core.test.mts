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

test('优先读取后端业务错误信息', async () => {
  const { getErrorMessage } = await loadRequestCore()

  assert.equal(getErrorMessage({ msg: '微信登录失败: invalid appsecret' }, '登录失败'), '微信登录失败: invalid appsecret')
  assert.equal(getErrorMessage(new Error('网络不可用'), '登录失败'), '网络不可用')
  assert.equal(getErrorMessage(null, '登录失败'), '登录失败')
})
