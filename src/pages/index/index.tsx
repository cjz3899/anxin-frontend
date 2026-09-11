import { Category, Message, Order, ShieldCheck } from '@nutui/icons-react-taro'
import { Image, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

import AppButton from '../../components/app-button'
import PageShell from '../../components/page-shell'
import { getCustomNavigationTopPadding } from '../../utils/custom-navigation'
import { openProtectedPage } from '../../utils/protected-navigation'
import homeHeroImage from '../../assets/document-risk-assistant-icon.svg'

import { homeFeatures } from './home-features'
import './index.less'

const featureIcons = {
  analysis: ShieldCheck,
  report: Order,
  chat: Message,
  files: Category,
}

export default function Home() {
  const systemInfo = Taro.getSystemInfoSync()
  const menuButton = Taro.getMenuButtonBoundingClientRect()
  const immersiveHeaderPadding = getCustomNavigationTopPadding({
    menuBottom: menuButton?.bottom,
    statusBarHeight: systemInfo.statusBarHeight ?? 0,
    windowWidth: systemInfo.windowWidth,
  })

  return (
    <PageShell bottomNav="home" className="home-page">
      <View className="home-immersive-header" style={{ paddingTop: immersiveHeaderPadding }}>
        <View className="home-header">
          <View className="home-header__identity">
            <View className="home-header__brand-icon">
              <ShieldCheck size="32" />
            </View>
            <View>
              <Text className="home-header__title">文档风险助手</Text>
              <Text className="home-header__subtitle">让复杂的文件变得简单</Text>
            </View>
          </View>
        </View>

        <View className="home-illustration">
          <Image className="home-illustration__image" mode="widthFix" src={homeHeroImage} />
        </View>
      </View>

      <View className="home-actions">
        <AppButton
          className="home-upload-action"
          variant="primary"
          onClick={() => void openProtectedPage('/pages/upload/index')}
        >
          <View className="home-upload-action__content">
            <Text className="home-upload-action__title">上传文件</Text>
            <Text className="home-upload-action__description">支持 PDF、Word、图片等格式</Text>
          </View>
        </AppButton>

        <View className="home-feature-grid">
          {homeFeatures.map(feature => {
            const Icon = featureIcons[feature.id]

            return (
              <AppButton
                className={`home-feature-card home-feature-card--${feature.tone}`}
                key={feature.id}
                variant="ghost"
                onClick={() => void openProtectedPage(feature.url)}
              >
                <View className="home-feature-card__content">
                  <View className="home-feature-card__icon">
                    <Icon size="34" />
                  </View>
                  <Text className="home-feature-card__title">{feature.title}</Text>
                  <Text className="home-feature-card__description">{feature.description}</Text>
                </View>
              </AppButton>
            )
          })}
        </View>
      </View>
    </PageShell>
  )
}
