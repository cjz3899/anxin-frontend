import Taro, { useRouter } from '@tarojs/taro'
import { Clock, Success } from '@nutui/icons-react-taro'
import CircleProgress from '@nutui/nutui-react-taro/dist/es/packages/circleprogress'
import Step from '@nutui/nutui-react-taro/dist/es/packages/step'
import Steps from '@nutui/nutui-react-taro/dist/es/packages/steps'
import { Text, View } from '@tarojs/components'

import AppButton from '../../components/app-button'
import PageShell from '../../components/page-shell'

import './index.less'

const steps = [
  { label: '文件格式识别', state: '完成', status: 'done' },
  { label: '内容提取（Tika）', state: '完成', status: 'done' },
  { label: 'AI 风险分析', state: '进行中', status: 'active' },
  { label: '生成风险报告', state: '等待中', status: 'pending' },
] as const

export default function AnalysisPage() {
  const { params } = useRouter()
  const fileName = params.fileName ? decodeURIComponent(params.fileName) : '房屋租赁合同.pdf'

  return (
    <PageShell className="analysis-page">
      <View className="analysis-main">
        <CircleProgress
          background="var(--ax-color-brand-subtle)"
          className="progress-ring"
          color="var(--ax-color-brand)"
          percent={68}
          radius={78}
          strokeWidth={8}
        >
          <View className="progress-ring__content">
            <Text className="progress-ring__value">68%</Text>
            <Text className="progress-ring__label">分析进度</Text>
          </View>
        </CircleProgress>

        <Text className="analysis-main__title">正在分析文件内容…</Text>
        <Text className="analysis-main__file">{fileName}</Text>

        <Steps className="analysis-steps" direction="vertical" value={2}>
          {steps.map((step, index) => (
            <Step
              description={step.state}
              icon={step.status === 'done' ? <Success size="16" /> : undefined}
              key={step.label}
              title={step.label}
              value={index}
            />
          ))}
        </Steps>
      </View>

      <View className="analysis-note">
        <View className="analysis-note__icon">
          <Clock size="22" />
        </View>
        <View>
          <Text className="analysis-note__title">分析任务已在后台创建</Text>
          <Text className="analysis-note__description">通常需要 1–3 分钟，可先返回稍后查看。</Text>
        </View>
      </View>

      <AppButton
        className="analysis-back"
        variant="ghost"
        onClick={() => Taro.reLaunch({ url: '/pages/index/index' })}
      >
        返回首页
      </AppButton>
    </PageShell>
  )
}
