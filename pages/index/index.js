const BASE_URL = 'http://localhost:8080'
const KEY = {
  access: 'accessToken',
  refresh: 'refreshToken',
  userId: 'userId',
  profile: 'loginProfile'
}

Page({
  data: {
    baseUrl: BASE_URL,
    loggedIn: false,
    loggingIn: false,
    uploading: false,
    saving: false,
    refreshing: false,
    userId: '',
    profile: {},
    avatarText: '微',
    nickname: '',
    avatarTempPath: '',
    avatarUrl: '',
    avatarStatus: '',
    avatarStatusClass: '',
    logs: [],
    logScrollTop: 0
  },

  onLoad() {
    const accessToken = wx.getStorageSync(KEY.access)
    const userId = wx.getStorageSync(KEY.userId) || ''
    const profile = wx.getStorageSync(KEY.profile) || {}
    this.setData({
      loggedIn: !!accessToken,
      userId,
      profile,
      avatarText: this.avatarTextOf(profile)
    })
    this.log(accessToken ? '已恢复本地登录态，用户 ID：' + userId : '当前未登录，请点击下方“微信一键登录”')
  },

  avatarTextOf(profile) {
    return profile && profile.nickname ? profile.nickname[0] : ''
  },

  onLogin() {
    if (this.data.loggingIn) {
      return
    }
    this.setData({ loggingIn: true })
    this.log('步骤0：调用 wx.login() 获取临时登录凭证 code…')
    wx.login({
      success: (res) => {
        if (!res.code) {
          this.setData({ loggingIn: false })
          this.log('wx.login 未返回 code：' + JSON.stringify(res), 'err')
          return
        }
        this.log('wx.login 成功，code=' + res.code.slice(0, 12) + '…（后端将调用微信 code2session 换取 openid）')
        this.doLogin(res.code)
      },
      fail: (err) => {
        this.setData({ loggingIn: false })
        this.log('wx.login 失败：' + err.errMsg, 'err')
      }
    })
  },

  doLogin(code) {
    this.request({ url: '/api/user/login', method: 'POST', data: { code } })
      .then((body) => {
        if (body.code !== 1) {
          throw new Error('登录失败（code=' + body.code + '）：' + body.msg)
        }
        const data = body.data
        wx.setStorageSync(KEY.access, data.accessToken)
        wx.setStorageSync(KEY.refresh, data.refreshToken)
        wx.setStorageSync(KEY.userId, data.id)
        this.setData({ loggedIn: true, loggingIn: false, userId: data.id })
        this.log('登录成功：userId=' + data.id + '，双 Token 已保存（access 2h / refresh 7d）', 'ok')
        wx.showToast({ title: '登录成功', icon: 'success' })
      })
      .catch((err) => {
        this.setData({ loggingIn: false })
        this.log('' + err.message, 'err')
        if (err.message && err.message.indexOf('微信登录失败') > -1) {
          this.log('提示：请确认后端已配置微信 appid / secret，且 code 未被重复使用', 'err')
        }
      })
  },

  onLogout() {
    const token = wx.getStorageSync(KEY.access)
    this.request({ url: '/api/user/logout', method: 'POST', token })
      .then(() => {
        this.clearLoginState()
        this.log('已退出登录，本地 Token 已清除', 'ok')
        wx.showToast({ title: '已退出', icon: 'none' })
      })
      .catch(() => {
        this.clearLoginState()
        this.log('退出接口调用失败，本地 Token 已清除', 'err')
      })
  },

  onRefresh() {
    const refreshToken = wx.getStorageSync(KEY.refresh)
    if (!refreshToken) {
      wx.showToast({ title: '无 refreshToken', icon: 'none' })
      return
    }
    this.setData({ refreshing: true })
    this.log('调用 POST /api/user/refresh 轮换双 Token…')
    this.request({ url: '/api/user/refresh', method: 'POST', data: { refreshToken } })
      .then((body) => {
        this.setData({ refreshing: false })
        if (body.code !== 1) {
          throw new Error('刷新失败（code=' + body.code + '）：' + body.msg)
        }
        const data = body.data
        wx.setStorageSync(KEY.access, data.accessToken)
        wx.setStorageSync(KEY.refresh, data.refreshToken)
        this.setData({ userId: data.id })
        this.log('Token 刷新成功，旧 accessToken 已作废，新 Token 已保存', 'ok')
        wx.showToast({ title: '刷新成功', icon: 'success' })
      })
      .catch((err) => {
        this.setData({ refreshing: false })
        this.log('' + err.message, 'err')
      })
  },

  clearLoginState() {
    wx.removeStorageSync(KEY.access)
    wx.removeStorageSync(KEY.refresh)
    wx.removeStorageSync(KEY.userId)
    wx.removeStorageSync(KEY.profile)
    this.setData({
      loggedIn: false,
      userId: '',
      profile: {},
      avatarText: '',
      nickname: '',
      avatarTempPath: '',
      avatarUrl: '',
      avatarStatus: '',
      avatarStatusClass: ''
    })
  },

  handleAuthExpired(msg) {
    this.clearLoginState()
    this.log(msg + '，本地登录态已清除，请重新登录', 'err')
    wx.showToast({ title: '登录已过期', icon: 'none' })
  },

  onChooseAvatar(e) {
    const path = e.detail.avatarUrl
    if (!path) {
      return
    }
    this.setData({
      avatarTempPath: path,
      avatarUrl: '',
      avatarStatus: '已选择头像，请点击下方“上传头像”按钮（后端调微信 imgSecCheck 审核）',
      avatarStatusClass: ''
    })
    this.log('已选择头像临时文件：' + path)
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value })
  },

  onUploadAvatar() {
    const token = wx.getStorageSync(KEY.access)
    if (!token) {
      this.handleAuthExpired('未检测到登录 Token')
      return
    }
    if (!this.data.avatarTempPath) {
      wx.showToast({ title: '请先选择头像', icon: 'none' })
      return
    }
    this.setData({
      uploading: true,
      avatarStatus: '上传中…后端将校验大小/真实类型，并调用微信官方 imgSecCheck 内容安全接口',
      avatarStatusClass: ''
    })
    this.log('步骤1：wx.uploadFile → POST /api/user/avatar（携带 token，multipart 字段 file）')
    wx.uploadFile({
      url: BASE_URL + '/api/user/avatar',
      filePath: this.data.avatarTempPath,
      name: 'file',
      header: { token },
      success: (res) => {
        let body
        try {
          body = JSON.parse(res.data)
        } catch (e) {
          this.finishUpload('上传响应解析失败：' + res.data, 'err')
          return
        }
        if (body.code === 1) {
          const avatarUrl = body.data.avatar
          this.setData({
            avatarUrl,
            uploading: false,
            avatarStatus: '审核通过，图片已存入 OSS：' + avatarUrl,
            avatarStatusClass: 'ok'
          })
          this.log('头像上传成功：' + avatarUrl, 'ok')
        } else if (body.code === 401 || body.code === 10005) {
          this.setData({ uploading: false })
          this.handleAuthExpired(body.msg)
        } else {
          this.finishUpload('头像上传失败（code=' + body.code + '）：' + body.msg, 'err')
          if (body.code === 10008) {
            this.log('10008 = 微信内容安全判定违规，文件已被拦截，未进入 OSS', 'err')
          }
          if (body.code === 10009) {
            this.log('提示：微信内容安全服务不可用，常见原因是 appid/secret 未配置或 access_token 获取失败', 'err')
          }
        }
      },
      fail: (err) => {
        this.finishUpload('上传请求失败：' + err.errMsg + '（请勾选“不校验合法域名”并确认后端已启动）', 'err')
      }
    })
  },

  finishUpload(text, kind) {
    this.setData({
      uploading: false,
      avatarStatus: text,
      avatarStatusClass: kind === 'err' ? 'err' : ''
    })
    this.log(text, kind)
  },

  onSaveProfile() {
    const token = wx.getStorageSync(KEY.access)
    if (!token) {
      this.handleAuthExpired('未检测到登录 Token')
      return
    }
    const nickname = this.data.nickname.trim()
    if (!nickname) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    const payload = { nickname }
    if (this.data.avatarUrl) {
      payload.avatar = this.data.avatarUrl
    }
    this.setData({ saving: true })
    this.log('步骤2：POST /api/user/profile（携带 token），body=' + JSON.stringify(payload))
    this.request({ url: '/api/user/profile', method: 'POST', data: payload, token })
      .then((body) => {
        if (body.code !== 1) {
          if (body.code === 10005) {
            this.setData({ saving: false })
            this.handleAuthExpired(body.msg)
            return
          }
          throw new Error('保存失败（code=' + body.code + '）：' + body.msg)
        }
        const profile = body.data
        wx.setStorageSync(KEY.profile, profile)
        this.setData({
          saving: false,
          profile,
          avatarText: this.avatarTextOf(profile),
          nickname: '',
          avatarTempPath: '',
          avatarUrl: '',
          avatarStatus: '',
          avatarStatusClass: ''
        })
        this.log('资料保存成功，服务端返回：' + JSON.stringify(profile), 'ok')
        wx.showToast({ title: '资料已保存', icon: 'success' })
      })
      .catch((err) => {
        this.setData({ saving: false })
        this.log('' + err.message, 'err')
      })
  },

  request({ url, method, data, token }) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: BASE_URL + url,
        method,
        data,
        header: Object.assign({ 'content-type': 'application/json' }, token ? { token } : {}),
        success: (res) => {
          const body = res.data || {}
          if (res.statusCode === 401 || body.code === 10005) {
            this.log('接口返回登录过期（HTTP ' + res.statusCode + '）：' + (body.msg || '') , 'err')
          }
          resolve(body)
        },
        fail: (err) => {
          reject(new Error(url + ' 请求失败：' + err.errMsg + '（请勾选“不校验合法域名”并确认后端已启动）'))
        }
      })
    })
  },

  onClearLog() {
    this.setData({ logs: [] })
  },

  log(text, kind) {
    const now = new Date()
    const pad = (n) => (n < 10 ? '0' + n : '' + n)
    const time = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds())
    const logs = this.data.logs.concat({ time, text, kind: kind || '' })
    this.setData({
      logs: logs.length > 200 ? logs.slice(logs.length - 200) : logs,
      logScrollTop: this.data.logScrollTop + 1
    })
  }
})
