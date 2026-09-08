import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Button } from '@tarojs/components'

import { login } from '../../services'
import { STORAGE_KEYS } from '../../constants'

import './index.less'

export default function Login() {
  const [loggingIn, setLoggingIn] = useState(false)

  function backAfterLogin() {
    if (Taro.getCurrentPages().length > 1) {
      Taro.navigateBack()
    } else {
      Taro.reLaunch({ url: '/pages/test/index' })
    }
  }

  async function onLogin() {
    if (loggingIn) return
    setLoggingIn(true)
    try {
      const res = await Taro.login()
      if (!res.code) {
        Taro.showToast({ title: '微信登录凭证获取失败', icon: 'none' })
        return
      }
      const data = await login(res.code)
      Taro.setStorageSync(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken)
      Taro.setStorageSync(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken)
      Taro.setStorageSync(STORAGE_KEYS.USER_ID, data.id)
      Taro.showToast({ title: '登录成功', icon: 'success' })
      backAfterLogin()
    } catch (err) {
      Taro.showToast({ title: err?.msg || '登录失败', icon: 'none' })
    } finally {
      setLoggingIn(false)
    }
  }

  return (
    <View className="login">
      <View className="login__header">
        <Text className="login__title">安心文档分析</Text>
        <Text className="login__subtitle">登录已过期，请重新登录</Text>
      </View>
      <View className="login__body">
        <Button className="login__btn" onClick={onLogin} loading={loggingIn} disabled={loggingIn}>
          微信一键登录
        </Button>
      </View>
    </View>
  )
}
