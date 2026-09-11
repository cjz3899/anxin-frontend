export const homeFeatures = [
  {
    id: 'analysis',
    title: '风险分析',
    description: '智能识别文件风险',
    tone: 'info',
    url: '/pages/upload/index',
  },
  {
    id: 'report',
    title: '风险报告',
    description: '生成详细报告',
    tone: 'warning',
    url: '/pages/report/index',
  },
  {
    id: 'chat',
    title: '智能问答',
    description: '基于原文，AI 问答',
    tone: 'success',
    url: '/pages/chat/index',
  },
  {
    id: 'files',
    title: '我的文件',
    description: '查看历史记录',
    tone: 'accent',
    url: '/pages/files/index',
  },
] as const
