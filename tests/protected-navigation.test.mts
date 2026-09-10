import assert from 'node:assert/strict'
import test from 'node:test'

async function loadProtectedNavigation() {
  try {
    return await import('../src/utils/protected-navigation-core.ts')
  } catch {
    assert.fail('受保护页面的按需登录导航尚未实现')
  }
}

test('创建受保护导航不会主动登录', async () => {
  const { createProtectedNavigator } = await loadProtectedNavigation()
  let loginCount = 0

  createProtectedNavigator({
    hasAccessToken: () => false,
    login: async () => {
      loginCount += 1
      return { accessToken: 'access', refreshToken: 'refresh', id: 'user' }
    },
    saveSession: () => undefined,
    navigate: async () => undefined,
    notifyLoginFailed: () => undefined,
  })

  assert.equal(loginCount, 0)
})

test('未登录时先登录并保存会话，再跳转到目标页面', async () => {
  const { createProtectedNavigator } = await loadProtectedNavigation()
  const events: string[] = []

  const navigator = createProtectedNavigator({
    hasAccessToken: () => false,
    login: async () => {
      events.push('login')
      return { accessToken: 'access', refreshToken: 'refresh', id: 'user-1' }
    },
    saveSession: session => {
      assert.deepEqual(session, {
        accessToken: 'access',
        refreshToken: 'refresh',
        id: 'user-1',
      })
      events.push('save')
    },
    navigate: async (url, mode) => {
      assert.equal(url, '/pages/upload/index')
      assert.equal(mode, 'navigateTo')
      events.push('navigate')
    },
    notifyLoginFailed: () => events.push('notify-error'),
  })

  const navigated = await navigator.open('/pages/upload/index')

  assert.equal(navigated, true)
  assert.deepEqual(events, ['login', 'save', 'navigate'])
})

test('已有登录态时直接跳转，不重复登录', async () => {
  const { createProtectedNavigator } = await loadProtectedNavigation()
  let loginCount = 0
  let navigateCount = 0

  const navigator = createProtectedNavigator({
    hasAccessToken: () => true,
    login: async () => {
      loginCount += 1
      return { accessToken: 'access', refreshToken: 'refresh', id: 'user' }
    },
    saveSession: () => undefined,
    navigate: async () => {
      navigateCount += 1
    },
    notifyLoginFailed: () => undefined,
  })

  const navigated = await navigator.open('/pages/files/index', 'reLaunch')

  assert.equal(navigated, true)
  assert.equal(loginCount, 0)
  assert.equal(navigateCount, 1)
})

test('登录失败时停留在当前页面并提示', async () => {
  const { createProtectedNavigator } = await loadProtectedNavigation()
  let navigateCount = 0
  let notificationCount = 0

  const navigator = createProtectedNavigator({
    hasAccessToken: () => false,
    login: async () => {
      throw new Error('wechat login failed')
    },
    saveSession: () => undefined,
    navigate: async () => {
      navigateCount += 1
    },
    notifyLoginFailed: () => {
      notificationCount += 1
    },
  })

  const navigated = await navigator.open('/pages/mine/index')

  assert.equal(navigated, false)
  assert.equal(navigateCount, 0)
  assert.equal(notificationCount, 1)
})
