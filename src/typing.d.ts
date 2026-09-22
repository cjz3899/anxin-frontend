/// <reference types="@tarojs/taro" />

declare module '*.png'
declare module '*.gif'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.svg'
declare module '*.css'
declare module '*.less'
declare module '*.scss'
declare module '*.sass'
declare module '*.styl'

declare namespace NodeJS {
  interface ProcessEnv {
    /** NODE 内置环境变量，会影响到最终构建生成产物 */
    NODE_ENV: 'development' | 'production'
    /** 当前构建的平台 */
    TARO_ENV: 'weapp' | 'swan' | 'alipay' | 'h5' | 'rn' | 'tt' | 'quickapp' | 'qq' | 'jd'
    /** API 请求基础地址，仅本地联调时注入；为空表示走云托管内网调用 */
    API_BASE_URL?: string
    /** 云托管环境 ID，覆盖 src/constants 里的默认值 */
    CLOUDRUN_ENV?: string
    /** 云托管服务名，覆盖 src/constants 里的默认值 */
    CLOUDRUN_SERVICE?: string
  }
}
