import { Message } from '@nutui/icons-react-taro'

import EmptyPage from '../../components/empty-page'
import PageShell from '../../components/page-shell'

export default function ChatPage() {
  return (
    <PageShell className="empty-shell">
      <EmptyPage
        description="待文件问答接口完成后，可在这里基于合同内容进行追问。"
        icon={<Message size="34" />}
        title="智能问答"
      />
    </PageShell>
  )
}
