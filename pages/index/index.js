// index.js —— 【临时测试页】微信小程序登录联调测试，测试完成后由脚本还原
const BASE_URL = 'http://localhost:8080'

Page({
  data: {
    logs: []
  },

  onTestLogin() {
    this.appendLog('[步骤0] 开始真实登录测试，调用 wx.login() 获取 code...')
    wx.login({
      success: (res) => {
        if (res.code) {
          this.appendLog('[步骤0] wx.login 成功，code=' + res.code.slice(0, 16) + '...')
          this.doLogin(res.code)
        } else {
          this.appendLog('[步骤0] wx.login 未返回 code: ' + JSON.stringify(res))
        }
      },
      fail: (err) => {
        this.appendLog('[步骤0] wx.login 失败: ' + err.errMsg)
      }
    })
  },

  onTestBadCode() {
    this.appendLog('===== 失败分支测试：伪造 code 调用 /login =====')
    this.doLogin('opencode_fake_code_for_fail_test')
  },

  doLogin(code) {
    wx.request({
      url: BASE_URL + '/api/user/login',
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: { code },
      success: (res) => {
        this.appendLog('[步骤1] POST /api/user/login 响应: ' + JSON.stringify(res.data))
        const body = res.data || {}
        if (body.code === 1 && body.data) {
          const token = body.data.accessToken
          this.appendLog('[步骤1] 登录成功! userId=' + body.data.id)
          this.doProfile(token)
          this.doRefresh(body.data.refreshToken)
        } else {
          this.appendLog('[步骤1] 登录失败, 错误码=' + body.code + ', 信息=' + body.msg)
        }
      },
      fail: (err) => {
        this.appendLog('[步骤1] /login 请求失败: ' + err.errMsg + '（请确认已勾选"不校验合法域名"且后端已启动）')
      }
    })
  },

  doProfile(token) {
    wx.request({
      url: BASE_URL + '/api/user/profile',
      method: 'POST',
      header: { 'content-type': 'application/json', token },
      data: { nickname: '微信测试用户', avatar: '' },
      success: (res) => {
        this.appendLog('[步骤2] POST /api/user/profile (携带token) 响应: ' + JSON.stringify(res.data))
      },
      fail: (err) => {
        this.appendLog('[步骤2] /profile 请求失败: ' + err.errMsg)
      }
    })
  },

  doRefresh(refreshToken) {
    wx.request({
      url: BASE_URL + '/api/user/refresh',
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: { refreshToken },
      success: (res) => {
        this.appendLog('[步骤3] POST /api/user/refresh 响应: ' + JSON.stringify(res.data))
      },
      fail: (err) => {
        this.appendLog('[步骤3] /refresh 请求失败: ' + err.errMsg)
      }
    })
  },

  onClearLog() {
    this.setData({ logs: [] })
  },

  appendLog(line) {
    const time = new Date().toLocaleTimeString()
    this.setData({ logs: this.data.logs.concat('[' + time + '] ' + line) })
  }
})
