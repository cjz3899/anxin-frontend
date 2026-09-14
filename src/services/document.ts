import { request, upload } from '../utils/request'

export interface DocumentUploadResult {
  documentId: string
  taskId: string
  status: 'PENDING'
}

/** 上传文件并创建后端已经实现的异步分析任务 */
export function uploadDocument(filePath: string): Promise<DocumentUploadResult> {
  return upload<DocumentUploadResult>({
    url: '/api/document/upload',
    filePath,
    name: 'file',
  })
}

/** 文件分析状态：PENDING 排队中 / ANALYZING 分析中 / COMPLETED 已完成 / FAILED 分析失败 */
export type DocumentStatus = 'PENDING' | 'ANALYZING' | 'COMPLETED' | 'FAILED'

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

// TODO(backend): 文件列表接口尚未就绪，先用演示数据支撑页面联调；
// GET /api/document/list 可用后，删除演示数据并将 USE_MOCK_DOCUMENT_LIST 改为 false。
const USE_MOCK_DOCUMENT_LIST = true

const MOCK_LIST_DELAY_MS = 300

const mockDocumentList: DocumentRecord[] = [
  {
    id: 'doc-1001',
    fileName: '合同协议.pdf',
    status: 'COMPLETED',
    riskLevel: 'HIGH',
    createdAt: '2026-09-03 14:32:00',
  },
  {
    id: 'doc-1002',
    fileName: '租赁合同.docx',
    status: 'COMPLETED',
    riskLevel: 'MEDIUM',
    createdAt: '2026-09-02 16:20:00',
  },
  {
    id: 'doc-1003',
    fileName: '身份证.jpg',
    status: 'COMPLETED',
    riskLevel: 'NONE',
    createdAt: '2026-09-01 11:03:00',
  },
  {
    id: 'doc-1004',
    fileName: '公司规章制度.pdf',
    status: 'COMPLETED',
    riskLevel: 'LOW',
    createdAt: '2026-08-28 09:47:00',
  },
  {
    id: 'doc-1005',
    fileName: '合作协议.docx',
    status: 'COMPLETED',
    riskLevel: 'NONE',
    createdAt: '2026-08-25 15:12:00',
  },
]

/** 获取当前用户的文件列表（含分析状态与风险等级） */
export function listDocuments(): Promise<DocumentRecord[]> {
  if (USE_MOCK_DOCUMENT_LIST) {
    return new Promise(resolve => {
      setTimeout(() => resolve(mockDocumentList.map(record => ({ ...record }))), MOCK_LIST_DELAY_MS)
    })
  }
  return request<DocumentRecord[]>({ url: '/api/document/list', showError: false })
}
