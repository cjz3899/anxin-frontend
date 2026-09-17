import { useEffect, useRef, useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { Clock, Success, Tips } from '@nutui/icons-react-taro'
import CircleProgress from '@nutui/nutui-react-taro/dist/es/packages/circleprogress'
import Step from '@nutui/nutui-react-taro/dist/es/packages/step'
import Steps from '@nutui/nutui-react-taro/dist/es/packages/steps'
import { Text, View } from '@tarojs/components'

import AppButton from '../../components/app-button'
import PageShell from '../../components/page-shell'
import { getAnalysisTask, reanalyzeDocument, type DocumentStatus } from '../../services'

import './index.less'

/** 轮询间隔：后端约定 2s，检测到 SUCCESS/FAILED 后停止 */
const POLL_INTERVAL = 2000

const STEP_LABELS = ['文件格式识别', '内容提取（OCR/Tika）', '风险点分析（AI）', '生成风险报告']

interface StepView {
  label: string
  description: string
  status: 'done' | 'active' | 'pending' | 'error'
}

function buildSteps(status: DocumentStatus, progress: number): StepView[] {
  if (status === 'PENDING') {
    return STEP_LABELS.map((label, index) => ({
      label,
      description: index === 0 ? '排队中' : '等待中',
      status: index === 0 ? 'active' : 'pending',
    }))
  }
  if (status === 'PROCESSING') {
    return STEP_LABELS.map((label, index) => ({
      label,
      description: index < 2 ? '完成' : index === 2 ? '进行中' : '等待中',
      status: index < 2 ? 'done' : index === 2 ? 'active' : 'pending',
    }))
  }
  if (status === 'SUCCESS') {
    return STEP_LABELS.map(label => ({ label, description: '完成', status: 'done' as const }))
  }
  return STEP_LABELS.map((label, index) => ({
    label,
    description: progress >= (index + 1) * 25 ? '已中断' : '未开始',
    status: progress >= (index + 1) * 25 ? 'error' : 'pending',
  }))
}

export default function AnalysisPage() {
  const { params } = useRouter()
  const taskId = params.taskId ?? ''
  const documentId = params.documentId ?? ''
  const fileName = params.fileName ? decodeURIComponent(params.fileName) : '正在分析文件内容'

  const [status, setStatus] = useState<DocumentStatus>('PENDING')
  const [progress, setProgress] = useState(4)
  const [errorMessage, setErrorMessage] = useState('')
  const [retrying, setRetrying] = useState(false)
  const navigatedRef = useRef(false)

  // 分析成功后跳转风险报告页（图4）
  useEffect(() => {
    if (status !== 'SUCCESS' || !documentId || navigatedRef.current) return
    navigatedRef.current = true
    Taro.redirectTo({ url: `/pages/report/index?documentId=${documentId}` })
  }, [status, documentId])

  // 轮询任务状态；进度在等待期间缓慢逼近 95%，成功后置 100
  useEffect(() => {
    if (!taskId) return

    let timer: ReturnType<typeof setTimeout> | null = null
    let stopped = false

    const tick = async () => {
      try {
        const task = await getAnalysisTask(taskId)
        if (stopped) return
        setStatus(task.status)
        if (task.status === 'SUCCESS') {
          setProgress(100)
          return
        }
        if (task.status === 'FAILED') {
          setErrorMessage(task.errorMessage || '分析失败，请重新尝试')
          return
        }
        setProgress(prev => Math.min(prev + 3, 95))
      } catch {
        // 单次轮询失败不中断流程，等待下一轮重试
      }
      if (!stopped) timer = setTimeout(tick, POLL_INTERVAL)
    }

    void tick()

    return () => {
      stopped = true
      if (timer) clearTimeout(timer)
    }
  }, [taskId])

  const handleRetry = async () => {
    if (!documentId || retrying) return
    setRetrying(true)
    try {
      const result = await reanalyzeDocument(documentId)
      setErrorMessage('')
      setProgress(4)
      navigatedRef.current = false
      setStatus(result.status as DocumentStatus)
      // 重新分析产生新任务，替换当前轮询目标
      Taro.redirectTo({
        url: `/pages/analysis/index?taskId=${result.taskId}&documentId=${documentId}&fileName=${encodeURIComponent(fileName)}`,
      })
    } finally {
      setRetrying(false)
    }
  }

  const stepViews = buildSteps(status, progress)
  const failed = status === 'FAILED'
  const activeStep = failed
    ? Math.min(3, Math.floor(progress / 25))
    : status === 'PENDING'
      ? 0
      : status === 'PROCESSING'
        ? 2
        : 4

  return (
    <PageShell className="analysis-page">
      <View className="analysis-main">
        <CircleProgress
          background="var(--ax-color-brand-subtle)"
          className="progress-ring"
          color={failed ? 'var(--ax-color-danger-icon)' : 'var(--ax-color-brand)'}
          percent={progress}
          radius={78}
          strokeWidth={8}
        >
          <View className="progress-ring__content">
            <Text className="progress-ring__value">{progress}%</Text>
            <Text className="progress-ring__label">分析进度</Text>
          </View>
        </CircleProgress>

        <Text className="analysis-main__title">
          {failed ? '分析失败' : status === 'SUCCESS' ? '分析完成' : '正在分析文件内容…'}
        </Text>
        <Text className="analysis-main__file">{fileName}</Text>

        <Steps className="analysis-steps" direction="vertical" value={activeStep}>
          {stepViews.map(step => (
            <Step
              description={step.description}
              icon={
                step.status === 'done' ? (
                  <Success size="16" />
                ) : step.status === 'error' ? (
                  <Tips size="16" />
                ) : undefined
              }
              key={step.label}
              title={step.label}
            />
          ))}
        </Steps>
      </View>

      {failed ? (
        <View className="analysis-note analysis-note--error">
          <View className="analysis-note__icon">
            <Tips size="22" />
          </View>
          <View>
            <Text className="analysis-note__title">分析任务执行失败</Text>
            <Text className="analysis-note__description">{errorMessage || '请重新发起分析'}</Text>
          </View>
        </View>
      ) : (
        <View className="analysis-note">
          <View className="analysis-note__icon">
            <Clock size="22" />
          </View>
          <View>
            <Text className="analysis-note__title">分析任务已在后台创建</Text>
            <Text className="analysis-note__description">
              通常需要 1–3 分钟，可先返回稍后查看。
            </Text>
          </View>
        </View>
      )}

      {failed ? (
        <AppButton className="analysis-back" loading={retrying} onClick={() => void handleRetry()}>
          重新分析
        </AppButton>
      ) : (
        <AppButton
          className="analysis-back"
          variant="ghost"
          onClick={() => Taro.reLaunch({ url: '/pages/index/index' })}
        >
          返回首页
        </AppButton>
      )}
    </PageShell>
  )
}
