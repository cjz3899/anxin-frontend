import assert from 'node:assert/strict'
import test from 'node:test'

async function loadHomeFeatures() {
  try {
    return await import('../src/pages/index/home-features.ts')
  } catch {
    assert.fail('首页功能入口配置尚未实现')
  }
}

test('首页四个功能入口均使用受保护页面路由', async () => {
  const { homeFeatures } = await loadHomeFeatures()

  assert.deepEqual(
    homeFeatures.map(feature => ({ id: feature.id, url: feature.url })),
    [
      { id: 'analysis', url: '/pages/upload/index' },
      { id: 'report', url: '/pages/report/index' },
      { id: 'chat', url: '/pages/chat/index' },
      { id: 'files', url: '/pages/files/index' },
    ]
  )
})
