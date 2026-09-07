const BASE_URL = 'http://localhost:8080'

Page({
  data: {
    loading: false
  },

  onLoad() {
    const token = wx.getStorageSync('accessToken')
    if (token) {
      this.goHome()
    }
  },

  onLogin() {
    if (this.data.loading) return
    this.setData({ loading: true })

    wx.login({
      success: (loginRes) => {
        if (loginRes.code) {
          this.doLogin(loginRes.code)
        } else {
          wx.showToast({ title: '微信登录失败', icon: 'none' })
          this.setData({ loading: false })
        }
      },
      fail: () => {
        wx.showToast({ title: '微信登录失败', icon: 'none' })
        this.setData({ loading: false })
      }
    })
  },

  doLogin(code) {
    wx.request({
      url: BASE_URL + '/api/user/login',
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: { code: code },
      success: (res) => {
        const data = res.data
        if (data.code === 1 && data.data) {
          wx.setStorageSync('accessToken', data.data.accessToken)
          wx.setStorageSync('refreshToken', data.data.refreshToken)
          wx.setStorageSync('userId', data.data.id)
          wx.showToast({ title: '登录成功', icon: 'success' })
          setTimeout(() => {
            this.goHome()
          }, 500)
        } else {
          wx.showToast({ title: data.msg || '登录失败', icon: 'none' })
        }
      },
      fail: (err) => {
        wx.showToast({ title: '网络错误', icon: 'none' })
      },
      complete: () => {
        this.setData({ loading: false })
      }
    })
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})
