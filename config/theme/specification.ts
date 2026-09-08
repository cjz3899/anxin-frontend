/**
 * 规范颜色 —— 全站统一引用，避免散落硬编码色值。
 * 与设计稿保持一致，TailwindCSS 与 Less 均可直接使用。
 * 使用方式：import { SpecificationColors } from 'config/theme/specification'
 */
export const SpecificationColors = {
  // 品牌主色（渐变）
  primary: '#667eea',
  primaryGradientStart: '#667eea',
  primaryGradientEnd: '#764ba2',

  // 功能色
  success: '#07c160',
  info: '#1890ff',
  warning: '#fa8c16',
  danger: '#e64340',

  // 文本
  textPrimary: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',

  // 背景 / 分割线
  background: '#f5f5f5',
  divider: '#eeeeee',
  white: '#ffffff',
} as const

export type SpecificationColorKey = keyof typeof SpecificationColors
