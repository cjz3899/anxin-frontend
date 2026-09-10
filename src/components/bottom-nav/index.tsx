import Taro from '@tarojs/taro'
import { Text, View } from '@tarojs/components'

import { openProtectedPage } from '../../utils/protected-navigation'

import './index.less'

export type BottomNavKey = 'home' | 'files' | 'mine'

interface BottomNavProps {
  active: BottomNavKey
}

const items: Array<{ key: BottomNavKey; icon: string; label: string; url: string }> = [
  { key: 'home', icon: '⌂', label: '首页', url: '/pages/index/index' },
  { key: 'files', icon: '▣', label: '文件', url: '/pages/files/index' },
  { key: 'mine', icon: '◉', label: '我的', url: '/pages/mine/index' },
]

export default function BottomNav({ active }: BottomNavProps) {
  const handleNavigate = (key: BottomNavKey, url: string) => {
    if (key === active) return
    if (key === 'home') {
      void Taro.reLaunch({ url })
      return
    }
    void openProtectedPage(url, 'reLaunch')
  }

  return (
    <View className="bottom-nav">
      {items.map(item => (
        <View
          className={`bottom-nav__item ${item.key === active ? 'bottom-nav__item--active' : ''}`}
          key={item.key}
          hoverClass="bottom-nav__item--pressed"
          onClick={() => handleNavigate(item.key, item.url)}
        >
          <Text className="bottom-nav__icon">{item.icon}</Text>
          <Text className="bottom-nav__label">{item.label}</Text>
        </View>
      ))}
    </View>
  )
}
