import Taro from '@tarojs/taro'
import { ArrowRight, Tips, Warning } from '@nutui/icons-react-taro'
import { Text, View } from '@tarojs/components'

import PageShell from '../../components/page-shell'
import StatusTag, { type StatusTone } from '../../components/status-tag'

import './index.less'

const risks = [
  { id: '1', title: '违约责任条款不明确', level: '高风险', tone: 'high' },
  { id: '2', title: '提前解约赔偿约定偏重', level: '高风险', tone: 'high' },
  { id: '3', title: '付款节点缺少验收条件', level: '中风险', tone: 'medium' },
  { id: '4', title: '争议解决方式未明确', level: '中风险', tone: 'medium' },
] as const

export default function ReportPage() {
  return (
    <PageShell className="report-page">
      <View className="risk-summary">
        <View className="risk-summary__mark">
          <Warning size="24" />
        </View>
        <View className="risk-summary__content">
          <Text className="risk-summary__title">风险等级：高</Text>
          <Text className="risk-summary__description">识别到 5 处需重点关注的条款</Text>
        </View>
        <View className="risk-summary__score">78</View>
      </View>

      <View className="report-card document-overview">
        <Text className="report-card__title">文件概览</Text>
        <View className="document-overview__row">
          <Text className="document-overview__label">文件名称</Text>
          <Text className="document-overview__value">房屋租赁合同.pdf</Text>
        </View>
        <View className="document-overview__row">
          <Text className="document-overview__label">文件类型</Text>
          <Text className="document-overview__value">PDF</Text>
        </View>
        <View className="document-overview__row">
          <Text className="document-overview__label">分析时间</Text>
          <Text className="document-overview__value">2026-09-09 14:32</Text>
        </View>
      </View>

      <View className="report-section">
        <View className="report-section__heading">
          <Text className="report-section__title">风险明细</Text>
          <Text className="report-section__count">共 5 项</Text>
        </View>

        {risks.map(risk => (
          <View
            className="risk-row"
            key={risk.id}
            hoverClass="risk-row--pressed"
            onClick={() => Taro.navigateTo({ url: `/pages/risk-detail/index?id=${risk.id}` })}
          >
            <View className={`risk-row__number risk-row__number--${risk.tone}`}>{risk.id}</View>
            <Text className="risk-row__title">{risk.title}</Text>
            <StatusTag tone={(risk.tone === 'high' ? 'danger' : 'warning') as StatusTone}>
              {risk.level}
            </StatusTag>
            <ArrowRight className="risk-row__arrow" size="18" />
          </View>
        ))}
      </View>

      <View className="report-disclaimer">
        <View className="report-disclaimer__icon">
          <Tips size="18" />
        </View>
        <Text>AI 分析结果仅供参考，不构成正式法律意见。</Text>
      </View>
    </PageShell>
  )
}
