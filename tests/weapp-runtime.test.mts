import assert from 'node:assert/strict'
import test from 'node:test'

async function loadRuntimeRules() {
  return import('../scripts/check-weapp-runtime.mjs')
}

test('识别 plugin-html 将 i 节点映射为小程序 text 节点的运行时适配', async () => {
  const { hasHtmlRuntimeAdapter } = await loadRuntimeRules()
  const adaptedRuntime = `
    const inlineElements = new Set(["i", "abbr"])
    function getMappedType(nodeName) {
      if (inlineElements.has(nodeName)) return "text"
    }
  `

  assert.equal(
    typeof hasHtmlRuntimeAdapter === 'function' &&
      hasHtmlRuntimeAdapter(adaptedRuntime, 'i'),
    true
  )
  assert.equal(hasHtmlRuntimeAdapter(adaptedRuntime, 'video'), false)
})
