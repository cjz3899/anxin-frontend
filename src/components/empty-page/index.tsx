import type { ReactNode } from 'react'
import Empty from '@nutui/nutui-react-taro/dist/es/packages/empty'
import { View } from '@tarojs/components'

import StatusTag from '../status-tag'

export interface EmptyPageProps {
  icon: ReactNode
  title: string
  description: string
}

export default function EmptyPage({ icon, title, description }: EmptyPageProps) {
  return (
    <View className="empty-page">
      <Empty
        description={description}
        image={<View className="empty-page__icon">{icon}</View>}
        imageSize="152rpx"
        size="base"
        status="empty"
        title={title}
      />
      <StatusTag tone="info">页面建设中</StatusTag>
    </View>
  )
}
