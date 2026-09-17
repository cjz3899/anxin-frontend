/** 文件大小展示：不足 1MB 按 KB，保留一位小数 MB */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/**
 * 后端时间格式为 `yyyy-MM-dd HH:mm:ss`，
 * 列表/摘要场景去掉秒数展示为 `yyyy-MM-dd HH:mm`。
 */
export function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  return value.length === 19 ? value.slice(0, 16) : value
}
