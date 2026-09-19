import { request, upload } from '../utils/request'

/** 统一响应包装（后端 Result） */
export interface PageResult<T> {
  /** 当前页数据 */
  records: T[]
  /** 下一页游标（本页最后一条记录 id），null 表示没有更多数据 */
  nextCursor: string | null
  /** 该筛选条件下的总条数 */
  total: number | null
}

/** 文档状态（后端 TaskStatus 枚举名，兼容两版命名：PROCESSING/ANALYZING 为分析中，SUCCESS/COMPLETED 为已完成） */
export type DocumentStatus =
  'PENDING' | 'PROCESSING' | 'ANALYZING' | 'SUCCESS' | 'COMPLETED' | 'FAILED'

/** 整体风险等级（后端由各级数量推导） */
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW'

/** 风险明细（后端 RiskDetailVO） */
export interface RiskDetail {
  id: string
  sectionId: string
  sectionNo: string
  sectionTitle: string
  riskType: string
  riskLevel: RiskLevel
  title: string
  originalText: string
  reason: string
  impact: string
  suggestion: string
}

/** 风险报告（后端 RiskReportVO） */
export interface RiskReport {
  documentId: string
  taskId: string
  fileName: string
  fileType: string
  fileSize: number
  startedTime: string
  finishedTime: string
  riskSummary: string
  riskLevel: RiskLevel
  /** 共发现的风险问题数量 */
  riskCount: number
  risks: RiskDetail[]
}

/** 文件上传成功出参（后端 DocumentUploadVO） */
export interface DocumentUploadResult {
  documentId: string
  taskId: string
  status: 'PENDING'
}

/** 文件列表项（后端 DocumentListVO） */
export interface DocumentListItem {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  status: DocumentStatus
  summary: string
  riskLevel: RiskLevel | null
  createdTime: string
  updatedTime: string
}

/** 文件详情（后端 DocumentDetailVO） */
export interface DocumentDetail {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  status: DocumentStatus
  summary: string
  riskLevel: RiskLevel | null
  latestTaskId: string
  taskStatus: DocumentStatus | null
  errorMessage: string
  createdTime: string
  updatedTime: string
}

/** 分析任务状态（后端 AnalysisTaskVO） */
export interface AnalysisTask {
  taskId: string
  documentId: string
  taskType: string
  status: DocumentStatus
  retryCount: number
  errorMessage: string
  startedTime: string
  finishedTime: string
}

/** 文件列表状态筛选分组 */
export type DocumentStatusGroup = 'ALL' | 'PROCESSING' | 'SUCCESS' | 'FAILED'

/** 上传 PDF/Word/图片并创建分析任务 */
export function uploadDocument(filePath: string): Promise<DocumentUploadResult> {
  return upload<DocumentUploadResult>({
    url: '/api/document/upload',
    filePath,
    name: 'file',
  })
}

/** 查询当前用户的文件和历史分析记录（游标分页） */
export function getDocumentList(
  pageSize: number,
  statusGroup: DocumentStatusGroup = 'ALL',
  cursor?: string
): Promise<PageResult<DocumentListItem>> {
  return request<PageResult<DocumentListItem>>({
    url: '/api/document/list',
    data: { pageSize, statusGroup, cursor },
  })
}

/** 查询单个文件详情 */
export function getDocumentDetail(documentId: string): Promise<DocumentDetail> {
  return request<DocumentDetail>({ url: `/api/document/${documentId}` })
}

/** 删除文件及其分析记录 */
export function deleteDocument(documentId: string): Promise<void> {
  return request<void>({ url: `/api/document/${documentId}`, method: 'DELETE' })
}

/** 对已有文件重新发起分析 */
export function reanalyzeDocument(documentId: string): Promise<DocumentUploadResult> {
  return request<DocumentUploadResult>({
    url: `/api/document/${documentId}/reanalyze`,
    method: 'POST',
  })
}

/** 查询单条风险的切分报告详情 */
export function getRiskDetail(documentId: string, riskId: string): Promise<RiskDetail> {
  return request<RiskDetail>({ url: `/api/document/${documentId}/risks/${riskId}` })
}

/** 轮询分析任务状态（间隔 2s，SUCCESS/FAILED 后停止） */
export function getAnalysisTask(taskId: string): Promise<AnalysisTask> {
  return request<AnalysisTask>({ url: `/api/analysis/task/${taskId}` })
}

/** 查询风险报告（分析任务 SUCCESS 后调用） */
export function getRiskReport(documentId: string): Promise<RiskReport> {
  return request<RiskReport>({ url: `/api/analysis/report/${documentId}` })
}

/** 风险等级：分析完成后由后端给出，NONE 表示未识别到风险条款 */
export type DocumentRiskLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'

/** 「我的文件」列表项 */
export interface DocumentRecord {
  id: string
  fileName: string
  status: DocumentStatus
  riskLevel: DocumentRiskLevel
  /** 上传时间，格式 yyyy-MM-dd HH:mm:ss */
  createdAt: string
}

const DOCUMENT_LIST_PAGE_SIZE = 10

/** 后端 DocumentListVO → 页面使用的 DocumentRecord（字段名与缺省风险等级不同） */
function toDocumentRecord(item: DocumentListItem): DocumentRecord {
  return {
    id: item.id,
    fileName: item.fileName,
    status: item.status,
    riskLevel: item.riskLevel ?? 'NONE',
    createdAt: item.createdTime,
  }
}

/** 获取当前用户的文件列表（含分析状态与风险等级） */
export function listDocuments(
  statusGroup: DocumentStatusGroup = 'ALL',
  cursor?: string
): Promise<PageResult<DocumentRecord>> {
  return getDocumentList(DOCUMENT_LIST_PAGE_SIZE, statusGroup, cursor).then(page => ({
    records: page.records.map(toDocumentRecord),
    nextCursor: page.nextCursor,
    total: page.total,
  }))
}
