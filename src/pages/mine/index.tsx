import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import {
  ArrowRight,
  Category,
  Message,
  Notice,
  Order,
  Setting,
  User,
} from '@nutui/icons-react-taro'
import { Button, Image, Input, Text, View } from '@tarojs/components'

import PageShell from '../../components/page-shell'
import { STORAGE_KEYS } from '../../constants'
import { getCurrentUser, updateProfile, uploadAvatar, type UserProfile } from '../../services'
import { getErrorMessage } from '../../utils/request-core'

import './index.less'

/** 昵称为空时（用户仅换过头像）兜底展示 */
const DEFAULT_NICKNAME = '微信用户'

const menuItems = [
  { key: 'files', icon: Category, title: '我的文件', url: '/pages/files/index', tab: true },
  { key: 'report', icon: Order, title: '风险报告', url: '/pages/report/index', tab: false },
  { key: 'feedback', icon: Message, title: '意见反馈', url: '', tab: false },
  { key: 'about', icon: Notice, title: '关于我们', url: '', tab: false },
]

export default function MinePage() {
  const [profile, setProfile] = useState<UserProfile>({})
  const [editingNickname, setEditingNickname] = useState(false)
  const [nicknameDraft, setNicknameDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useDidShow(() => {
    const cached = Taro.getStorageSync(STORAGE_KEYS.PROFILE) || {}
    setProfile(cached)
    // 已登录时静默拉取最新资料：换设备/清缓存后也能恢复昵称与头像
    if (Taro.getStorageSync(STORAGE_KEYS.ACCESS_TOKEN)) {
      getCurrentUser()
        .then(next => {
          if (next?.id || next?.nickname || next?.avatar) {
            Taro.setStorageSync(STORAGE_KEYS.PROFILE, next)
            setProfile(next)
          }
        })
        .catch(() => {
          // 拉取失败（含登录过期）保持本地缓存展示，由统一过期处理负责提示
        })
    }
  })

  const persistProfile = (next: UserProfile) => {
    Taro.setStorageSync(STORAGE_KEYS.PROFILE, next)
    setProfile(next)
  }

  const requireLoggedIn = (): string | null => {
    const token = Taro.getStorageSync(STORAGE_KEYS.ACCESS_TOKEN)
    if (!token) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return null
    }
    return token
  }

  // 微信 chooseAvatar 回调：先传 OSS（校验大小/类型/内容安全），
  // 再把返回的 URL 与昵称一起 POST /api/user/profile 持久化
  const handleChooseAvatar = async (event: { detail?: { avatarUrl?: string } }) => {
    const tempPath = event.detail?.avatarUrl
    if (!tempPath || uploading || saving) return
    if (!requireLoggedIn()) return

    setUploading(true)
    try {
      const avatar = await uploadAvatar(tempPath)
      const next = await updateProfile({
        nickname: profile.nickname || DEFAULT_NICKNAME,
        avatar,
      })
      persistProfile(next)
      Taro.showToast({ title: '头像已更新', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: getErrorMessage(error, '头像更新失败'), icon: 'none' })
    } finally {
      setUploading(false)
    }
  }

  const startEditNickname = () => {
    setNicknameDraft(profile.nickname || '')
    setEditingNickname(true)
  }

  const saveNickname = async () => {
    const nickname = nicknameDraft.trim()
    if (!nickname) {
      Taro.showToast({ title: '昵称不能为空', icon: 'none' })
      return
    }
    if (nickname === profile.nickname) {
      setEditingNickname(false)
      return
    }
    if (saving || uploading) return
    if (!requireLoggedIn()) return

    setSaving(true)
    try {
      const next = await updateProfile({
        nickname,
        avatar: profile.avatar,
      })
      persistProfile(next)
      Taro.showToast({ title: '昵称已更新', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: getErrorMessage(error, '昵称更新失败'), icon: 'none' })
    } finally {
      setSaving(false)
      setEditingNickname(false)
    }
  }

  const handleMenuClick = (item: (typeof menuItems)[number]) => {
    if (!item.url) {
      Taro.showToast({ title: '功能建设中', icon: 'none' })
      return
    }
    if (item.tab) {
      Taro.redirectTo({ url: item.url })
    } else {
      Taro.navigateTo({ url: item.url })
    }
  }

  return (
    <PageShell bottomNav="mine" className="mine-page">
      <View className="mine-header">
        <View className="mine-header__gear">
          <Setting size="22" />
        </View>

        <Button
          className="mine-avatar-button"
          disabled={uploading}
          openType="chooseAvatar"
          onChooseAvatar={handleChooseAvatar}
        >
          {profile.avatar ? (
            <Image className="mine-avatar-button__image" mode="aspectFill" src={profile.avatar} />
          ) : (
            <View className="mine-avatar-button__fallback">
              <User size="44" />
            </View>
          )}
        </Button>

        {editingNickname ? (
          <Input
            className="mine-nickname-input"
            focus
            maxlength={30}
            type="nickname"
            value={nicknameDraft}
            onBlur={saveNickname}
            onConfirm={saveNickname}
            onInput={event => setNicknameDraft(event.detail.value)}
          />
        ) : (
          <View
            className="mine-header__name"
            hoverClass="mine-header__name--pressed"
            onClick={startEditNickname}
          >
            <Text>{profile.nickname || DEFAULT_NICKNAME}</Text>
            <Text className="mine-header__name-hint">点击修改昵称</Text>
          </View>
        )}
        <Text className="mine-header__role">{uploading ? '头像上传中…' : '普通用户'}</Text>
      </View>

      <View className="mine-menu">
        {menuItems.map(item => {
          const Icon = item.icon
          return (
            <View
              className="mine-menu__item"
              hoverClass="mine-menu__item--pressed"
              key={item.key}
              onClick={() => handleMenuClick(item)}
            >
              <View className="mine-menu__icon">
                <Icon size="22" />
              </View>
              <Text className="mine-menu__title">{item.title}</Text>
              <ArrowRight className="mine-menu__arrow" size="16" />
            </View>
          )
        })}
      </View>
    </PageShell>
  )
}
