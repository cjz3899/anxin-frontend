import { View, Text } from '@tarojs/components'
import { Button } from '@nutui/nutui-react-taro'

import './index.less'

export default function Index() {
  return (
    <View className="index">
      <View className="index__header">
        <Text className="index__title">安心文档分析</Text>
        <Text className="index__subtitle">智能合同风险分析助手</Text>
      </View>
      <View className="index__body">
        <Button type="primary" block>
          微信一键登录
        </Button>
      </View>
    </View>
  )
}
