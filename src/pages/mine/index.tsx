import { User } from '@nutui/icons-react-taro'

import EmptyPage from '../../components/empty-page'
import PageShell from '../../components/page-shell'

export default function MinePage() {
  return (
    <PageShell bottomNav="mine" className="empty-shell">
      <EmptyPage
        description="个人资料、会员权益与意见反馈将在后续版本中提供。"
        icon={<User size="34" />}
        title="我的"
      />
    </PageShell>
  )
}
