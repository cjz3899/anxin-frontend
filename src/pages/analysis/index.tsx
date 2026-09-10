import Taro, { useRouter } from '@tarojs/taro'
import { Text, View } from '@tarojs/components'

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
    <View className="analysis-page">
      <View className="analysis-main">
        <View className="progress-ring">
          <View className="progress-ring__inner">
            <Text className="progress-ring__value">68%</Text>
            <Text className="progress-ring__label">分析进度</Text>
          </View>
        </View>

        <Text className="analysis-main__title">正在分析文件内容…</Text>
        <Text className="analysis-main__file">{fileName}</Text>

        <View className="analysis-steps">
          {steps.map(step => (
            <View className={`analysis-step analysis-step--${step.status}`} key={step.label}>
              <View className="analysis-step__marker">
                {step.status === 'done' ? '✓' : step.status === 'active' ? '◌' : ''}
              </View>
              <Text className="analysis-step__label">{step.label}</Text>
              <Text className="analysis-step__state">{step.state}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="analysis-note">
        <Text className="analysis-note__icon">⌁</Text>
        <View>
          <Text className="analysis-note__title">分析任务已在后台创建</Text>
          <Text className="analysis-note__description">通常需要 1–3 分钟，可先返回稍后查看。</Text>
        </View>
      </View>

      <View
        className="analysis-back"
        hoverClass="analysis-back--pressed"
        onClick={() => Taro.reLaunch({ url: '/pages/index/index' })}
      >
        返回首页
      </View>
    </View>
  )
}
