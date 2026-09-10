import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import '@nutui/icons-react-taro/dist/style_icon.css'
import '@nutui/nutui-react-taro/dist/es/packages/button/style/css'
import '@nutui/nutui-react-taro/dist/es/packages/circleprogress/style/css'
import '@nutui/nutui-react-taro/dist/es/packages/empty/style/css'
import '@nutui/nutui-react-taro/dist/es/packages/steps/style/css'
import '@nutui/nutui-react-taro/dist/es/packages/tabbar/style/css'

import './app.less'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('安心文档分析 App launched.')
  })

  return children
}

export default App
