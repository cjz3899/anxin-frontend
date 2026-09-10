import { Text, View } from '@tarojs/components'

import './index.less'

interface EmptyPageProps {
  icon: string
  title: string
  description: string
}

export default function EmptyPage({ icon, title, description }: EmptyPageProps) {
  return (
    <View className="empty-page">
      <View className="empty-page__glow" />
      <View className="empty-page__icon">{icon}</View>
      <Text className="empty-page__title">{title}</Text>
      <Text className="empty-page__description">{description}</Text>
      <View className="empty-page__status">页面建设中</View>
    </View>
  )
}
