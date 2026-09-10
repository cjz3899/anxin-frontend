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
  notifyLoginFailed: () => void
}

export function createProtectedNavigator(dependencies: ProtectedNavigatorDependencies) {
  return {
    async open(url: string, mode: ProtectedNavigationMode = 'navigateTo'): Promise<boolean> {
      try {
        if (!dependencies.hasAccessToken()) {
          const session = await dependencies.login()
          dependencies.saveSession(session)
        }

        await dependencies.navigate(url, mode)
        return true
      } catch {
        dependencies.notifyLoginFailed()
        return false
      }
    },
  }
}
