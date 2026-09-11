export const bottomNavItems = [
  { key: 'home', label: '首页', url: '/pages/index/index' },
  { key: 'files', label: '文件', url: '/pages/files/index' },
  { key: 'mine', label: '我的', url: '/pages/mine/index' },
] as const

export type BottomNavKey = (typeof bottomNavItems)[number]['key']

export function createBottomNavHandler(active: BottomNavKey, navigate: (url: string) => void) {
  return (index: number) => {
    const item = bottomNavItems[index]
    if (!item || item.key === active) return

    navigate(item.url)
  }
}
