import assert from 'node:assert/strict'
import test from 'node:test'

async function loadFilesModel() {
  return import('../src/pages/files/model.ts')
}

test('标签过滤：排队与正在分析归入「分析中」，失败文件只出现在「全部」', async () => {
  const { matchesFileTab } = await loadFilesModel()

  for (const status of ['PENDING', 'ANALYZING'] as const) {
    assert.equal(matchesFileTab({ status }, 'all'), true)
    assert.equal(matchesFileTab({ status }, 'analyzing'), true)
    assert.equal(matchesFileTab({ status }, 'completed'), false)
  }

  assert.equal(matchesFileTab({ status: 'COMPLETED' }, 'all'), true)
  assert.equal(matchesFileTab({ status: 'COMPLETED' }, 'analyzing'), false)
  assert.equal(matchesFileTab({ status: 'COMPLETED' }, 'completed'), true)

  assert.equal(matchesFileTab({ status: 'FAILED' }, 'all'), true)
  assert.equal(matchesFileTab({ status: 'FAILED' }, 'analyzing'), false)
  assert.equal(matchesFileTab({ status: 'FAILED' }, 'completed'), false)
})

test('徽标映射：风险等级对应色调，未识别风险展示「已完成」', async () => {
  const { getFileBadge } = await loadFilesModel()
  const completed = (riskLevel: string) =>
    getFileBadge({ status: 'COMPLETED', riskLevel } as Parameters<typeof getFileBadge>[0])

  assert.deepEqual(completed('HIGH'), { tone: 'danger', text: '高风险' })
  assert.deepEqual(completed('MEDIUM'), { tone: 'warning', text: '中风险' })
  assert.deepEqual(completed('LOW'), { tone: 'success', text: '低风险' })
  assert.deepEqual(completed('NONE'), { tone: 'success', text: '已完成' })

  assert.deepEqual(getFileBadge({ status: 'ANALYZING', riskLevel: 'NONE' }), {
    tone: 'info',
    text: '分析中',
  })
  assert.deepEqual(getFileBadge({ status: 'PENDING', riskLevel: 'NONE' }), {
    tone: 'info',
    text: '分析中',
  })
  assert.deepEqual(getFileBadge({ status: 'FAILED', riskLevel: 'NONE' }), {
    tone: 'danger',
    text: '分析失败',
  })
})

test('文件类型识别：按扩展名小写匹配，无扩展名归为 other', async () => {
  const { getFileKind } = await loadFilesModel()

  assert.equal(getFileKind('合同协议.pdf'), 'pdf')
  assert.equal(getFileKind('租赁合同.docx'), 'word')
  assert.equal(getFileKind('会议纪要.doc'), 'word')
  assert.equal(getFileKind('身份证.JPG'), 'image')
  assert.equal(getFileKind('截图.PNG'), 'image')
  assert.equal(getFileKind('说明文本'), 'other')
  assert.equal(getFileKind('数据表.xlsx'), 'other')
})

test('时间格式化：截断到分钟，无法解析时原样返回', async () => {
  const { formatDocumentTime } = await loadFilesModel()

  assert.equal(formatDocumentTime('2026-09-03 14:32:00'), '2026-09-03 14:32')
  assert.equal(formatDocumentTime('2026-09-03T14:32:00'), '2026-09-03 14:32')
  assert.equal(formatDocumentTime('2026-09-03'), '2026-09-03')
})
