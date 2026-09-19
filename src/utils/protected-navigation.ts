import Taro from '@tarojs/taro'

import { STORAGE_KEYS } from '../constants'
import { login } from '../services/user'
import {
  createLoginConfirmationController,
  type LoginConfirmationPresenter,
} from './login-confirmation'
import { createProtectedNavigator, type ProtectedNavigationMode } from './protected-navigation-core'
import { getErrorMessage } from './request-core'

const loginConfirmation = createLoginConfirmationController()

export function confirmLoginResult(confirmed: boolean) {
  loginConfirmation.resolve(confirmed)
}

export function registerLoginModal(presenter: LoginConfirmationPresenter) {
  return loginConfirmation.register(presenter)
}

const protectedNavigator = createProtectedNavigator({
  hasAccessToken: () => Boolean(Taro.getStorageSync(STORAGE_KEYS.ACCESS_TOKEN)),
  confirmLogin: () => loginConfirmation.request(),
  login: async () => {
    const { code } = await Taro.login()
    if (!code) throw new Error('微信登录未返回临时凭证')
    return login(code, { showError: false })
  },
  saveSession: session => {
    Taro.setStorageSync(STORAGE_KEYS.ACCESS_TOKEN, session.accessToken)
    Taro.setStorageSync(STORAGE_KEYS.REFRESH_TOKEN, session.refreshToken)
    Taro.setStorageSync(STORAGE_KEYS.USER_ID, session.id)
    Taro.showToast({ title: '登录成功', icon: 'success' })
  },
  navigate: (url, mode) => Taro[mode]({ url }),
  notifyLoginFailed: error => {
    Taro.showToast({ title: getErrorMessage(error, '登录失败，请稍后重试'), icon: 'none' })
  },
  notifyNavigationFailed: () => {
    Taro.showToast({ title: '页面打开失败，请重试', icon: 'none' })
  },
})

export function openProtectedPage(
  url: string,
  mode: ProtectedNavigationMode = 'navigateTo'
): Promise<boolean> {
  return protectedNavigator.open(url, mode)
}
