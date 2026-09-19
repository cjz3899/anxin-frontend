export interface LoginSession {
  accessToken: string
  refreshToken: string
  id: string
}

export type ProtectedNavigationMode = 'navigateTo' | 'reLaunch'

interface ProtectedNavigatorDependencies {
  hasAccessToken: () => boolean
  confirmLogin: () => Promise<boolean>
  login: () => Promise<LoginSession>
  saveSession: (session: LoginSession) => void
  navigate: (url: string, mode: ProtectedNavigationMode) => Promise<unknown>
  notifyLoginFailed: (error: unknown) => void
  notifyNavigationFailed: (error: unknown) => void
}

export function createProtectedNavigator(dependencies: ProtectedNavigatorDependencies) {
  let pendingLogin: Promise<void> | null = null
  let pendingConfirm: Promise<boolean> | null = null

  const ensureLoggedIn = async () => {
    if (dependencies.hasAccessToken()) return

    if (!pendingConfirm) {
      pendingConfirm = dependencies.confirmLogin()
      pendingConfirm.then(
        () => {
          pendingConfirm = null
        },
        () => {
          pendingConfirm = null
        }
      )
    }

    const confirmed = await pendingConfirm
    if (!confirmed) throw new Error('用户取消登录')

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
