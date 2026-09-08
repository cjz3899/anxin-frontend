import { request, upload } from '../utils/request'

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

/** 微信登录：用 wx.login 拿到的临时凭证 code 换双 Token */
export function login(code: string): Promise<LoginResult> {
  return request<LoginResult>({ url: '/api/user/login', method: 'POST', data: { code } })
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

/** 上传头像：后端校验大小/真实类型 + 微信 imgSecCheck 内容安全，返回 OSS 头像地址 */
export function uploadAvatar(filePath: string): Promise<string> {
  return upload<{ avatar: string }>({ url: '/api/user/avatar', filePath }).then(res => res.avatar)
}
