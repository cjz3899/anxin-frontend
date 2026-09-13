import type { ReactNode } from 'react'
import { ShieldCheck, Success, Tips, Warning } from '@nutui/icons-react-taro'
import { Text, View } from '@tarojs/components'

export type StatusTone = 'danger' | 'warning' | 'success' | 'info' | 'neutral'

export interface StatusTagProps {
  children: ReactNode
  tone?: StatusTone
  showIcon?: boolean
  className?: string
}

function StatusIcon({ tone }: { tone: StatusTone }) {
  if (tone === 'danger') return <Warning size="12" />
  if (tone === 'warning') return <Tips size="12" />
  if (tone === 'success') return <Success size="12" />
  return <ShieldCheck size="12" />
}

export default function StatusTag({
  children,
  tone = 'neutral',
  showIcon = true,
  className = '',
}: StatusTagProps) {
  return (
    <View className={`status-tag status-tag--${tone} ${className}`.trim()}>
      {showIcon && (
        <View aria-hidden className="status-tag__icon">
          <StatusIcon tone={tone} />
        </View>
      )}
      <Text className="status-tag__text">{children}</Text>
    </View>
  )
}
