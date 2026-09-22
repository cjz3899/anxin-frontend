import assert from 'node:assert/strict'
import test from 'node:test'

async function loadUploadModel() {
  return import('../src/pages/upload/model.ts')
}

const CREDENTIAL = {
  host: 'https://anxin-bucket.oss-cn-beijing.aliyuncs.com',
  key: 'documents/9/20260922/abc.pdf',
  policy: 'cG9saWN5',
  signature: 'c2ln',
  accessKeyId: 'AKID',
  expire: 1770000000,
  maxBytes: 10 * 1024 * 1024,
}

const FILE = { path: '/tmp/abc.pdf', name: 'abc.pdf', size: 2 * 1024 * 1024 }

function createCalls() {
  const calls: string[] = []
  const notices: string[] = []

  return {
    calls,
    notices,
    dependencies: {
      getUploadCredential: async (fileName: string) => {
        assert.equal(fileName, FILE.name)
        calls.push('credential')
        return CREDENTIAL
      },
      uploadFileToOss: async (credential: typeof CREDENTIAL, filePath: string) => {
        assert.equal(credential, CREDENTIAL)
        assert.equal(filePath, FILE.path)
        calls.push('oss')
      },
      confirmDocumentUpload: async (objectKey: string, fileName: string) => {
        assert.equal(objectKey, CREDENTIAL.key)
        assert.equal(fileName, FILE.name)
        calls.push('confirm')
        return { documentId: '11', taskId: '22', status: 'PENDING' } as const
      },
      notify: (title: string) => {
        notices.push(title)
      },
    },
  }
}

test('上传流程：签发 → 直传 → 登记，按序执行并返回登记结果', async () => {
  const { runUploadFlow } = await loadUploadModel()
  const { calls, notices, dependencies } = createCalls()

  const result = await runUploadFlow(dependencies, FILE)

  assert.deepEqual(calls, ['credential', 'oss', 'confirm'])
  assert.deepEqual(result, { documentId: '11', taskId: '22', status: 'PENDING' })
  assert.deepEqual(notices, [])
})

test('上传流程：超过凭证上限时既不直传也不登记', async () => {
  const { runUploadFlow } = await loadUploadModel()
  const { calls, notices, dependencies } = createCalls()

  const result = await runUploadFlow(dependencies, { ...FILE, size: 11 * 1024 * 1024 })

  assert.deepEqual(calls, ['credential'])
  assert.equal(result, null)
  //上限取服务端下发值，文案里要带上，否则用户不知道要压到多少
  assert.match(notices[0], /10MB/)
})

test('上传流程：签发失败时原样抛出，交给请求层统一提示', async () => {
  const { runUploadFlow } = await loadUploadModel()
  const { calls, dependencies } = createCalls()
  dependencies.getUploadCredential = async () => {
    throw { code: 10006, msg: '不支持的文件类型' }
  }

  await assert.rejects(
    () => runUploadFlow(dependencies, FILE),
    (error: unknown) => (error as { code?: number }).code === 10006
  )
  assert.deepEqual(calls, [])
})
