import { useCallback, useEffect, useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { ArrowLeft, ArrowRight, LocationF } from '@nutui/icons-react-taro'
import { Text, View } from '@tarojs/components'

import EmptyPage from '../../components/empty-page'
import PageShell from '../../components/page-shell'
import StatusTag from '../../components/status-tag'
import { getRiskDetail, getRiskReport, type RiskDetail } from '../../services'
import { riskLevelView } from '../../utils/risk-level'

import './index.less'

export default function RiskDetailPage() {
  const { params } = useRouter()
  const documentId = params.documentId ?? ''
  const riskId = params.riskId ?? ''

  const [riskIds, setRiskIds] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [detail, setDetail] = useState<RiskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)

  // 加载报告以确定风险列表顺序与当前条目位置
  useEffect(() => {
    if (!documentId) {
      setLoading(false)
      return
    }
    let cancelled = false
    getRiskReport(documentId)
      .then(report => {
        if (cancelled) return
        const ids = report.risks.map(risk => risk.id)
        setRiskIds(ids)
        const index = riskId ? ids.indexOf(riskId) : 0
        setCurrentIndex(index >= 0 ? index : 0)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [documentId, riskId])

  // 加载当前风险条目的切分报告详情
  const loadDetail = useCallback(
    (id: string) => {
      setSwitching(true)
      getRiskDetail(documentId, id)
        .then(setDetail)
        .catch(() => Taro.showToast({ title: '详情加载失败', icon: 'none' }))
        .finally(() => {
          setLoading(false)
          setSwitching(false)
        })
    },
    [documentId]
  )

  useEffect(() => {
    if (currentIndex < 0 || currentIndex >= riskIds.length) return
    loadDetail(riskIds[currentIndex])
  }, [currentIndex, riskIds, loadDetail])

  const handleSwitch = (offset: number) => {
    const next = currentIndex + offset
    if (next < 0 || next >= riskIds.length || switching) return
    setDetail(null)
    setCurrentIndex(next)
  }

  if (loading || currentIndex < 0) {
    return (
      <PageShell className="empty-shell">
        <EmptyPage
          description="正在加载切分报告…"
          icon={<LocationF size="34" />}
          showConstruction={false}
          title="风险报告详情"
        />
      </PageShell>
    )
  }

  if (!detail) {
    return (
      <PageShell className="empty-shell">
        <EmptyPage
          description="未找到该风险条目，可能报告已更新，请返回风险报告重新进入。"
          icon={<LocationF size="34" />}
          showConstruction={false}
          title="风险报告详情"
        />
      </PageShell>
    )
  }

  const level = riskLevelView(detail.riskLevel)
  const sections = [
    { key: 'quote', title: '原文引用', content: detail.originalText },
    { key: 'analysis', title: '风险分析', content: detail.reason },
    { key: 'impact', title: '潜在影响', content: detail.impact },
    { key: 'suggestion', title: '修改建议', content: detail.suggestion },
  ].filter(section => section.content)

  return (
    <PageShell className="risk-detail-page">
      <View className="risk-detail-heading">
        <View className="risk-detail-heading__badge">
          <Text>{currentIndex + 1}</Text>
        </View>
        <Text className="risk-detail-heading__title">{detail.title}</Text>
        <StatusTag tone={level.tone}>{level.text}</StatusTag>
      </View>

      {sections.map(section => (
        <View className={`detail-card detail-card--${section.key}`} key={section.key}>
          <View className="detail-card__heading">
            <View className="detail-card__accent" />
            <Text className="detail-card__title">{section.title}</Text>
          </View>
          <Text className="detail-card__content">{section.content}</Text>
        </View>
      ))}

      <View className="source-location">
        <View className="source-location__icon">
          <LocationF size="20" />
        </View>
        <Text>
          定位原文{detail.sectionNo ? ` 第 ${detail.sectionNo} 条` : ''}
          {detail.sectionTitle ? ` · ${detail.sectionTitle}` : ''}
        </Text>
      </View>

      {riskIds.length > 0 && (
        <View className="risk-switcher">
          <View
            className={`risk-switcher__button ${currentIndex === 0 ? 'risk-switcher__button--disabled' : ''}`}
            hoverClass={currentIndex === 0 ? '' : 'risk-switcher__button--pressed'}
            onClick={() => handleSwitch(-1)}
          >
            <ArrowLeft size="16" />
            <Text>上一条</Text>
          </View>
          <Text className="risk-switcher__indicator">
            {currentIndex + 1}/{riskIds.length}
          </Text>
          <View
            className={`risk-switcher__button ${currentIndex === riskIds.length - 1 ? 'risk-switcher__button--disabled' : ''}`}
            hoverClass={currentIndex === riskIds.length - 1 ? '' : 'risk-switcher__button--pressed'}
            onClick={() => handleSwitch(1)}
          >
            <Text>下一条</Text>
            <ArrowRight size="16" />
          </View>
        </View>
      )}
    </PageShell>
  )
}
