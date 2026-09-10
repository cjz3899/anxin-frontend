import { ArrowRight, LocationF } from '@nutui/icons-react-taro'
import { Text, View } from '@tarojs/components'

import PageShell from '../../components/page-shell'
import StatusTag from '../../components/status-tag'

import './index.less'

const sections = [
  {
    key: 'quote',
    title: '原文引用',
    content: '“任何一方未履行合同义务，另一方有权解除合同，但不承担违约责任。”',
  },
  {
    key: 'analysis',
    title: '风险分析',
    content: '条款未明确违约的认定标准、赔偿范围与上限，发生纠纷时可能导致责任难以界定。',
  },
  {
    key: 'impact',
    title: '潜在影响',
    content: '提前解约或履约争议时，可能面临无法主张损失或承担额外责任的风险。',
  },
  {
    key: 'suggestion',
    title: '修改建议',
    content: '补充违约情形、违约金计算方式及赔偿上限，并明确解除合同的通知期限。',
  },
] as const

export default function RiskDetailPage() {
  return (
    <PageShell className="risk-detail-page">
      <View className="risk-detail-heading">
        <View>
          <Text className="risk-detail-heading__eyebrow">违约责任</Text>
          <Text className="risk-detail-heading__title">违约责任条款不明确</Text>
        </View>
        <StatusTag tone="danger">高风险</StatusTag>
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
        <Text>定位原文第 3 页 · 第 7 条</Text>
        <ArrowRight className="source-location__arrow" size="18" />
      </View>
    </PageShell>
  )
}
