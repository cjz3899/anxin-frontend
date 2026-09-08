import { useState } from 'react'

const DEFAULT_LOCALE = 'zh-CN'

/**
 * 多语言占位 Hook。后续接入 i18n 方案时在此扩展。
 */
export function useLocale() {
  const [locale] = useState(DEFAULT_LOCALE)

  return { locale }
}
