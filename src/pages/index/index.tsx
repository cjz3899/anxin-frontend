import { ArrowRight, ArrowUp, Message, Order, ShieldCheck } from '@nutui/icons-react-taro'
import { Text, View } from '@tarojs/components'

import AppButton from '../../components/app-button'
import PageShell from '../../components/page-shell'
import StatusTag from '../../components/status-tag'
import { openProtectedPage } from '../../utils/protected-navigation'

import './index.less'

const shortcuts = [
  {
    icon: Order,
    title: '风险报告',
    description: '查看分析结果',
    tone: 'primary',
    url: '/pages/report/index',
  },
  {
    icon: Message,
    title: '智能问答',
    description: '围绕文件提问',
    tone: 'success',
    url: '/pages/chat/index',
  },
] as const

export default function Home() {
  return (
    <PageShell bottomNav="home" className="home-page">
      <View className="home-header">
        <View className="home-header__identity">
          <View className="home-header__brand-icon">
            <ShieldCheck size="24" />
          </View>
          <View>
            <Text className="home-header__title">文档风险助手</Text>
            <Text className="home-header__subtitle">让复杂的文件变得简单</Text>
          </View>
        </View>
        <StatusTag tone="success">安全守护中</StatusTag>
      </View>

      <View className="upload-hero">
        <View className="upload-hero__halo" />
        <View className="upload-hero__document">
          <View className="upload-hero__line upload-hero__line--long" />
          <View className="upload-hero__line" />
          <View className="upload-hero__shield">
            <ShieldCheck size="28" />
          </View>
        </View>
        <Text className="upload-hero__title">上传文件，开始分析</Text>
        <Text className="upload-hero__description">支持 PDF、Word、图片</Text>
        <AppButton
          className="upload-hero__button"
          icon={<ArrowUp size="18" />}
          variant="secondary"
          onClick={() => void openProtectedPage('/pages/upload/index')}
        >
          立即上传
        </AppButton>
      </View>

      <View className="shortcut-grid">
        {shortcuts.map(item => (
          <View
            className={`shortcut-card shortcut-card--${item.tone}`}
            key={item.title}
            hoverClass="shortcut-card--pressed"
            onClick={() => void openProtectedPage(item.url)}
          >
            <View className="shortcut-card__icon">
              <item.icon size="24" />
            </View>
            <Text className="shortcut-card__title">{item.title}</Text>
            <Text className="shortcut-card__description">{item.description}</Text>
          </View>
        ))}
      </View>

      <View className="recent-section">
        <View className="recent-section__heading">
          <Text className="recent-section__title">最近分析</Text>
          <Text className="recent-section__more">全部</Text>
        </View>
        <View
          className="recent-file"
          hoverClass="recent-file--pressed"
          onClick={() => void openProtectedPage('/pages/report/index')}
        >
          <View className="recent-file__icon">
            <Order size="24" />
          </View>
          <View className="recent-file__content">
            <Text className="recent-file__name">房屋租赁合同.pdf</Text>
            <Text className="recent-file__meta">分析完成 · 发现 5 项风险</Text>
          </View>
          <StatusTag tone="danger">高风险</StatusTag>
          <ArrowRight className="recent-file__arrow" size="18" />
        </View>
      </View>
    </PageShell>
  )
}
