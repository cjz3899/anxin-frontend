export type RiskTone = 'high' | 'medium' | 'low' | 'unknown'

export interface RiskLevelView {
  /** 中文展示文案：高风险 / 中风险 / 低风险 */
  text: string
  /** StatusTag 色调 */
  tone: 'danger' | 'warning' | 'success' | 'neutral'
  /** 样式修饰符类名（BEM --xxx） */
  className: RiskTone
}

const LEVEL_VIEWS: Record<string, RiskLevelView> = {
  HIGH: { text: '高风险', tone: 'danger', className: 'high' },
  MEDIUM: { text: '中风险', tone: 'warning', className: 'medium' },
  LOW: { text: '低风险', tone: 'success', className: 'low' },
}

/** 后端风险等级（HIGH/MEDIUM/LOW）转前端展示视图 */
export function riskLevelView(level?: string | null): RiskLevelView {
  if (level && LEVEL_VIEWS[level]) return LEVEL_VIEWS[level]
  return { text: '暂无', tone: 'neutral', className: 'unknown' }
}
