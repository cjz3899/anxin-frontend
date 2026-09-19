import { useEffect, useRef, useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { Clock, Success, Tips } from '@nutui/icons-react-taro'
import CircleProgress from '@nutui/nutui-react-taro/dist/es/packages/circleprogress'
import { Text, View } from '@tarojs/components'

import AppButton from '../../components/app-button'
import PageShell from '../../components/page-shell'
import {
  getAnalysisTask,
  getDocumentDetail,
  reanalyzeDocument,
  type DocumentStatus,
} from '../../services'
import { isCompletedStatus, isFailedStatus } from '../../utils/document-status'
import { buildSteps } from './model'

import './index.less'

/** 轮询间隔：后端约定 2s，检测到已完成/失败后停止 */
const POLL_INTERVAL = 2000

export default function AnalysisPage() {
  const { params } = useRouter()
  const documentId = params.documentId ?? ''
  const fileName = params.fileName ? decodeURIComponent(params.fileName) : '正在分析文件内容'

  // 上传流程直接带 taskId；从文件列表进入时只有 documentId，需要反查最近一次任务
  const [taskId, setTaskId] = useState(params.taskId ?? '')
  const [status, setStatus] = useState<DocumentStatus>('PENDING')
  const [progress, setProgress] = useState(4)
  const [errorMessage, setErrorMessage] = useState('')
  const [retrying, setRetrying] = useState(false)
  const navigatedRef = useRef(false)

  useEffect(() => {
    if (taskId || !documentId) return

    let cancelled = false
    getDocumentDetail(documentId)
      .then(detail => {
        if (cancelled) return
        if (detail.latestTaskId) {
          setTaskId(detail.latestTaskId)
          return
        }
        setStatus('FAILED')
        setErrorMessage('该文件还没有分析任务，可重新发起分析')
      })
      .catch(() => {
        if (cancelled) return
        setStatus('FAILED')
        setErrorMessage('分析任务加载失败，可重新发起分析')
      })

    return () => {
      cancelled = true
    }
  }, [taskId, documentId])

  // 分析成功后跳转风险报告页（图4）
  useEffect(() => {
    if (!isCompletedStatus(status) || !documentId || navigatedRef.current) return
    navigatedRef.current = true
    Taro.redirectTo({ url: `/pages/report/index?documentId=${documentId}` }).catch(() => {
      // 跳转失败时放开闩锁，避免用户被困在分析页且报告不可达
      navigatedRef.current = false
      void Taro.showToast({ title: '报告页打开失败，请稍后重试', icon: 'none' })
    })
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
        if (isCompletedStatus(task.status)) {
          setProgress(100)
          return
        }
        if (isFailedStatus(task.status)) {
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
      navigatedRef.current = false
      // 重新分析会创建新任务，跳转到新任务继续轮询
      await Taro.redirectTo({
        url: `/pages/analysis/index?taskId=${result.taskId}&documentId=${documentId}&fileName=${encodeURIComponent(fileName)}`,
      })
    } catch {
      // request() 失败时已提示并 reject，保留当前失败态让用户可以再次重试
    } finally {
      setRetrying(false)
    }
  }

  const { steps } = buildSteps(status, progress)
  const failed = isFailedStatus(status)

  return (
    <PageShell className="analysis-page">
      <View className="analysis-main">
        <CircleProgress
          background="#dcebff"
          className="progress-ring"
          color={failed ? '#f94348' : '#1d76f6'}
          percent={progress}
          radius={84}
          strokeWidth={8}
        >
          <View className="progress-ring__content">
            <Text className="progress-ring__value">{progress}%</Text>
          </View>
        </CircleProgress>

        <Text className="analysis-main__title">
          {failed ? '分析失败' : isCompletedStatus(status) ? '分析完成' : '正在分析文件内容…'}
        </Text>

        <View className="analysis-steps">
          {steps.map(step => (
            <View className={`analysis-step analysis-step--${step.status}`} key={step.label}>
              <View className="analysis-step__marker">
                {step.status === 'done' && <Success size="13" />}
                {step.status === 'error' && <Tips size="13" />}
              </View>
              <Text className="analysis-step__label">{step.label}</Text>
              <View className="analysis-step__trailing" />
              <Text className="analysis-step__status">{step.description}</Text>
            </View>
          ))}
        </View>
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
          <Text className="analysis-note__description analysis-note__description--plain">
            分析过程可能需要 1–3 分钟，请耐心等待。
          </Text>
        </View>
      )}

      {failed ? (
        <AppButton
          className="analysis-back analysis-back--retry"
          loading={retrying}
          onClick={() => void handleRetry()}
        >
          重新分析
        </AppButton>
      ) : (
        <AppButton
          className="analysis-back analysis-back--home"
          variant="ghost"
          onClick={() => Taro.reLaunch({ url: '/pages/index/index' })}
        >
          返回首页
        </AppButton>
      )}
    </PageShell>
  )
}
