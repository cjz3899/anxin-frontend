import { Order } from '@nutui/icons-react-taro'

import EmptyPage from '../../components/empty-page'
import PageShell from '../../components/page-shell'

export default function FilesPage() {
  return (
    <PageShell bottomNav="files" className="empty-shell">
      <EmptyPage
        description="待文件列表接口完成后，可在这里查看历史文件与分析状态。"
        icon={<Order size="34" />}
        title="我的文件"
      />
    </PageShell>
  )
}
