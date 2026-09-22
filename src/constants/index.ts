export const APP_NAME = '安心文档分析'

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_ID: 'userId',
  PROFILE: 'loginProfile',
} as const

/**
 * 云托管环境 ID 与服务名：小程序端 callContainer 靠这两个值路由到具体服务实例。
 * 它们是打进小程序包的公开配置，不是密钥；换环境时用构建变量覆盖
 */
export const CLOUDRUN_ENV = process.env.CLOUDRUN_ENV || 'prod-d1gw1hyg964f1acb3'
export const CLOUDRUN_SERVICE = process.env.CLOUDRUN_SERVICE || 'springboot-8oag'
