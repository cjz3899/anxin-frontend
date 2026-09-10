import { Text, View } from '@tarojs/components'

import BottomNav from '../../components/bottom-nav'
import { openProtectedPage } from '../../utils/protected-navigation'

import './index.less'

const shortcuts = [
  {
    icon: '◇',
    title: '风险报告',
    description: '查看分析结果',
    tone: 'primary',
    url: '/pages/report/index',
  },
  {
    icon: '✦',
    title: '智能问答',
    description: '围绕文件提问',
    tone: 'success',
    url: '/pages/chat/index',
  },
] as const

export default function Home() {
  return (
    <View className="home-page">
      <View className="home-header">
        <View>
          <Text className="home-header__eyebrow">DOCUMENT GUARD</Text>
          <Text className="home-header__title">下午好，安心用户</Text>
        </View>
        <View className="home-header__status">安全守护中</View>
      </View>

      <View className="upload-hero">
        <View className="upload-hero__halo" />
        <View className="upload-hero__document">
          <View className="upload-hero__line upload-hero__line--long" />
          <View className="upload-hero__line" />
          <View className="upload-hero__shield">✓</View>
        </View>
        <Text className="upload-hero__title">上传文件，开始分析</Text>
        <Text className="upload-hero__description">支持 PDF、Word、图片</Text>
        <View
          className="upload-hero__button"
          hoverClass="upload-hero__button--pressed"
          onClick={() => void openProtectedPage('/pages/upload/index')}
        >
          ＋ 立即上传
        </View>
      </View>

      <View className="shortcut-grid">
        {shortcuts.map(item => (
          <View
            className={`shortcut-card shortcut-card--${item.tone}`}
            key={item.title}
            hoverClass="shortcut-card--pressed"
            onClick={() => void openProtectedPage(item.url)}
          >
            <Text className="shortcut-card__icon">{item.icon}</Text>
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
          <View className="recent-file__icon">PDF</View>
          <View className="recent-file__content">
            <Text className="recent-file__name">房屋租赁合同.pdf</Text>
            <Text className="recent-file__meta">分析完成 · 发现 5 项风险</Text>
          </View>
          <Text className="recent-file__level">高风险</Text>
          <Text className="recent-file__arrow">›</Text>
        </View>
      </View>

      <BottomNav active="home" />
    </View>
  )
}
