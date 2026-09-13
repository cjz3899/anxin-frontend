import assert from 'node:assert/strict'
import test from 'node:test'

async function loadAuthExpiration() {
  try {
    return await import('../src/utils/auth-expiration.ts')
  } catch {
    assert.fail('登录过期处理尚未从页面跳转中解耦')
  }
}

test('登录过期时仅清理本地会话并提示用户重新操作', async () => {
  const { expireAuthSession } = await loadAuthExpiration()
  const removedKeys: string[] = []
  const messages: string[] = []

  expireAuthSession({
    removeStorage: key => removedKeys.push(key),
    notify: message => messages.push(message),
  })

  assert.deepEqual(removedKeys, ['accessToken', 'refreshToken', 'userId', 'loginProfile'])
  assert.deepEqual(messages, ['登录已过期，请重新操作'])
})
