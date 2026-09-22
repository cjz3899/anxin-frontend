import { PropsWithChildren } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import '@nutui/icons-react-taro/dist/style_icon.css'
import '@nutui/nutui-react-taro/dist/es/packages/button/style/css'
import '@nutui/nutui-react-taro/dist/es/packages/circleprogress/style/css'
import '@nutui/nutui-react-taro/dist/es/packages/empty/style/css'
import '@nutui/nutui-react-taro/dist/es/packages/steps/style/css'
import '@nutui/nutui-react-taro/dist/es/packages/tabbar/style/css'

import { CLOUDRUN_ENV } from './constants'

import './app.less'

/**
 * callContainer 依赖云能力先初始化。只在微信端、且没在走本地 http 联调时才需要；
 * 用可选链是因为低版本基础库可能根本没有 cloud，缺了要让请求层报出明确原因而不是崩在启动钩子里
 */
function initCloudRuntime() {
  if (process.env.TARO_ENV !== 'weapp' || process.env.API_BASE_URL) return

  const cloud = (
    Taro as unknown as {
      cloud?: { init?: (options: { env: string; traceUser?: boolean }) => void }
    }
  ).cloud
  cloud?.init?.({ env: CLOUDRUN_ENV, traceUser: true })
}

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    initCloudRuntime()
    console.log('安心文档分析 App launched.')
  })

  return children
}

export default App
