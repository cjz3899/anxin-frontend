import assert from 'node:assert/strict'
import test from 'node:test'

async function loadChatModel() {
  return import('../src/pages/chat/model.ts')
}

function buildAnswer(status, content = '') {
  return {
    messageId: 'answer-1',
    role: 'ASSISTANT',
    content,
    status,
    errorMessage: status === 'FAILED' ? '模型调用失败' : null,
    references: [],
    createdTime: '2026-09-22 10:00:00',
  }
}

function buildUserMessage() {
  return {
    messageId: 'question-1',
    role: 'USER',
    content: '违约责任有什么风险',
    status: 'SUCCESS',
    errorMessage: null,
    references: [],
    createdTime: '2026-09-22 10:00:00',
  }
}

/**
 * 假时钟：sleep 会推进 now，于是不用真等 1.5 秒就能模拟多轮轮询
 */
function createHarness(responses) {
  let index = 0
  let clock = 0
  const rounds = []

  return {
    rounds,
    dependencies: {
      listChatMessages: async () => {
        rounds.push(clock)
        const response = responses[Math.min(index, responses.length - 1)]
        index += 1
        if (response instanceof Error) {
          throw response
        }
        return [buildUserMessage(), response]
      },
      sleep: async ms => {
        clock += ms
      },
      now: () => clock,
      intervalMs: 100,
      timeoutMs: 500,
    },
  }
}

test('回答轮询：等到终态才返回，中间态继续等', async () => {
  const { pollChatAnswer } = await loadChatModel()
  const harness = createHarness([
    buildAnswer('PENDING'),
    buildAnswer('PROCESSING'),
    buildAnswer('SUCCESS', '逾期付款需按日万分之五支付违约金。'),
  ])

  const answer = await pollChatAnswer(harness.dependencies, 'session-1', 'answer-1')

  assert.equal(harness.rounds.length, 3)
  assert.equal(answer.status, 'SUCCESS')
  assert.match(answer.content, /违约金/)
})

test('回答轮询：FAILED 同样是终态，带着失败原因立即返回', async () => {
  const { pollChatAnswer } = await loadChatModel()
  const harness = createHarness([buildAnswer('PROCESSING'), buildAnswer('FAILED')])

  const answer = await pollChatAnswer(harness.dependencies, 'session-1', 'answer-1')

  assert.equal(harness.rounds.length, 2)
  assert.equal(answer.status, 'FAILED')
  assert.equal(answer.errorMessage, '模型调用失败')
})

test('回答轮询：始终没到终态时按超时收口，不无限等', async () => {
  const { pollChatAnswer } = await loadChatModel()
  const harness = createHarness([buildAnswer('PENDING')])

  const answer = await pollChatAnswer(harness.dependencies, 'session-1', 'answer-1')

  assert.equal(answer, null)
  //timeoutMs 500 / interval 100 → 最多 5 轮，不会一直转圈
  assert.equal(harness.rounds.length, 5)
})

test('回答轮询：页面卸载后当轮即停，不再发起请求', async () => {
  const { pollChatAnswer } = await loadChatModel()
  const harness = createHarness([buildAnswer('SUCCESS', '答案')])
  let cancelled = false
  harness.dependencies.isCancelled = () => cancelled
  const originalSleep = harness.dependencies.sleep
  harness.dependencies.sleep = async ms => {
    cancelled = true
    await originalSleep(ms)
  }

  const answer = await pollChatAnswer(harness.dependencies, 'session-1', 'answer-1')

  assert.equal(answer, null)
  assert.equal(harness.rounds.length, 0)
})

test('回答轮询：单轮请求失败不中断，下一轮拿到终态仍能返回', async () => {
  const { pollChatAnswer } = await loadChatModel()
  const harness = createHarness([new Error('网络抖动'), buildAnswer('SUCCESS', '答案')])

  const answer = await pollChatAnswer(harness.dependencies, 'session-1', 'answer-1')

  assert.equal(answer.status, 'SUCCESS')
  assert.equal(harness.rounds.length, 2)
})

test('回答轮询：消息被删除时立即收口，不等满超时', async () => {
  const { pollChatAnswer } = await loadChatModel()
  const harness = createHarness([buildAnswer('PENDING')])
  let calls = 0
  harness.dependencies.listChatMessages = async () => {
    calls += 1
    return [buildUserMessage()]
  }

  const answer = await pollChatAnswer(harness.dependencies, 'session-1', 'answer-1')

  assert.equal(answer, null)
  assert.equal(calls, 1)
})

test('回答终态判定：只有 SUCCESS 与 FAILED 算落定', async () => {
  const { isAnswerSettled } = await loadChatModel()

  assert.equal(isAnswerSettled(buildAnswer('SUCCESS')), true)
  assert.equal(isAnswerSettled(buildAnswer('FAILED')), true)
  assert.equal(isAnswerSettled(buildAnswer('PENDING')), false)
  assert.equal(isAnswerSettled(buildAnswer('PROCESSING')), false)
})
