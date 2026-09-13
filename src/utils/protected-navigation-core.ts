export interface LoginSession {
  accessToken: string
  refreshToken: string
  id: string
}

export type ProtectedNavigationMode = 'navigateTo' | 'reLaunch'

interface ProtectedNavigatorDependencies {
  hasAccessToken: () => boolean
  login: () => Promise<LoginSession>
  saveSession: (session: LoginSession) => void
  navigate: (url: string, mode: ProtectedNavigationMode) => Promise<unknown>
  notifyLoginFailed: (error: unknown) => void
  notifyNavigationFailed: (error: unknown) => void
}

export function createProtectedNavigator(dependencies: ProtectedNavigatorDependencies) {
  let pendingLogin: Promise<void> | null = null

  const ensureLoggedIn = async () => {
    if (dependencies.hasAccessToken()) return

    if (!pendingLogin) {
      pendingLogin = dependencies
        .login()
        .then(session => dependencies.saveSession(session))
        .finally(() => {
          pendingLogin = null
        })
    }

    await pendingLogin
  }

  return {
    async open(url: string, mode: ProtectedNavigationMode = 'navigateTo'): Promise<boolean> {
      try {
        await ensureLoggedIn()
      } catch (error) {
        dependencies.notifyLoginFailed(error)
        return false
      }

      try {
        await dependencies.navigate(url, mode)
        return true
      } catch (error) {
        dependencies.notifyNavigationFailed(error)
        return false
      }
    },
  }
}
