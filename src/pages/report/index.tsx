import { useEffect, useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { ArrowRight, Order, Tips, Warning } from '@nutui/icons-react-taro'
import { Text, View } from '@tarojs/components'

import AppButton from '../../components/app-button'
import EmptyPage from '../../components/empty-page'
import PageShell from '../../components/page-shell'
import StatusTag from '../../components/status-tag'
import { getDocumentList, getRiskReport, type RiskReport } from '../../services'
import { formatDateTime, formatFileSize } from '../../utils/format'
import { riskLevelView } from '../../utils/risk-level'

import './index.less'

export default function ReportPage() {
  const { params } = useRouter()
  const documentId = params.documentId ?? ''

  const [report, setReport] = useState<RiskReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)

  const loadReport = (id: string) => {
    setLoading(true)
    setLoadFailed(false)
    getRiskReport(id)
      .then(setReport)
      .catch(() => setLoadFailed(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (documentId) {
      loadReport(documentId)
      return
    }
    // 未指定文件（如从首页“风险报告”进入）：自动定位最近一次分析完成的文件
    getDocumentList(1, 'SUCCESS')
      .then(page => {
        const latest = page.records[0]
        if (latest) loadReport(latest.id)
        else setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [documentId])

  const level = riskLevelView(report?.riskLevel)
  // 风险等级旁展示对应数量（按等级聚合当前风险列表）
  const levelCounts: Record<string, number> = {}
  for (const risk of report?.risks ?? []) {
    levelCounts[risk.riskLevel] = (levelCounts[risk.riskLevel] ?? 0) + 1
  }

  const handleOpenChat = () => {
    if (!report) return
    Taro.navigateTo({
      url: `/pages/chat/index?documentId=${report.documentId}&fileName=${encodeURIComponent(report.fileName)}`,
    })
  }

  if (loading) {
    return (
      <PageShell className="empty-shell">
        <EmptyPage
          description="正在加载风险报告…"
          icon={<Order size="34" />}
          showConstruction={false}
          title="风险报告"
        />
      </PageShell>
    )
  }

  if (!report) {
    return (
      <PageShell className="empty-shell">
        <EmptyPage
          description={
            loadFailed
              ? '报告加载失败，请稍后重试。'
              : '先上传或选择一个已分析完成的文件，即可查看风险报告。'
          }
          icon={<Order size="34" />}
          showConstruction={false}
          title="风险报告"
        />
      </PageShell>
    )
  }

  return (
    <PageShell className="report-page">
      <View className={`risk-summary risk-summary--${level.className}`}>
        <View className="risk-summary__mark">
          <Warning size="24" />
        </View>
        <View className="risk-summary__content">
          <Text className="risk-summary__title">风险等级：{level.text}</Text>
          <Text className="risk-summary__description">共发现 {report.riskCount} 项风险问题</Text>
        </View>
        <View className="risk-summary__score">{level.text.charAt(0)}</View>
      </View>

      <View className="report-card document-overview">
        <Text className="report-card__title">文件概览</Text>
        <View className="document-overview__row">
          <Text className="document-overview__label">文件名称</Text>
          <Text className="document-overview__value">{report.fileName}</Text>
        </View>
        <View className="document-overview__row">
          <Text className="document-overview__label">文件类型</Text>
          <Text className="document-overview__value">{report.fileType}</Text>
        </View>
        <View className="document-overview__row">
          <Text className="document-overview__label">文件大小</Text>
          <Text className="document-overview__value">{formatFileSize(report.fileSize)}</Text>
        </View>
        <View className="document-overview__row">
          <Text className="document-overview__label">开始分析</Text>
          <Text className="document-overview__value">{formatDateTime(report.startedTime)}</Text>
        </View>
      </View>

      <View className="report-section">
        <View className="report-section__heading">
          <Text className="report-section__title">风险列表</Text>
          <Text className="report-section__count">共 {report.risks.length} 项</Text>
        </View>

        {report.risks.length === 0 ? (
          <View className="report-empty">
            <Text>未识别到风险条款，文件整体状况良好。</Text>
          </View>
        ) : (
          report.risks.map((risk, index) => {
            const riskTone = riskLevelView(risk.riskLevel)
            return (
              <View
                className="risk-row"
                hoverClass="risk-row--pressed"
                key={risk.id}
                onClick={() =>
                  Taro.navigateTo({
                    url: `/pages/risk-detail/index?documentId=${report.documentId}&riskId=${risk.id}`,
                  })
                }
              >
                <View className={`risk-row__number risk-row__number--${riskTone.className}`}>
                  {index + 1}
                </View>
                <Text className="risk-row__title">{risk.title}</Text>
                <StatusTag tone={riskTone.tone}>{riskTone.text}</StatusTag>
                <Text className="risk-row__count">{levelCounts[risk.riskLevel] ?? 1}项</Text>
                <ArrowRight className="risk-row__arrow" size="18" />
              </View>
            )
          })
        )}
      </View>

      <View className="report-disclaimer">
        <View className="report-disclaimer__icon">
          <Tips size="18" />
        </View>
        <Text>AI 分析结果仅供参考，不构成正式法律意见。</Text>
      </View>

      <AppButton className="report-chat-action" onClick={handleOpenChat}>
        智能问答
      </AppButton>
    </PageShell>
  )
}
