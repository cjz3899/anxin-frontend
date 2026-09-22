import type { DocumentUploadResult, UploadCredential } from '../../services/document'

/** 用户在上传页选中的文件（Taro.chooseMessageFile 返回的临时文件） */
export interface SelectedUploadFile {
  /** 本地临时路径，交给 wx.uploadFile 读取 */
  path: string
  name: string
  size: number
}

export interface UploadFlowDependencies {
  getUploadCredential: (fileName: string) => Promise<UploadCredential>
  uploadFileToOss: (credential: UploadCredential, filePath: string) => Promise<void>
  confirmDocumentUpload: (objectKey: string, fileName: string) => Promise<DocumentUploadResult>
  /** 面向用户的提示由页面注入，model 不依赖 Taro 运行时 */
  notify: (title: string) => void
}

/**
 * 上传三步曲：签发凭证 → 直传对象存储 → 登记建任务。
 * 文件字节不能经后端中转（容器侧请求体上限远小于 10MB），所以只能拆成三次网络往返。
 * 返回 null 表示未创建任务且已提示用户，页面据此留在当前页而不跳分析页
 */
export async function runUploadFlow(
  dependencies: UploadFlowDependencies,
  file: SelectedUploadFile
): Promise<DocumentUploadResult | null> {
  const credential = await dependencies.getUploadCredential(file.name)

  //先用服务端给的上限拦一次：OSS 拒绝时返回的是 XML 错误体，用户读不懂
  if (file.size > credential.maxBytes) {
    dependencies.notify(`文件超过 ${formatSize(credential.maxBytes)}，请重新选择`)
    return null
  }

  await dependencies.uploadFileToOss(credential, file.path)
  return dependencies.confirmDocumentUpload(credential.key, file.name)
}

function formatSize(bytes: number): string {
  return `${Math.round(bytes / 1024 / 1024)}MB`
}
