import assert from 'node:assert/strict'
import test from 'node:test'

import { createLoginConfirmationController } from '../src/utils/login-confirmation.ts'

test('登录请求早于弹窗宿主注册时，注册后仍会展示并可完成确认', async () => {
  const controller = createLoginConfirmationController()
  let showCount = 0

  const confirmation = controller.request()
  const unregister = controller.register(() => {
    showCount += 1
  })

  assert.equal(showCount, 1)

  controller.resolve(true)

  assert.equal(await confirmation, true)
  unregister()
})
