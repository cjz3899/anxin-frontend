import Taro from '@tarojs/taro'

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080'

/** 业务码：后端约定 10005 与 HTTP 401 同义，表示登录过期 */
const AUTH_EXPIRED_CODE = 10005

export interface ApiResponse<T = unknown> {
  code: number
  data: T
  msg?: string
}

export interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
}

export interface UploadOptions {
  url: string
  filePath: string
  name?: string
  formData?: Record<string, any>
  header?: Record<string, string>
}

function isAuthExpired(code: number): boolean {
  return code === 401 || code === AUTH_EXPIRED_CODE
}

function handleAuthExpired() {
  Taro.showToast({ title: '登录已过期', icon: 'none' })
  Taro.navigateTo({ url: '/pages/login/index' })
}

/**
 * 统一请求封装：注入 accessToken、统一解析 { code, data, msg } 返回格式。
 * code === 1 视为成功，登录过期（401 / 10005）时提示并跳登录页，其余 toast 并 reject。
 */
export function request<T = unknown>(options: RequestOptions): Promise<T> {
  const token = Taro.getStorageSync('accessToken')

  return new Promise<T>((resolve, reject) => {
    Taro.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'content-type': 'application/json',
        ...(token ? { token } : {}),
        ...options.header,
      },
      success: res => {
        const body = res.data as ApiResponse<T>
        if (body.code === 1) {
          resolve(body.data)
        } else if (isAuthExpired(body.code)) {
          handleAuthExpired()
          reject(body)
        } else {
          Taro.showToast({ title: body.msg || '请求失败', icon: 'none' })
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

/**
 * 统一上传封装：注入 accessToken，multipart 上传（字段名默认 file），
 * 解析 { code, data, msg }。用于头像等文件上传接口。
 */
export function upload<T = unknown>(options: UploadOptions): Promise<T> {
  const token = Taro.getStorageSync('accessToken')

  return new Promise<T>((resolve, reject) => {
    Taro.uploadFile({
      url: BASE_URL + options.url,
      filePath: options.filePath,
      name: options.name || 'file',
      formData: options.formData,
      header: {
        ...(token ? { token } : {}),
        ...options.header,
      },
      success: res => {
        let body: ApiResponse<T>
        try {
          body = JSON.parse(res.data) as ApiResponse<T>
        } catch (e) {
          Taro.showToast({ title: '上传响应解析失败', icon: 'none' })
          reject(e)
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
