import assert from 'node:assert/strict'
import test from 'node:test'

async function loadAnalysisModel() {
  return import('../src/pages/analysis/model.ts')
}

test('步骤视图：各状态的步骤口径与高亮位置一致', async () => {
  const { buildSteps } = await loadAnalysisModel()

  const pending = buildSteps('PENDING', 4)
  assert.deepEqual(
    pending.steps.map(step => step.status),
    ['active', 'pending', 'pending', 'pending']
  )
  assert.equal(pending.activeStep, 0)

  for (const status of ['PROCESSING', 'ANALYZING'] as const) {
    const running = buildSteps(status, 40)
    assert.deepEqual(
      running.steps.map(step => step.status),
      ['done', 'done', 'active', 'pending']
    )
    assert.equal(running.activeStep, 2)
  }

  for (const status of ['SUCCESS', 'COMPLETED'] as const) {
    const done = buildSteps(status, 100)
    assert.deepEqual(
      done.steps.map(step => step.status),
      ['done', 'done', 'done', 'done']
    )
    assert.equal(done.activeStep, 4)
  }

  const failed = buildSteps('FAILED', 50)
  assert.deepEqual(
    failed.steps.map(step => step.status),
    ['error', 'error', 'pending', 'pending']
  )
  assert.equal(failed.activeStep, 2)
})

test('步骤视图：未登记的状态按进行中展示，不落进失败分支', async () => {
  const { buildSteps } = await loadAnalysisModel()

  // 后端新增状态（如 QUEUED）时前端尚未登记，此时应保持「进行中 + 继续轮询」，
  // 而不是把每一步渲染成「已中断/未开始」的失败态
  const unknown = buildSteps('QUEUED' as never, 40)

  assert.deepEqual(
    unknown.steps.map(step => step.status),
    ['done', 'done', 'active', 'pending']
  )
  assert.equal(unknown.activeStep, 2)
})
