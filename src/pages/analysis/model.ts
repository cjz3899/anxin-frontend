import type { DocumentStatus } from '../../services/document'
import { isCompletedStatus, isFailedStatus, isPendingStatus } from '../../utils/document-status.ts'

export const STEP_LABELS = [
  '文件格式识别',
  '内容提取（OCR/Tika）',
  '风险点分析（AI）',
  '生成风险报告',
]

/** 「风险点分析」是进行中的那一步 */
const RUNNING_STEP_INDEX = 2

/** 进度按 25% 一档映射到已走完的步骤数 */
const STEP_PROGRESS_UNIT = 25

export interface StepView {
  label: string
  description: string
  status: 'done' | 'active' | 'pending' | 'error'
}

export interface AnalysisSteps {
  steps: StepView[]
  /** NutUI Steps 的 value；全部完成时等于步骤总数 */
  activeStep: number
}

function runningSteps(): StepView[] {
  return STEP_LABELS.map((label, index) => {
    if (index < RUNNING_STEP_INDEX) return { label, description: '完成', status: 'done' as const }
    if (index === RUNNING_STEP_INDEX) {
      return { label, description: '进行中', status: 'active' as const }
    }
    return { label, description: '等待中', status: 'pending' as const }
  })
}

function interruptedSteps(progress: number): StepView[] {
  return STEP_LABELS.map((label, index) => {
    const reached = progress >= (index + 1) * STEP_PROGRESS_UNIT
    return {
      label,
      description: reached ? '已中断' : '未开始',
      status: reached ? ('error' as const) : ('pending' as const),
    }
  })
}

/**
 * 步骤视图与高亮位置一起返回：两者本就是同一套状态阶梯，
 * 分开算会在新增状态时漂移（高亮的步骤和渲染出的行对不上）。
 */
export function buildSteps(status: DocumentStatus, progress: number): AnalysisSteps {
  if (isPendingStatus(status)) {
    return {
      steps: STEP_LABELS.map((label, index) => ({
        label,
        description: index === 0 ? '排队中' : '等待中',
        status: index === 0 ? ('active' as const) : ('pending' as const),
      })),
      activeStep: 0,
    }
  }

  if (isCompletedStatus(status)) {
    return {
      steps: STEP_LABELS.map(label => ({ label, description: '完成', status: 'done' as const })),
      activeStep: STEP_LABELS.length,
    }
  }

  if (isFailedStatus(status)) {
    return {
      steps: interruptedSteps(progress),
      activeStep: Math.min(STEP_LABELS.length - 1, Math.floor(progress / STEP_PROGRESS_UNIT)),
    }
  }

  // 正在分析，以及后端新增而前端尚未登记的状态：一律按「进行中」展示并继续轮询，
  // 不要让未登记状态落进失败分支
  return { steps: runningSteps(), activeStep: RUNNING_STEP_INDEX }
}
