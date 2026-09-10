import Taro from '@tarojs/taro'

import { STORAGE_KEYS } from '../constants'
import { login } from '../services/user'
import { createProtectedNavigator, type ProtectedNavigationMode } from './protected-navigation-core'

const protectedNavigator = createProtectedNavigator({
  hasAccessToken: () => Boolean(Taro.getStorageSync(STORAGE_KEYS.ACCESS_TOKEN)),
  login: async () => {
    const { code } = await Taro.login()
    if (!code) throw new Error('微信登录未返回临时凭证')
    return login(code)
  },
  saveSession: session => {
    Taro.setStorageSync(STORAGE_KEYS.ACCESS_TOKEN, session.accessToken)
    Taro.setStorageSync(STORAGE_KEYS.REFRESH_TOKEN, session.refreshToken)
    Taro.setStorageSync(STORAGE_KEYS.USER_ID, session.id)
  },
  navigate: (url, mode) => Taro[mode]({ url }),
  notifyLoginFailed: () => {
    Taro.showToast({ title: '登录失败，请稍后重试', icon: 'none' })
  },
})

export function openProtectedPage(
  url: string,
  mode: ProtectedNavigationMode = 'navigateTo'
): Promise<boolean> {
  return protectedNavigator.open(url, mode)
}
