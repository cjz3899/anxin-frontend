import assert from 'node:assert/strict'
import test from 'node:test'

async function loadRules() {
  return import('../scripts/design-system-rules.mjs')
}

test('业务 Less 禁止硬编码颜色，但允许语义 Token', async () => {
  const { findRawColorViolations } = await loadRules()

  assert.equal(findRawColorViolations('.card { color: #fff; }').length, 1)
  assert.equal(findRawColorViolations('.card { color: var(--ax-color-text-primary); }').length, 0)
})

test('禁止 NutUI 全量样式导入，允许按组件导入', async () => {
  const { findForbiddenNutuiImports } = await loadRules()

  assert.equal(
    findForbiddenNutuiImports("import '@nutui/nutui-react-taro/dist/style.css'").length,
    1
  )
  assert.equal(
    findForbiddenNutuiImports("import '@nutui/nutui-react-taro/dist/es/packages/button/style/css'")
      .length,
    0
  )
})

test('当前业务源码符合设计系统约束', async () => {
  const { checkDesignSystem } = await loadRules()

  assert.deepEqual(await checkDesignSystem(), [])
})

test('WXSS 禁止使用微信开发者工具无法解析的通配选择器', async () => {
  const { findUnsupportedWxssSelectors } = await loadRules()

  assert.equal(
    findUnsupportedWxssSelectors(
      '@media (prefers-reduced-motion: reduce) {\n  *,\n  *::before {}\n}'
    ).length,
    2
  )
  assert.equal(
    findUnsupportedWxssSelectors(
      '@media (prefers-reduced-motion: reduce) {\n  .app-button,\n  .drop-zone {}\n}'
    ).length,
    0
  )
})
