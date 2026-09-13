export interface ApiResponse<T = unknown> {
  code: number
  data: T
  msg?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function parseApiResponse<T>(payload: unknown): ApiResponse<T> {
  if (!isRecord(payload) || typeof payload.code !== 'number') {
    throw new Error('服务响应格式异常')
  }

  return payload as unknown as ApiResponse<T>
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (isRecord(error) && typeof error.msg === 'string' && error.msg.trim()) {
    return error.msg.trim()
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }
  if (typeof error === 'string' && error.trim()) {
    return error.trim()
  }
  return fallback
}
