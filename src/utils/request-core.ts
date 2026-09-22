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

/**
 * 容器调用返回的 body 可能是字符串也可能是已解析对象（取决于基础库版本与 content-type），
 * 统一在解 envelope 之前收一次口，两条传输通道才能共用同一套判定逻辑
 */
export function parseResponsePayload<T>(payload: unknown): ApiResponse<T> {
  if (typeof payload !== 'string') {
    return parseApiResponse<T>(payload)
  }
  return parseApiResponse<T>(JSON.parse(payload))
}

export type ApiTransport = 'cloud' | 'http'

/**
 * 传输通道判定：只有本地联调显式配了 API_BASE_URL 才走 http 直连，
 * 其余一律走云托管内网调用（小程序不需要公网域名、不需要配置合法域名）
 */
export function resolveTransport(apiBaseUrl?: string): ApiTransport {
  return apiBaseUrl ? 'http' : 'cloud'
}

export type QueryValue = string | number | boolean | null | undefined

/**
 * 自己拼查询串：Taro.request 会把 GET 的 data 序列化成 query，
 * 而 callContainer 不保证同样行为，拼错会让列表筛选项静默失效，所以两条通道统一走这里
 */
export function buildPathWithQuery(path: string, query?: Record<string, QueryValue>): string {
  if (!query) return path
  const pairs = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
  if (!pairs.length) return path
  return `${path}${path.includes('?') ? '&' : '?'}${pairs.join('&')}`
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
