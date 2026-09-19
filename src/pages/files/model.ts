import type { DocumentRecord, DocumentStatus, DocumentStatusGroup } from '../../services/document'
import { isAnalyzingStatus, isCompletedStatus } from '../../utils/document-status.ts'

export type FileTabKey = 'all' | 'analyzing' | 'completed'

export interface FileTab {
  key: FileTabKey
  label: string
  statusGroup: DocumentStatusGroup
  /** 当前标签没有文件时的空状态文案 */
  emptyTitle: string
  emptyDescription: string
}

export const fileTabs: readonly FileTab[] = [
  {
    key: 'all',
    label: '全部',
    statusGroup: 'ALL',
    emptyTitle: '还没有文件',
    emptyDescription: '从首页上传文档，开始第一次风险分析吧',
  },
  {
    key: 'analyzing',
    label: '分析中',
    statusGroup: 'PROCESSING',
    emptyTitle: '暂无分析中的文件',
    emptyDescription: '上传文档后，这里会展示正在分析的任务',
  },
  {
    key: 'completed',
    label: '已完成',
    statusGroup: 'SUCCESS',
    emptyTitle: '暂无已完成的文件',
    emptyDescription: '分析完成后，可以在这里查看风险报告',
  },
]

/** 徽标色调：对应 StatusTag 的 tone（不含 neutral） */
export type FileBadgeTone = 'danger' | 'warning' | 'success' | 'info'

export interface FileBadge {
  tone: FileBadgeTone
  text: string
}

export type FileKind = 'pdf' | 'word' | 'image' | 'other'

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic']

export function getFileBadge(record: Pick<DocumentRecord, 'status' | 'riskLevel'>): FileBadge {
  if (isCompletedStatus(record.status)) {
    if (record.riskLevel === 'HIGH') return { tone: 'danger', text: '高风险' }
    if (record.riskLevel === 'MEDIUM') return { tone: 'warning', text: '中风险' }
    if (record.riskLevel === 'LOW') return { tone: 'success', text: '低风险' }
    return { tone: 'success', text: '已完成' }
  }
  if (record.status === 'FAILED') return { tone: 'danger', text: '分析失败' }
  return { tone: 'info', text: '分析中' }
}

/** 点击文件卡片的目标：与标签页口径必须一致，否则会出现「列在已完成里却打不开报告」 */
export type FileOpenTarget = 'report' | 'analysis' | 'failed'

export function getFileOpenTarget(status: DocumentStatus): FileOpenTarget {
  if (isCompletedStatus(status)) return 'report'
  if (isAnalyzingStatus(status)) return 'analysis'
  return 'failed'
}

export function getFileKind(fileName: string): FileKind {
  const extension = fileName.slice(fileName.lastIndexOf('.') + 1).toLowerCase()
  if (extension === 'pdf') return 'pdf'
  if (extension === 'doc' || extension === 'docx') return 'word'
  if (IMAGE_EXTENSIONS.includes(extension)) return 'image'
  return 'other'
}

/** yyyy-MM-dd HH:mm:ss（或 ISO 写法）→ 展示为 yyyy-MM-dd HH:mm，无法解析时原样返回 */
export function formatDocumentTime(value: string): string {
  const matched = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/.exec(value.trim())
  return matched ? `${matched[1]} ${matched[2]}` : value
}
