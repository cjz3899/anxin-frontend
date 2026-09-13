import assert from 'node:assert/strict'
import test from 'node:test'

test('微信样式体积必须严格低于上限', async () => {
  const { isWithinWxssLimit } = await import('../scripts/check-weapp-size.mjs')
  const limit = 244 * 1024

  assert.equal(isWithinWxssLimit(limit - 1, limit), true)
  assert.equal(isWithinWxssLimit(limit, limit), false)
})
