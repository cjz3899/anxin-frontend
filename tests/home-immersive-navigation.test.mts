import assert from 'node:assert/strict'
import test from 'node:test'

test('首页使用自定义导航栏以承载沉浸式顶部背景', async () => {
  globalThis.definePageConfig = config => config

  const { default: config } = await import('../src/pages/index/index.config.ts')

  assert.equal(config.navigationStyle, 'custom')
})
