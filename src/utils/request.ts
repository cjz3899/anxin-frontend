import Taro from '@tarojs/taro'

import { STORAGE_KEYS } from '../constants'
import { expireAuthSession } from './auth-expiration'
import { createAuthorizationHeader } from './request-auth'
import { getErrorMessage, parseApiResponse, type ApiResponse } from './request-core'

export type { ApiResponse } from './request-core'

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080'

/** 业务码：后端约定 10005 与 HTTP 401 同义，表示登录过期 */
const AUTH_EXPIRED_CODE = 10005

export interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  data?: any
  header?: Record<string, string>
  showError?: boolean
}

export interface UploadOptions {
  url: string
  filePath: string
  name?: string
  formData?: Record<string, any>
  header?: Record<string, string>
  showError?: boolean
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
 * 统一请求封装：注入 accessToken、统一解析 { code, data, msg } 返回格式。
 * code === 1 视为成功，登录过期（401 / 10005）时清理本地登录态，其余 toast 并 reject。
 */
export function request<T = unknown>(options: RequestOptions): Promise<T> {
  const authorization = Taro.getStorageSync(STORAGE_KEYS.ACCESS_TOKEN)

  return new Promise<T>((resolve, reject) => {
    Taro.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'content-type': 'application/json',
        ...createAuthorizationHeader(authorization),
        ...options.header,
      },
      success: res => {
        try {
          const body = parseApiResponse<T>(res.data)
          if (body.code === 1) {
            resolve(body.data)
          } else if (isAuthExpired(body.code)) {
            handleAuthExpired()
            reject(body)
          } else {
            showRequestError(options, body.msg || '请求失败')
            reject(body)
          }
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
 * 统一上传封装：注入 accessToken，multipart 上传（字段名默认 file），
 * 解析 { code, data, msg }。用于头像等文件上传接口。
 */
export function upload<T = unknown>(options: UploadOptions): Promise<T> {
  const authorization = Taro.getStorageSync(STORAGE_KEYS.ACCESS_TOKEN)

  return new Promise<T>((resolve, reject) => {
    Taro.uploadFile({
      url: BASE_URL + options.url,
      filePath: options.filePath,
      name: options.name || 'file',
      formData: options.formData,
      header: {
        ...createAuthorizationHeader(authorization),
        ...options.header,
      },
      success: res => {
        let body: ApiResponse<T>
        try {
          body = parseApiResponse<T>(JSON.parse(res.data))
        } catch (error) {
          showRequestError(options, '上传响应解析失败')
          reject(error)
          return
        }
        if (body.code === 1) {
          resolve(body.data)
        } else if (isAuthExpired(body.code)) {
          handleAuthExpired()
          reject(body)
        } else {
          Taro.showToast({ title: body.msg || '上传失败', icon: 'none' })
          reject(body)
        }
      },
      fail: err => {
        Taro.showToast({ title: '网络错误', icon: 'none' })
        reject(err)
      },
    })
  })
}
