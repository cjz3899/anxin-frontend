import assert from 'node:assert/strict'
import test from 'node:test'

test('小程序启动时直接进入首页且不注册登录页', async () => {
  globalThis.defineAppConfig = config => config

  const { default: config } = await import('../src/app.config.ts')

  assert.equal(config.pages[0], 'pages/index/index')
  assert.equal(config.pages.includes('pages/login/index'), false)
})
