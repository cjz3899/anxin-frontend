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

/** 问答消息（后端 ChatMessageVO） */
export interface ChatMessage {
  messageId: string
  role: 'USER' | 'ASSISTANT'
  content: string
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

/** 基于当前会话所属文档提问（返回 AI 回复，含引用条款） */
export function sendChatMessage(sessionId: string, content: string): Promise<ChatMessage> {
  return request<ChatMessage>({
    url: `/api/chat-sessions/${sessionId}/messages`,
    method: 'POST',
    data: { content },
  })
}

/** 历史消息（正序，含回答引用的条款） */
export function listChatMessages(sessionId: string): Promise<ChatMessage[]> {
  return request<ChatMessage[]>({ url: `/api/chat-sessions/${sessionId}/messages` })
}

/** 关闭会话：保留历史记录，仅置状态为已关闭 */
export function closeChatSession(sessionId: string): Promise<void> {
  return request<void>({ url: `/api/chat-sessions/${sessionId}`, method: 'PATCH' })
}
