import Taro from '@tarojs/taro'

import { CLOUDRUN_ENV, CLOUDRUN_SERVICE, STORAGE_KEYS } from '../constants'
import { expireAuthSession } from './auth-expiration'
import { createAuthorizationHeader } from './request-auth'
import {
  buildPathWithQuery,
  getErrorMessage,
  parseResponsePayload,
  resolveTransport,
  type ApiResponse,
} from './request-core'

export type { ApiResponse } from './request-core'

/** 本地联调用的后端地址。配了它才走 http 直连，不配就走云托管内网调用 */
const API_BASE_URL = process.env.API_BASE_URL || ''
const TRANSPORT = resolveTransport(API_BASE_URL)

/** 业务码：后端约定 10005 与 HTTP 401 同义，表示登录过期 */
const AUTH_EXPIRED_CODE = 10005

export interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  data?: any
  header?: Record<string, string>
  showError?: boolean
}

export interface DirectUploadOptions {
  /** 对象存储下发的完整上传地址，不拼 BASE_URL */
  url: string
  filePath: string
  name?: string
  formData?: Record<string, any>
  showError?: boolean
}

/** 各版类型定义里 callContainer 的位置不一致，只声明用到的部分 */
interface CallContainerOptions {
  config: { env: string }
  path: string
  method?: string
  data?: any
  header?: Record<string, string>
  success?: (res: { statusCode: number; data: unknown }) => void
  fail?: (error: unknown) => void
}

function isAuthExpired(code: number): boolean {
  return code === 401 || code === AUTH_EXPIRED_CODE
}

function handleAuthExpired() {
  expireAuthSession({
    removeStorage: key => Taro.removeStorageSync(key),
    notify: title => Taro.showToast({ title, icon: 'none' }),
  })
}

function showRequestError(options: { showError?: boolean }, title: string) {
  if (options.showError !== false) {
    Taro.showToast({ title, icon: 'none' })
  }
}

/**
 * 两条通道共用同一套 { code, data, msg } 判定。
 * 分成两份实现迟早会漂移：一边处理了登录过期、另一边忘了，表现就是内网能自动跳登录而 http 不行
 */
function settleApiResponse<T>(
  body: ApiResponse<T>,
  options: { showError?: boolean },
  resolve: (data: T) => void,
  reject: (error: unknown) => void
) {
  if (body.code === 1) {
    resolve(body.data)
  } else if (isAuthExpired(body.code)) {
    handleAuthExpired()
    reject(body)
  } else {
    showRequestError(options, body.msg || '请求失败')
    reject(body)
  }
}

/**
 * 统一请求封装：注入 accessToken、统一解析 { code, data, msg } 返回格式。
 * code === 1 视为成功，登录过期（401 / 10005）时清理本地登录态，其余 toast 并 reject。
 */
export function request<T = unknown>(options: RequestOptions): Promise<T> {
  const authorization = Taro.getStorageSync(STORAGE_KEYS.ACCESS_TOKEN)
  const header = {
    'content-type': 'application/json',
    ...createAuthorizationHeader(authorization),
    ...options.header,
  }

  return TRANSPORT === 'cloud'
    ? requestByContainer<T>(options, header)
    : requestByHttp<T>(options, header)
}

/** 云托管内网调用：免公网域名、免配置小程序合法域名 */
function requestByContainer<T>(
  options: RequestOptions,
  header: Record<string, string>
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const cloud = (
      Taro as unknown as { cloud?: { callContainer?: (o: CallContainerOptions) => void } }
    ).cloud
    if (!cloud || !cloud.callContainer) {
      //基础库过低或不在微信端运行时，给明确原因，别让调用方对着一个 undefined 报错猜
      showRequestError(options, '当前环境不支持云托管内网调用')
      reject(new Error('callContainer unavailable'))
      return
    }

    const method = options.method || 'GET'
    const isGet = method === 'GET'
    cloud.callContainer({
      config: { env: CLOUDRUN_ENV },
      //服务名走 header，与云托管的路由约定一致
      path: isGet ? buildPathWithQuery(options.url, options.data) : options.url,
      method,
      data: isGet ? undefined : options.data,
      header: { ...header, 'X-WX-SERVICE': CLOUDRUN_SERVICE },
      success: res => {
        try {
          settleApiResponse<T>(parseResponsePayload<T>(res.data), options, resolve, reject)
        } catch (error) {
          showRequestError(options, getErrorMessage(error, '请求失败'))
          reject(error)
        }
      },
      fail: err => {
        showRequestError(options, '网络错误')
        reject(err)
      },
    })
  })
}

/** http 直连：只在本地联调（配了 API_BASE_URL）时使用 */
function requestByHttp<T>(options: RequestOptions, header: Record<string, string>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    Taro.request({
      url: API_BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header,
      success: res => {
        try {
          settleApiResponse<T>(parseResponsePayload<T>(res.data), options, resolve, reject)
        } catch (error) {
          showRequestError(options, getErrorMessage(error, '请求失败'))
          reject(error)
        }
      },
      fail: err => {
        showRequestError(options, '网络错误')
        reject(err)
      },
    })
  })
}

/**
 * 直传对象存储（OSS 表单直传）。与容器调用不同的三点：
 * 地址由服务端下发、不拼 BASE_URL；鉴权靠 PostPolicy 签名、不注入 authorization；
 * 成功时 OSS 返回空响应体，不能按 { code, data, msg } 解析，只能按 HTTP 状态码判定。
 */
export function uploadToOss(options: DirectUploadOptions): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    Taro.uploadFile({
      url: options.url,
      filePath: options.filePath,
      name: options.name || 'file',
      formData: options.formData,
      success: res => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve()
          return
        }
        //OSS 的错误体是 XML，拿给用户看没有意义，只给一句可执行的提示
        showRequestError(options, '文件上传失败，请重试')
        reject(res)
      },
      fail: err => {
        showRequestError(options, '网络错误')
        reject(err)
      },
    })
  })
}
