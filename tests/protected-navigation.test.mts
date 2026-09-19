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
    confirmLogin: async () => true,
    login: async () => {
      loginCount += 1
      return { accessToken: 'access', refreshToken: 'refresh', id: 'user' }
    },
    saveSession: () => undefined,
    navigate: async () => undefined,
    notifyLoginFailed: () => undefined,
    notifyNavigationFailed: () => undefined,
  })

  assert.equal(loginCount, 0)
})

test('未登录时先登录并保存会话，再跳转到目标页面', async () => {
  const { createProtectedNavigator } = await loadProtectedNavigation()
  const events: string[] = []

  const navigator = createProtectedNavigator({
    hasAccessToken: () => false,
    confirmLogin: async () => {
      events.push('confirm')
      return true
    },
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
    notifyNavigationFailed: () => events.push('notify-navigation-error'),
  })

  const navigated = await navigator.open('/pages/upload/index')

  assert.equal(navigated, true)
  assert.deepEqual(events, ['confirm', 'login', 'save', 'navigate'])
})

test('已有登录态时直接跳转，不重复登录', async () => {
  const { createProtectedNavigator } = await loadProtectedNavigation()
  let loginCount = 0
  let navigateCount = 0
  let confirmCount = 0

  const navigator = createProtectedNavigator({
    hasAccessToken: () => true,
    confirmLogin: async () => {
      confirmCount += 1
      return true
    },
    login: async () => {
      loginCount += 1
      return { accessToken: 'access', refreshToken: 'refresh', id: 'user' }
    },
    saveSession: () => undefined,
    navigate: async () => {
      navigateCount += 1
    },
    notifyLoginFailed: () => undefined,
    notifyNavigationFailed: () => undefined,
  })

  const navigated = await navigator.open('/pages/files/index', 'reLaunch')

  assert.equal(navigated, true)
  assert.equal(confirmCount, 0)
  assert.equal(loginCount, 0)
  assert.equal(navigateCount, 1)
})

test('登录失败时停留在当前页面并提示', async () => {
  const { createProtectedNavigator } = await loadProtectedNavigation()
  let navigateCount = 0
  let notificationCount = 0

  const navigator = createProtectedNavigator({
    hasAccessToken: () => false,
    confirmLogin: async () => true,
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
    notifyNavigationFailed: () => undefined,
  })

  const navigated = await navigator.open('/pages/mine/index')

  assert.equal(navigated, false)
  assert.equal(navigateCount, 0)
  assert.equal(notificationCount, 1)
})

test('用户取消登录时停留在当前页面', async () => {
  const { createProtectedNavigator } = await loadProtectedNavigation()
  let loginCount = 0
  let navigateCount = 0
  let notificationCount = 0

  const navigator = createProtectedNavigator({
    hasAccessToken: () => false,
    confirmLogin: async () => false,
    login: async () => {
      loginCount += 1
      return { accessToken: 'access', refreshToken: 'refresh', id: 'user' }
    },
    saveSession: () => undefined,
    navigate: async () => {
      navigateCount += 1
    },
    notifyLoginFailed: () => {
      notificationCount += 1
    },
    notifyNavigationFailed: () => undefined,
  })

  const navigated = await navigator.open('/pages/upload/index')

  assert.equal(navigated, false)
  assert.equal(loginCount, 0)
  assert.equal(navigateCount, 0)
  assert.equal(notificationCount, 1)
})

test('并发打开受保护页面时复用同一次登录并保存同一套会话', async () => {
  const { createProtectedNavigator } = await loadProtectedNavigation()
  let loginCount = 0
  let confirmCount = 0
  let resolveLogin: ((session: { accessToken: string; refreshToken: string; id: string }) => void) | undefined
  const loginPromise = new Promise<{ accessToken: string; refreshToken: string; id: string }>(resolve => {
    resolveLogin = resolve
  })
  let saveCount = 0
  const navigatedUrls: string[] = []

  const navigator = createProtectedNavigator({
    hasAccessToken: () => false,
    confirmLogin: async () => {
      confirmCount += 1
      return true
    },
    login: () => {
      loginCount += 1
      return loginPromise
    },
    saveSession: () => {
      saveCount += 1
    },
    navigate: async url => {
      navigatedUrls.push(url)
    },
    notifyLoginFailed: () => undefined,
    notifyNavigationFailed: () => undefined,
  })

  const firstOpen = navigator.open('/pages/upload/index')
  const secondOpen = navigator.open('/pages/report/index')

  assert.equal(confirmCount, 1)

  await new Promise(resolve => setTimeout(resolve, 0))

  assert.equal(loginCount, 1)
  resolveLogin?.({ accessToken: 'access', refreshToken: 'refresh', id: 'user' })

  assert.deepEqual(await Promise.all([firstOpen, secondOpen]), [true, true])
  assert.equal(saveCount, 1)
  assert.deepEqual(navigatedUrls, ['/pages/upload/index', '/pages/report/index'])
})

test('登录失败时将后端原始错误交给提示层', async () => {
  const { createProtectedNavigator } = await loadProtectedNavigation()
  const backendError = { code: 10002, msg: '微信登录失败: invalid appsecret' }
  let receivedError: unknown

  const navigator = createProtectedNavigator({
    hasAccessToken: () => false,
    confirmLogin: async () => true,
    login: async () => {
      throw backendError
    },
    saveSession: () => undefined,
    navigate: async () => undefined,
    notifyLoginFailed: error => {
      receivedError = error
    },
    notifyNavigationFailed: () => undefined,
  })

  assert.equal(await navigator.open('/pages/upload/index'), false)
  assert.equal(receivedError, backendError)
})

test('页面跳转失败不会被误报为登录失败', async () => {
  const { createProtectedNavigator } = await loadProtectedNavigation()
  let loginFailureCount = 0
  let navigationFailureCount = 0

  const navigator = createProtectedNavigator({
    hasAccessToken: () => true,
    confirmLogin: async () => true,
    login: async () => ({ accessToken: 'access', refreshToken: 'refresh', id: 'user' }),
    saveSession: () => undefined,
    navigate: async () => {
      throw new Error('navigation failed')
    },
    notifyLoginFailed: () => {
      loginFailureCount += 1
    },
    notifyNavigationFailed: () => {
      navigationFailureCount += 1
    },
  })

  assert.equal(await navigator.open('/pages/upload/index'), false)
  assert.equal(loginFailureCount, 0)
  assert.equal(navigationFailureCount, 1)
})
