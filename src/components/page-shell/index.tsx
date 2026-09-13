import type { ReactNode } from 'react'
import { View } from '@tarojs/components'

import BottomNav, { type BottomNavKey } from '../bottom-nav'

export interface PageShellProps {
  children: ReactNode
  className?: string
  bottomNav?: BottomNavKey
  safeBottom?: boolean
}

export default function PageShell({
  children,
  className = '',
  bottomNav,
  safeBottom = true,
}: PageShellProps) {
  return (
    <View
      className={`page-shell ${bottomNav ? 'page-shell--with-nav' : ''} ${safeBottom ? 'page-shell--safe-bottom' : ''} ${className}`.trim()}
    >
      {children}
      {bottomNav && <BottomNav active={bottomNav} />}
    </View>
  )
}
