const DESIGN_WIDTH = 750
const STANDARD_NAVIGATION_HEIGHT = 44
const CONTENT_TOP_GAP = 12

export interface CustomNavigationMetrics {
  menuBottom?: number
  statusBarHeight: number
  windowWidth: number
}

export function getCustomNavigationTopPadding({
  menuBottom,
  statusBarHeight,
  windowWidth,
}: CustomNavigationMetrics): string {
  const navigationBottom = menuBottom ?? statusBarHeight + STANDARD_NAVIGATION_HEIGHT
  const topPadding = navigationBottom + CONTENT_TOP_GAP
  const rpxValue = Math.ceil((topPadding * DESIGN_WIDTH) / Math.max(windowWidth, 1))

  return `${rpxValue}rpx`
}
