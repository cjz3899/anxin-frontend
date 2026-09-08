import { useState } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import { View, Text, Button, Input, ScrollView } from '@tarojs/components'

import { login, logout, refresh, updateProfile, uploadAvatar, UserProfile } from '../../services'
import { STORAGE_KEYS } from '../../constants'

import './index.less'

interface LogItem {
  time: string
  text: string
  kind?: string
}

function pad(n: number): string {
  return n < 10 ? '0' + n : '' + n
}

function errText(err: any): string {
  return String(err?.msg || err?.errMsg || err?.message || err || '')
}

export default function Test() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [userId, setUserId] = useState('')
  const [profile, setProfile] = useState<UserProfile>({})
  const [nickname, setNickname] = useState('')
  const [avatarTempPath, setAvatarTempPath] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarStatus, setAvatarStatus] = useState('')

  const [logs, setLogs] = useState<LogItem[]>([])

  function log(text: string, kind?: string) {
    const now = new Date()
    const time = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds())
    setLogs(prev => {
      const next = prev.concat({ time, text, kind })
      return next.length > 200 ? next.slice(next.length - 200) : next
    })
  }

  useLoad(() => {
    const accessToken = Taro.getStorageSync(STORAGE_KEYS.ACCESS_TOKEN)
    const uid = Taro.getStorageSync(STORAGE_KEYS.USER_ID) || ''
    const saved = Taro.getStorageSync(STORAGE_KEYS.PROFILE) || {}
    setLoggedIn(!!accessToken)
    setUserId(uid)
    setProfile(saved)
    log(accessToken ? '已恢复本地登录态，用户 ID：' + uid : '当前未登录，请点击「微信一键登录」')
  })

  function clearLoginState() {
    Taro.removeStorageSync(STORAGE_KEYS.ACCESS_TOKEN)
    Taro.removeStorageSync(STORAGE_KEYS.REFRESH_TOKEN)
    Taro.removeStorageSync(STORAGE_KEYS.USER_ID)
    Taro.removeStorageSync(STORAGE_KEYS.PROFILE)
    setLoggedIn(false)
    setUserId('')
    setProfile({})
    setNickname('')
    setAvatarTempPath('')
    setAvatarUrl('')
    setAvatarStatus('')
  }

  async function onLogin() {
    if (loggingIn) return
    setLoggingIn(true)
    log('步骤0：调用 wx.login() 获取临时登录凭证 code…')
    try {
      const res = await Taro.login()
      if (!res.code) {
        log('wx.login 未返回 code：' + JSON.stringify(res), 'err')
        return
      }
      log('wx.login 成功，code=' + res.code.slice(0, 12) + '…（后端 code2session 换 openid）')
      const data = await login(res.code)
      Taro.setStorageSync(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken)
      Taro.setStorageSync(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken)
      Taro.setStorageSync(STORAGE_KEYS.USER_ID, data.id)
      setLoggedIn(true)
      setUserId(data.id)
      log('登录成功：userId=' + data.id + '，双 Token 已保存（access 2h / refresh 7d）', 'ok')
      Taro.showToast({ title: '登录成功', icon: 'success' })
    } catch (err) {
      log('登录失败：' + errText(err), 'err')
    } finally {
      setLoggingIn(false)
    }
  }

  async function onLogout() {
    try {
      await logout()
    } catch (err) {
      log('退出接口调用失败，本地 Token 仍会清除：' + errText(err), 'err')
    }
    clearLoginState()
    log('已退出登录，本地 Token 已清除', 'ok')
    Taro.showToast({ title: '已退出', icon: 'none' })
  }

  async function onRefresh() {
    const refreshToken = Taro.getStorageSync(STORAGE_KEYS.REFRESH_TOKEN)
    if (!refreshToken) {
      Taro.showToast({ title: '无 refreshToken', icon: 'none' })
      return
    }
    setRefreshing(true)
    log('调用 POST /api/user/refresh 轮换双 Token…')
    try {
      const data = await refresh(refreshToken)
      Taro.setStorageSync(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken)
      Taro.setStorageSync(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken)
      Taro.setStorageSync(STORAGE_KEYS.USER_ID, data.id)
      setUserId(data.id)
      log('Token 刷新成功，旧 accessToken 已作废', 'ok')
      Taro.showToast({ title: '刷新成功', icon: 'success' })
    } catch (err) {
      log('刷新失败：' + errText(err), 'err')
    } finally {
      setRefreshing(false)
    }
  }

  function onChooseAvatar(e: any) {
    const path = e.detail.avatarUrl
    if (!path) return
    setAvatarTempPath(path)
    setAvatarUrl('')
    setAvatarStatus('已选择头像，点击「上传头像」')
    log('已选择头像临时文件：' + path)
  }

  function onNicknameInput(e: any) {
    setNickname(e.detail.value)
  }

  async function onUploadAvatar() {
    const token = Taro.getStorageSync(STORAGE_KEYS.ACCESS_TOKEN)
    if (!token) {
      log('未检测到登录 Token，请先登录', 'err')
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    if (!avatarTempPath) {
      Taro.showToast({ title: '请先选择头像', icon: 'none' })
      return
    }
    setUploading(true)
    setAvatarStatus('上传中…后端校验大小/真实类型 + 微信 imgSecCheck 内容安全')
    log('步骤1：上传头像 → POST /api/user/avatar（multipart 字段 file）')
    try {
      const url = await uploadAvatar(avatarTempPath)
      setAvatarUrl(url)
      setAvatarStatus('审核通过，图片已存入 OSS：' + url)
      log('头像上传成功：' + url, 'ok')
    } catch (err) {
      const code = err?.code
      let text: string
      if (code === 10008) text = '微信内容安全判定违规，文件已被拦截'
      else if (code === 10009) text = '微信内容安全服务不可用（appid/secret 或 access_token 异常）'
      else text = '头像上传失败：' + errText(err)
      setAvatarStatus(text)
      log(text, 'err')
    } finally {
      setUploading(false)
    }
  }

  async function onSaveProfile() {
    const token = Taro.getStorageSync(STORAGE_KEYS.ACCESS_TOKEN)
    if (!token) {
      log('未检测到登录 Token，请先登录', 'err')
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    const n = nickname.trim()
    if (!n) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    const payload: { nickname: string; avatar?: string } = { nickname: n }
    if (avatarUrl) payload.avatar = avatarUrl
    setSaving(true)
    log('步骤2：POST /api/user/profile，body=' + JSON.stringify(payload))
    try {
      const p = await updateProfile(payload)
      Taro.setStorageSync(STORAGE_KEYS.PROFILE, p)
      setProfile(p)
      setNickname('')
      setAvatarTempPath('')
      setAvatarUrl('')
      setAvatarStatus('')
      log('资料保存成功，服务端返回：' + JSON.stringify(p), 'ok')
      Taro.showToast({ title: '资料已保存', icon: 'success' })
    } catch (err) {
      log('保存失败：' + errText(err), 'err')
    } finally {
      setSaving(false)
    }
  }

  function onClearLog() {
    setLogs([])
  }

  return (
    <View className="test">
      <View className="test__header">
        <Text className="test__title">接口测试</Text>
        <Text className="test__subtitle">微信登录 → 头像上传 → 资料保存</Text>
      </View>

      <View className="test__body">
        <View className="test__section">
          <Button className="test__btn" onClick={onLogin} loading={loggingIn} disabled={loggingIn}>
            {loggedIn ? '重新登录' : '微信一键登录'}
          </Button>
          <Button className="test__btn" onClick={onLogout} disabled={!loggedIn}>
            退出登录
          </Button>
          <Button
            className="test__btn"
            onClick={onRefresh}
            loading={refreshing}
            disabled={refreshing || !loggedIn}
          >
            刷新 Token
          </Button>
        </View>

        <View className="test__info">
          <Text>userId：{userId || '未登录'}</Text>
          <Text>昵称：{profile.nickname || '未设置'}</Text>
          <Text>头像：{profile.avatar || '未设置'}</Text>
        </View>

        <View className="test__section">
          <Button className="test__btn" openType="chooseAvatar" onChooseAvatar={onChooseAvatar}>
            选择头像
          </Button>
          <Button
            className="test__btn"
            onClick={onUploadAvatar}
            loading={uploading}
            disabled={uploading || !loggedIn}
          >
            上传头像
          </Button>
          <Input
            className="test__input"
            type="nickname"
            placeholder="请输入昵称"
            value={nickname}
            onInput={onNicknameInput}
          />
          <Button
            className="test__btn"
            onClick={onSaveProfile}
            loading={saving}
            disabled={saving || !loggedIn}
          >
            保存资料
          </Button>
        </View>

        <Text className="test__status">{avatarStatus}</Text>

        <View className="test__section">
          <View className="test__log-title">
            <Text>运行日志</Text>
            <Button size="mini" onClick={onClearLog}>
              清空
            </Button>
          </View>
          <ScrollView className="test__log" scrollY>
            {logs.map((item, i) => (
              <View key={i} className={`test__log-item test__log-item--${item.kind || 'info'}`}>
                <Text>
                  {item.time} {item.text}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  )
}
