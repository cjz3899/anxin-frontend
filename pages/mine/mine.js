const BASE_URL = 'http://localhost:8080'

Page({
  data: {
    avatar: '',
    nickname: '微信用户',
    userId: ''
  },

  onShow() {
    const avatar = wx.getStorageSync('avatar') || ''
    const nickname = wx.getStorageSync('nickname') || '微信用户'
    const userId = wx.getStorageSync('userId') || ''
    this.setData({ avatar, nickname, userId })
  },

  onChooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.uploadAvatar(tempFilePath)
      }
    })
  },

  uploadAvatar(filePath) {
    wx.showLoading({ title: '上传中...' })
    const token = wx.getStorageSync('accessToken')
    wx.uploadFile({
      url: BASE_URL + '/api/user/avatar',
      filePath: filePath,
      name: 'file',
      header: { token: token },
      success: (res) => {
        const data = JSON.parse(res.data)
        if (data.code === 1) {
          const avatarUrl = data.data.avatar
          wx.setStorageSync('avatar', avatarUrl)
          this.setData({ avatar: avatarUrl })
          this.updateProfile(avatarUrl)
        } else {
          wx.showToast({ title: data.msg || '上传失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  updateProfile(avatar) {
    const token = wx.getStorageSync('accessToken')
    const nickname = this.data.nickname
    wx.request({
      url: BASE_URL + '/api/user/profile',
      method: 'POST',
      header: {
        'content-type': 'application/json',
        token: token
      },
      data: { nickname: nickname, avatar: avatar },
      success: (res) => {
        if (res.data.code === 1) {
          wx.showToast({ title: '更新成功', icon: 'success' })
        }
      }
    })
  },

  onEditNickname() {
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入新昵称',
      success: (res) => {
        if (res.confirm && res.content) {
          const nickname = res.content.trim()
          if (nickname) {
            this.setData({ nickname: nickname })
            wx.setStorageSync('nickname', nickname)
            this.updateProfile(this.data.avatar)
          }
        }
      }
    })
  },

  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          const token = wx.getStorageSync('accessToken')
          wx.request({
            url: BASE_URL + '/api/user/logout',
            method: 'POST',
            header: { token: token },
            success: () => {
              this.clearStorage()
            },
            fail: () => {
              this.clearStorage()
            }
          })
        }
      }
    })
  },

  clearStorage() {
    wx.removeStorageSync('accessToken')
    wx.removeStorageSync('refreshToken')
    wx.removeStorageSync('userId')
    wx.removeStorageSync('avatar')
    wx.removeStorageSync('nickname')
    wx.reLaunch({ url: '/pages/login/login' })
  }
})
