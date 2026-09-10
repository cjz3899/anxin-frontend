import { upload } from '../utils/request'

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
