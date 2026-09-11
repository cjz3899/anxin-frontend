import Taro from '@tarojs/taro'
import { Home, Order, User } from '@nutui/icons-react-taro'
import Tabbar from '@nutui/nutui-react-taro/dist/es/packages/tabbar'

import { bottomNavItems, createBottomNavHandler, type BottomNavKey } from './controller'

export type { BottomNavKey } from './controller'

export interface BottomNavProps {
  active: BottomNavKey
}

const icons = { home: Home, files: Order, mine: User }

export default function BottomNav({ active }: BottomNavProps) {
  const activeIndex = bottomNavItems.findIndex(item => item.key === active)
  const handleNavigate = createBottomNavHandler(active, url => {
    void Taro.reLaunch({ url })
  })

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
      {bottomNavItems.map(item => {
        const Icon = icons[item.key]
        return <Tabbar.Item icon={<Icon size="22" />} key={item.key} title={item.label} />
      })}
    </Tabbar>
  )
}
