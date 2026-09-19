import { View, Text } from '@tarojs/components'
import Popup from '@nutui/nutui-react-taro/dist/es/packages/popup'
import { Weixin } from '@nutui/icons-react-taro'
import AppButton from '../app-button'

export interface LoginModalProps {
  visible: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function LoginModal({ visible, onConfirm, onCancel }: LoginModalProps) {
  return (
    <Popup
      visible={visible}
      position="bottom"
      round
      overlay
      closeable={false}
      onClose={onCancel}
      onOverlayClick={onCancel}
    >
      <View className="login-modal">
        <View className="login-modal__header">
          <Text className="login-modal__title">授权登录</Text>
          <Text className="login-modal__desc">
            登录后即可使用文档分析、风险报告、智能问答等功能
          </Text>
        </View>
        <View className="login-modal__body">
          <AppButton onClick={onConfirm}>
            <Weixin className="login-modal__wechat-icon" />
            <Text>微信一键登录</Text>
          </AppButton>
          <AppButton variant="ghost" onClick={onCancel}>
            <Text>取消</Text>
          </AppButton>
        </View>
      </View>
    </Popup>
  )
}
