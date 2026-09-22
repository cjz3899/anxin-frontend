import assert from 'node:assert/strict'
import test from 'node:test'

async function loadFileName() {
  return import('../src/utils/file-name.ts')
}

test('从临时文件路径取文件名：微信给的三类路径都要能摘出后缀', async () => {
  const { fileNameFromPath } = await loadFileName()

  assert.equal(fileNameFromPath('wxfile://tmp_1a2b.jpeg'), 'tmp_1a2b.jpeg')
  assert.equal(fileNameFromPath('http://tmp/ABCD1234_abcd_头像.png'), 'ABCD1234_abcd_头像.png')
  assert.equal(fileNameFromPath('/var/mobile/Containers/tmp/x.jpg'), 'x.jpg')
})

test('路径里没有可用后缀时回落到默认名，拼出无扩展名的对象名会被后端拒绝', async () => {
  const { fileNameFromPath } = await loadFileName()

  assert.equal(fileNameFromPath('wxfile://tmp_1a2b'), 'avatar.jpg')
  assert.equal(fileNameFromPath(''), 'avatar.jpg')
  //带查询串的路径要先去掉参数再取名字
  assert.equal(fileNameFromPath('http://tmp/x.png?scope=file'), 'x.png')
})
