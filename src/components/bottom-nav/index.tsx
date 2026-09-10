import Taro from '@tarojs/taro'
import { Home, Order, User } from '@nutui/icons-react-taro'
import Tabbar from '@nutui/nutui-react-taro/dist/es/packages/tabbar'

import { openProtectedPage } from '../../utils/protected-navigation'

export type BottomNavKey = 'home' | 'files' | 'mine'

export interface BottomNavProps {
  active: BottomNavKey
}

const items = [
  { key: 'home', icon: Home, label: '首页', url: '/pages/index/index' },
  { key: 'files', icon: Order, label: '文件', url: '/pages/files/index' },
  { key: 'mine', icon: User, label: '我的', url: '/pages/mine/index' },
]

export default function BottomNav({ active }: BottomNavProps) {
  const activeIndex = items.findIndex(item => item.key === active)

  const handleNavigate = (index: number) => {
    const item = items[index]
    if (!item) return
    const { key, url } = item
    if (key === active) return
    if (key === 'home') {
      void Taro.reLaunch({ url })
      return
    }
    void openProtectedPage(url, 'reLaunch')
  }

  return (
    <Tabbar
      activeColor="var(--ax-color-brand)"
      className="bottom-nav"
      fixed
      inactiveColor="var(--ax-color-text-secondary)"
      safeArea
      value={activeIndex}
      onSwitch={handleNavigate}
    >
      {items.map(item => (
        <Tabbar.Item icon={<item.icon size="22" />} key={item.key} title={item.label} />
      ))}
    </Tabbar>
  )
}
