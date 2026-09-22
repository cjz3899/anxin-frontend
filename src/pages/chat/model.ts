import type { ChatMessage } from '../../services/chat'
import { isCompletedStatus, isFailedStatus } from '../../utils/document-status.ts'

/** 回答轮询间隔：与任务状态轮询同量级，比它短一点因为用户正盯着屏幕等 */
export const CHAT_POLL_INTERVAL_MS = 1500

/**
 * 前端等待上限。后端把 PROCESSING 超过 5 分钟的回答判为 FAILED，
 * 所以这里给同样的预算即可，再等下去只会一直转圈
 */
export const CHAT_POLL_TIMEOUT_MS = 5 * 60 * 1000

/** 后端没给失败原因时的兜底文案 */
export const ANSWER_FAILED_TEXT = '回答生成失败，请重新提问'

/** 等到超时仍没有终态 */
export const ANSWER_TIMEOUT_TEXT = '回答生成超时，请重新提问'

export interface ChatAnswerPollDependencies {
  listChatMessages: (sessionId: string) => Promise<ChatMessage[]>
  sleep: (ms: number) => Promise<void>
  now: () => number
  intervalMs?: number
  timeoutMs?: number
  /** 页面卸载后置为 true，当轮返回后立即停止 */
  isCancelled?: () => boolean
}

/** 回答是否已经尘埃落定（成功或失败） */
export function isAnswerSettled(message: ChatMessage): boolean {
  return isCompletedStatus(message.status) || isFailedStatus(message.status)
}

/**
 * 提问瞬间先摆出「你的问题 + 生成中的回答」，等服务端结果回来后整体用历史列表覆盖。
 * messageId 用 local- 前缀标识这些还没落库的行，与仓库里其他页面的本地占位保持一致口径
 */
export function createOptimisticMessages(question: string, stamp: number): ChatMessage[] {
  return [
    {
      messageId: `local-user-${stamp}`,
      role: 'USER',
      content: question,
      status: 'SUCCESS',
      errorMessage: null,
      references: [],
      createdTime: '',
    },
    {
      messageId: `local-answer-${stamp}`,
      role: 'ASSISTANT',
      content: '',
      status: 'PENDING',
      errorMessage: null,
      references: [],
      createdTime: '',
    },
  ]
}

/**
 * 回答气泡要显示什么。生成中和失败都得有明确文字，
 * 不能只靠一个空白泡或颜色暗示状态
 */
export function resolveAnswerText(message: ChatMessage): { text: string; generating: boolean } {
  if (!isAnswerSettled(message)) {
    return { text: '正在结合原文生成回答…', generating: true }
  }
  if (isFailedStatus(message.status)) {
    return { text: message.errorMessage || ANSWER_FAILED_TEXT, generating: false }
  }
  return { text: message.content, generating: false }
}

/**
 * 轮询会话消息，直到目标回答进入终态。
 * 返回那条回答（成功时含正文与引用，失败时含 errorMessage）；
 * 超时、被取消或消息已不存在时返回 null，由页面给一句兜底提示
 */
export async function pollChatAnswer(
  dependencies: ChatAnswerPollDependencies,
  sessionId: string,
  messageId: string
): Promise<ChatMessage | null> {
  const intervalMs = dependencies.intervalMs ?? CHAT_POLL_INTERVAL_MS
  const deadline = dependencies.now() + (dependencies.timeoutMs ?? CHAT_POLL_TIMEOUT_MS)

  while (dependencies.now() < deadline) {
    await dependencies.sleep(intervalMs)
    if (dependencies.isCancelled?.()) return null

    let messages: ChatMessage[]
    try {
      messages = await dependencies.listChatMessages(sessionId)
    } catch {
      //单次轮询失败不中断整个等待，下一轮继续
      continue
    }

    const answer = messages.find(message => message.messageId === messageId)
    if (!answer) return null
    if (isAnswerSettled(answer)) return answer
  }

  return null
}
