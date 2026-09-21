import type { DocumentStatus } from '../services/document'

/**
 * 后端 TaskStatus 双命名兼容（见 CLAUDE.md「后端状态命名兼容」）。
 * 所有状态判断都必须走这里：页面与 model 里不要再写裸字面量，
 * 否则新增一套命名时总会有某个消费方漏改。
 */
export function isPendingStatus(status: DocumentStatus): boolean {
  return status === 'PENDING'
}

/** 正在分析（不含排队中的任务） */
export function isRunningStatus(status: DocumentStatus): boolean {
  return status === 'PROCESSING' || status === 'ANALYZING'
}

/** 排队中或正在分析：文件列表「分析中」标签的口径 */
export function isAnalyzingStatus(status: DocumentStatus): boolean {
  return isPendingStatus(status) || isRunningStatus(status)
}

/** 已完成：兼容 SUCCESS / COMPLETED 两套命名 */
export function isCompletedStatus(status: DocumentStatus): boolean {
  return status === 'SUCCESS' || status === 'COMPLETED'
}

export function isFailedStatus(status: DocumentStatus): boolean {
  return status === 'FAILED'
}
