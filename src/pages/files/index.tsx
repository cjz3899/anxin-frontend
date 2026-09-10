import { View } from '@tarojs/components'

import BottomNav from '../../components/bottom-nav'
import EmptyPage from '../../components/empty-page'

export default function FilesPage() {
  return (
    <View>
      <EmptyPage
        icon="▣"
        title="我的文件"
        description="待文件列表接口完成后，可在这里查看历史文件与分析状态。"
      />
      <BottomNav active="files" />
    </View>
  )
}
