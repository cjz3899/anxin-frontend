import { request } from '../utils/request'
import { fileNameFromPath } from '../utils/file-name'
import { uploadFileToOss, type UploadCredential } from './document'

/** 登录 / 刷新返回的双 Token 数据 */
export interface LoginResult {
  accessToken: string
  refreshToken: string
  id: string
}

export interface UserProfile {
  id?: string
  nickname?: string
  avatar?: string
}

export interface UpdateProfilePayload {
  nickname: string
  avatar?: string
}

export interface LoginOptions {
  showError?: boolean
}

/** 微信登录：用 wx.login 拿到的临时凭证 code 换双 Token */
export function login(code: string, options: LoginOptions = {}): Promise<LoginResult> {
  return request<LoginResult>({
    url: '/api/user/login',
    method: 'POST',
    data: { code },
    showError: options.showError,
  })
}

/** 退出登录 */
export function logout(): Promise<void> {
  return request<void>({ url: '/api/user/logout', method: 'POST' })
}

/** 轮换双 Token（旧 accessToken 作废） */
export function refresh(refreshToken: string): Promise<LoginResult> {
  return request<LoginResult>({ url: '/api/user/refresh', method: 'POST', data: { refreshToken } })
}

/** 更新用户资料（昵称 / 头像地址） */
export function updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  return request<UserProfile>({ url: '/api/user/profile', method: 'POST', data: payload })
}

/** 查询当前登录用户资料（换设备/清缓存后恢复昵称与头像） */
export function getCurrentUser(): Promise<UserProfile> {
  return request<UserProfile>({ url: '/api/user/me' })
}

/**
 * 上传头像：签发凭证 → 图片直传 OSS → 后端确认（大小/真实格式/微信内容安全），返回头像地址。
 * 图片字节不再经后端中转——内网调用的请求体上限远小于 2MB
 */
export async function uploadAvatar(filePath: string): Promise<string> {
  //chooseAvatar 给的是临时路径没有原始文件名，后缀只能从路径尾巴上摘
  const fileName = fileNameFromPath(filePath)
  const credential = await request<UploadCredential>({
    url: '/api/user/avatar-credential',
    method: 'POST',
    data: { fileName },
  })
  await uploadFileToOss(credential, filePath)
  const result = await request<{ avatar: string }>({
    url: '/api/user/avatar-confirm',
    method: 'POST',
    data: { objectKey: credential.key, fileName },
  })
  return result.avatar
}
