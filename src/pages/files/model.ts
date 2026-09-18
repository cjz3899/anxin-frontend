import type { DocumentRecord, DocumentStatus } from '../../services/document'

export type FileTabKey = 'all' | 'analyzing' | 'completed'

export interface FileTab {
  key: FileTabKey
  label: string
  /** 当前标签没有文件时的空状态文案 */
  emptyTitle: string
  emptyDescription: string
}

export const fileTabs: readonly FileTab[] = [
  {
    key: 'all',
    label: '全部',
    emptyTitle: '还没有文件',
    emptyDescription: '从首页上传文档，开始第一次风险分析吧',
  },
  {
    key: 'analyzing',
    label: '分析中',
    emptyTitle: '暂无分析中的文件',
    emptyDescription: '上传文档后，这里会展示正在分析的任务',
  },
  {
    key: 'completed',
    label: '已完成',
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

/** 排队中与正在分析都归入「分析中」标签 */
export function isAnalyzingStatus(status: DocumentStatus): boolean {
  return status === 'PENDING' || status === 'ANALYZING'
}

export function matchesFileTab(record: Pick<DocumentRecord, 'status'>, tab: FileTabKey): boolean {
  if (tab === 'all') return true
  if (tab === 'analyzing') return isAnalyzingStatus(record.status)
  return record.status === 'COMPLETED'
}

export function getFileBadge(record: Pick<DocumentRecord, 'status' | 'riskLevel'>): FileBadge {
  if (record.status === 'COMPLETED') {
    if (record.riskLevel === 'HIGH') return { tone: 'danger', text: '高风险' }
    if (record.riskLevel === 'MEDIUM') return { tone: 'warning', text: '中风险' }
    if (record.riskLevel === 'LOW') return { tone: 'success', text: '低风险' }
    return { tone: 'success', text: '已完成' }
  }
  if (record.status === 'FAILED') return { tone: 'danger', text: '分析失败' }
  return { tone: 'info', text: '分析中' }
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
