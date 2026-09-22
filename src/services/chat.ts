import { request } from '../utils/request'

/** 问答会话（后端 ChatSessionVO） */
export interface ChatSession {
  id: string
  documentId: string
  title: string
  status: 'OPEN' | 'CLOSE'
  createdTime: string
}

/** 回答引用的原文条款（后端 ChatReferenceVO） */
export interface ChatReference {
  sectionId: string
  sectionNo: string
  title: string
  content: string
}

/** 回答生成状态（后端 TaskStatus 枚举名；用户消息落库即 SUCCESS） */
export type ChatMessageStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED'

/** 问答消息（后端 ChatMessageVO） */
export interface ChatMessage {
  messageId: string
  role: 'USER' | 'ASSISTANT'
  content: string
  /** 回答是异步生成的，未到终态时 content 为空 */
  status: ChatMessageStatus
  /** 生成失败时后端给的提示文案，成功为 null */
  errorMessage: string | null
  references: ChatReference[]
  createdTime: string
}

/** 创建会话（文档需分析完成） */
export function createChatSession(documentId: string, title: string): Promise<ChatSession> {
  return request<ChatSession>({
    url: `/api/documents/${documentId}/chat-sessions`,
    method: 'POST',
    data: { title },
  })
}

/** 会话列表（页码分页，page 从 1 开始） */
export function listChatSessions(
  documentId: string,
  page = 1,
  size = 20
): Promise<{ records: ChatSession[]; nextCursor: string | null; total: number | null }> {
  return request({
    url: `/api/documents/${documentId}/chat-sessions`,
    data: { page, size },
  })
}

/**
 * 提问：后端只落一条 PENDING 的占位回答并立即返回，模型在后台生成。
 * 页面拿到 messageId 后用 listChatMessages 轮询到终态再渲染
 */
export function sendChatMessage(sessionId: string, content: string): Promise<ChatMessage> {
  return request<ChatMessage>({
    url: `/api/chat-sessions/${sessionId}/messages`,
    method: 'POST',
    data: { content },
  })
}

/** 历史消息（正序，含回答状态与引用的条款）；轮询时传 showError:false，避免每轮都弹一次失败提示 */
export function listChatMessages(
  sessionId: string,
  options?: { showError?: boolean }
): Promise<ChatMessage[]> {
  return request<ChatMessage[]>({
    url: `/api/chat-sessions/${sessionId}/messages`,
    ...options,
  })
}

/** 关闭会话：保留历史记录，仅置状态为已关闭 */
export function closeChatSession(sessionId: string): Promise<void> {
  return request<void>({ url: `/api/chat-sessions/${sessionId}`, method: 'PATCH' })
}
