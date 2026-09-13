const AUTH_SESSION_STORAGE_KEYS = ['accessToken', 'refreshToken', 'userId', 'loginProfile'] as const

interface AuthExpirationDependencies {
  removeStorage: (key: string) => void
  notify: (message: string) => void
}

export function expireAuthSession({ removeStorage, notify }: AuthExpirationDependencies): void {
  AUTH_SESSION_STORAGE_KEYS.forEach(key => removeStorage(key))
  notify('登录已过期，请重新操作')
}
