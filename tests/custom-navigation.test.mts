import assert from 'node:assert/strict'
import test from 'node:test'

async function loadCustomNavigation() {
  try {
    return await import('../src/utils/custom-navigation.ts')
  } catch {
    assert.fail('自定义导航安全区计算尚未实现')
  }
}

test('首页内容从胶囊按钮底部的安全间距开始', async () => {
  const { getCustomNavigationTopPadding } = await loadCustomNavigation()

  assert.equal(
    getCustomNavigationTopPadding({
      menuBottom: 88,
      statusBarHeight: 24,
      windowWidth: 375,
    }),
    '200rpx'
  )
})

test('没有胶囊坐标时使用状态栏与标准导航高度回退', async () => {
  const { getCustomNavigationTopPadding } = await loadCustomNavigation()

  assert.equal(
    getCustomNavigationTopPadding({
      statusBarHeight: 24,
      windowWidth: 375,
    }),
    '160rpx'
  )
})
