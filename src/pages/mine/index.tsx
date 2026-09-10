import { View } from '@tarojs/components'

import BottomNav from '../../components/bottom-nav'
import EmptyPage from '../../components/empty-page'

export default function MinePage() {
  return (
    <View>
      <EmptyPage
        icon="◉"
        title="我的"
        description="个人资料、会员权益与意见反馈将在后续版本中提供。"
      />
      <BottomNav active="mine" />
    </View>
  )
}
