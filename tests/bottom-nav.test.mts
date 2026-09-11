import assert from 'node:assert/strict'
import test from 'node:test'

async function loadBottomNavController() {
  try {
    return await import('../src/components/bottom-nav/controller.ts')
  } catch {
    assert.fail('底部导航尚未与按需登录逻辑解耦')
  }
}

test('切换底部标签只执行公共页面跳转', async () => {
  const { createBottomNavHandler } = await loadBottomNavController()
  const navigatedUrls: string[] = []
  const handleNavigate = createBottomNavHandler('home', url => {
    navigatedUrls.push(url)
  })

  handleNavigate(1)
  handleNavigate(2)

  assert.deepEqual(navigatedUrls, ['/pages/files/index', '/pages/mine/index'])
})

test('点击当前底部标签时不重复跳转', async () => {
  const { createBottomNavHandler } = await loadBottomNavController()
  const navigatedUrls: string[] = []
  const handleNavigate = createBottomNavHandler('files', url => {
    navigatedUrls.push(url)
  })

  handleNavigate(1)

  assert.deepEqual(navigatedUrls, [])
})
