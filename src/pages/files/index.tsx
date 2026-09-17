import { useCallback, useEffect, useState } from 'react'
import Taro, { useReachBottom } from '@tarojs/taro'
import { Edit, Order, Photograph } from '@nutui/icons-react-taro'
import { Text, View } from '@tarojs/components'

import EmptyPage from '../../components/empty-page'
import PageShell from '../../components/page-shell'
import StatusTag, { type StatusTone } from '../../components/status-tag'
import { getDocumentList, type DocumentListItem, type DocumentStatusGroup } from '../../services'
import { formatDateTime, formatFileSize } from '../../utils/format'
import { riskLevelView } from '../../utils/risk-level'

import './index.less'

const PAGE_SIZE = 10

const tabs: { key: DocumentStatusGroup; label: string }[] = [
  { key: 'ALL', label: '全部' },
  { key: 'PROCESSING', label: '分析中' },
  { key: 'SUCCESS', label: '已完成' },
]

type FileIconType = 'pdf' | 'word' | 'image' | 'other'

function fileTypeIcon(fileType: string): { Icon: typeof Order; type: FileIconType } {
  const value = (fileType || '').toUpperCase()
  if (value.includes('PDF')) return { Icon: Order, type: 'pdf' }
  if (value.includes('DOC') || value.includes('WORD')) return { Icon: Edit, type: 'word' }
  if (value.includes('JPG') || value.includes('PNG') || value.includes('IMAGE'))
    return { Icon: Photograph, type: 'image' }
  return { Icon: Order, type: 'other' }
}

function statusView(item: DocumentListItem): { text: string; tone: StatusTone } {
  if (item.status === 'SUCCESS') {
    const level = riskLevelView(item.riskLevel)
    if (item.riskLevel) return { text: level.text, tone: level.tone }
    return { text: '已完成', tone: 'success' }
  }
  if (item.status === 'FAILED') return { text: '分析失败', tone: 'danger' }
  if (item.status === 'PENDING') return { text: '排队中', tone: 'warning' }
  return { text: '分析中', tone: 'warning' }
}

export default function FilesPage() {
  const [activeTab, setActiveTab] = useState<DocumentStatusGroup>('ALL')
  const [items, setItems] = useState<DocumentListItem[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [total, setTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)

  const loadPage = useCallback(async (group: DocumentStatusGroup, nextCursor?: string) => {
    setLoading(true)
    setLoadFailed(false)
    try {
      const page = await getDocumentList(PAGE_SIZE, group, nextCursor)
      setItems(prev => (nextCursor ? [...prev, ...page.records] : page.records))
      setCursor(page.nextCursor)
      setTotal(page.total)
      setHasMore(Boolean(page.nextCursor))
    } catch {
      setLoadFailed(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setHasMore(true)
    void loadPage(activeTab)
  }, [activeTab, loadPage])

  const handleTabChange = (key: DocumentStatusGroup) => {
    if (key === activeTab) return
    setActiveTab(key)
  }

  const loadMore = () => {
    if (loading || !hasMore || !cursor) return
    void loadPage(activeTab, cursor)
  }

  useReachBottom(loadMore)

  const openReport = (documentId: string) => {
    Taro.navigateTo({ url: `/pages/report/index?documentId=${documentId}` })
  }

  return (
    <PageShell bottomNav="files" className="files-page">
      <View className="files-tabs">
        {tabs.map(tab => (
          <View
            className={`files-tabs__item ${activeTab === tab.key ? 'files-tabs__item--active' : ''}`}
            hoverClass="files-tabs__item--pressed"
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
          >
            <Text>{tab.label}</Text>
          </View>
        ))}
      </View>

      {total !== null && total > 0 && <Text className="files-total">共 {total} 个文件</Text>}

      {items.length === 0 && !loading ? (
        <EmptyPage
          description={
            loadFailed
              ? '文件列表加载失败，请下拉重试。'
              : '还没有文件，去首页上传一份合同开始分析吧。'
          }
          icon={<Order size="34" />}
          showConstruction={false}
          title="我的文件"
        />
      ) : (
        items.map(item => {
          const { Icon, type } = fileTypeIcon(item.fileType)
          const status = statusView(item)
          return (
            <View
              className="file-row"
              hoverClass="file-row--pressed"
              key={item.id}
              onClick={() => openReport(item.id)}
            >
              <View className={`file-row__icon file-row__icon--${type}`}>
                <Icon size="26" />
              </View>
              <View className="file-row__body">
                <Text className="file-row__name">{item.fileName}</Text>
                <Text className="file-row__meta">
                  {formatDateTime(item.createdTime)} · {formatFileSize(item.fileSize)}
                </Text>
              </View>
              <StatusTag tone={status.tone}>{status.text}</StatusTag>
            </View>
          )
        })
      )}

      {loading && <Text className="files-loading">加载中…</Text>}
      {!loading && items.length > 0 && !hasMore && (
        <Text className="files-loading">没有更多文件了</Text>
      )}
    </PageShell>
  )
}
