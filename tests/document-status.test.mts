import assert from 'node:assert/strict'
import test from 'node:test'

async function loadDocumentStatus() {
  return import('../src/utils/document-status.ts')
}

test('双命名兼容：分析中与已完成各认两套后端命名', async () => {
  const { isAnalyzingStatus, isCompletedStatus, isFailedStatus, isPendingStatus, isRunningStatus } =
    await loadDocumentStatus()

  assert.equal(isPendingStatus('PENDING'), true)
  assert.equal(isPendingStatus('PROCESSING'), false)
  assert.equal(isPendingStatus('ANALYZING'), false)

  for (const status of ['PROCESSING', 'ANALYZING'] as const) {
    assert.equal(isRunningStatus(status), true)
    assert.equal(isAnalyzingStatus(status), true)
    assert.equal(isCompletedStatus(status), false)
    assert.equal(isFailedStatus(status), false)
  }

  // 排队中属于「分析中」标签，但不属于「正在分析」
  assert.equal(isAnalyzingStatus('PENDING'), true)
  assert.equal(isRunningStatus('PENDING'), false)

  for (const status of ['SUCCESS', 'COMPLETED'] as const) {
    assert.equal(isCompletedStatus(status), true)
    assert.equal(isAnalyzingStatus(status), false)
    assert.equal(isRunningStatus(status), false)
    assert.equal(isFailedStatus(status), false)
  }

  assert.equal(isFailedStatus('FAILED'), true)
  assert.equal(isCompletedStatus('FAILED'), false)
  assert.equal(isAnalyzingStatus('FAILED'), false)
})
