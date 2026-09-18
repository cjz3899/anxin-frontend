import { useEffect, useState } from 'react'
import Taro, { usePullDownRefresh } from '@tarojs/taro'
import { ArrowRight, Edit, Failure, Order, Photograph } from '@nutui/icons-react-taro'
import { Text, View } from '@tarojs/components'

import AppButton from '../../components/app-button'
import PageShell from '../../components/page-shell'
import StatusTag from '../../components/status-tag'
import { listDocuments, type DocumentRecord } from '../../services'
import {
  fileTabs,
  formatDocumentTime,
  getFileBadge,
  getFileKind,
  getFileOpenTarget,
  matchesFileTab,
  type FileKind,
  type FileTabKey,
} from './model'

import './index.less'

type LoadPhase = 'loading' | 'success' | 'error'

const SKELETON_COUNT = 4

const fileKindIcons: Record<FileKind, typeof Order> = {
  pdf: Order,
  word: Edit,
  image: Photograph,
  other: Order,
}

function FileCardSkeleton() {
  return (
    <View aria-hidden className="file-card file-card--skeleton">
      <View className="file-card__icon file-card__icon--skeleton" />
      <View className="file-card__meta">
        <View className="file-skeleton-line file-skeleton-line--name" />
        <View className="file-skeleton-line file-skeleton-line--time" />
      </View>
    </View>
  )
}

export default function FilesPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [phase, setPhase] = useState<LoadPhase>('loading')
  const [activeTab, setActiveTab] = useState<FileTabKey>('all')

  const fetchDocuments = async () => {
    try {
      setDocuments(await listDocuments())
      setPhase('success')
    } catch {
      setPhase('error')
    }
  }

  useEffect(() => {
    void fetchDocuments()
  }, [])

  usePullDownRefresh(() => {
    void fetchDocuments().finally(() => void Taro.stopPullDownRefresh())
  })

  const openDocument = (record: DocumentRecord) => {
    const fileName = encodeURIComponent(record.fileName)

    switch (getFileOpenTarget(record.status)) {
      case 'report':
        void Taro.navigateTo({
          url: `/pages/report/index?documentId=${record.id}&fileName=${fileName}`,
        })
        return
      case 'analysis':
        // 列表项不含 taskId，只带 documentId，由分析页反查该文件最近一次任务
        void Taro.navigateTo({
          url: `/pages/analysis/index?documentId=${record.id}&fileName=${fileName}`,
        })
        return
      default:
        void Taro.showToast({ title: '分析失败，请重新上传文件', icon: 'none' })
    }
  }

  const activeTabConfig = fileTabs.find(tab => tab.key === activeTab) ?? fileTabs[0]
  const visibleDocuments = documents.filter(record => matchesFileTab(record, activeTab))

  return (
    <PageShell bottomNav="files" className="files-page">
      <View className="files-tabs">
        {fileTabs.map(tab => {
          const active = tab.key === activeTab
          return (
            <View
              key={tab.key}
              className={`files-tabs__item ${active ? 'files-tabs__item--active' : ''}`}
              hoverClass="files-tabs__item--pressed"
              hoverStayTime={80}
              onClick={() => setActiveTab(tab.key)}
            >
              <Text className="files-tabs__label">{tab.label}</Text>
              <View className="files-tabs__underline" />
            </View>
          )
        })}
      </View>

      {phase === 'loading' && (
        <View className="files-list">
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <FileCardSkeleton key={index} />
          ))}
        </View>
      )}

      {phase === 'error' && (
        <View className="files-state">
          <View className="files-state__icon files-state__icon--error">
            <Failure size="34" />
          </View>
          <Text className="files-state__title">文件列表加载失败</Text>
          <Text className="files-state__description">网络似乎不太顺畅，请稍后重试</Text>
          <View className="files-state__action-wrap">
            <AppButton
              className="files-state__action"
              variant="secondary"
              onClick={() => {
                setPhase('loading')
                void fetchDocuments()
              }}
            >
              重新加载
            </AppButton>
          </View>
        </View>
      )}

      {phase === 'success' &&
        (visibleDocuments.length === 0 ? (
          <View className="files-state">
            <View className="files-state__icon">
              <Order size="34" />
            </View>
            <Text className="files-state__title">{activeTabConfig.emptyTitle}</Text>
            <Text className="files-state__description">{activeTabConfig.emptyDescription}</Text>
          </View>
        ) : (
          <View className="files-list">
            {visibleDocuments.map(record => {
              const kind = getFileKind(record.fileName)
              const badge = getFileBadge(record)
              const KindIcon = fileKindIcons[kind]
              return (
                <View
                  key={record.id}
                  className="file-card"
                  hoverClass="file-card--pressed"
                  hoverStayTime={80}
                  onClick={() => openDocument(record)}
                >
                  <View aria-hidden className={`file-card__icon file-card__icon--${kind}`}>
                    <KindIcon size="24" />
                  </View>
                  <View className="file-card__meta">
                    <Text className="file-card__name">{record.fileName}</Text>
                    <Text className="file-card__time">{formatDocumentTime(record.createdAt)}</Text>
                  </View>
                  <StatusTag showIcon={false} tone={badge.tone}>
                    {badge.text}
                  </StatusTag>
                  <View aria-hidden className="file-card__arrow">
                    <ArrowRight size="14" />
                  </View>
                </View>
              )
            })}
          </View>
        ))}
    </PageShell>
  )
}
