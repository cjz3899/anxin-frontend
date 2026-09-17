import type { ReactNode } from 'react'
import Empty from '@nutui/nutui-react-taro/dist/es/packages/empty'
import { View } from '@tarojs/components'

import StatusTag from '../status-tag'

export interface EmptyPageProps {
  icon: ReactNode
  title: string
  description: string
  /** 是否展示“页面建设中”标签，默认展示；接入真实数据的状态请关闭 */
  showConstruction?: boolean
}

export default function EmptyPage({
  icon,
  title,
  description,
  showConstruction = true,
}: EmptyPageProps) {
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
      {showConstruction && <StatusTag tone="info">页面建设中</StatusTag>}
    </View>
  )
}
