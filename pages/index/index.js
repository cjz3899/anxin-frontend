const BASE_URL = 'http://localhost:8080'

Page({
  data: {
    uploading: false,
    uploadProgress: 0,
    fileList: []
  },

  onShow() {
    this.checkLogin()
  },

  checkLogin() {
    const token = wx.getStorageSync('accessToken')
    if (!token) {
      wx.redirectTo({ url: '/pages/login/login' })
    }
  },

  onChooseFile() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['file'],
      extension: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
      success: (res) => {
        const file = res.tempFiles[0]
        const ext = file.tempFilePath.split('.').pop().toLowerCase()
        const allowedExts = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']
        if (!allowedExts.includes(ext)) {
          wx.showToast({ title: '仅支持PDF/Word/图片', icon: 'none' })
          return
        }
        const maxSize = ['jpg', 'jpeg', 'png'].includes(ext) ? 5 * 1024 * 1024 : 10 * 1024 * 1024
        if (file.size > maxSize) {
          wx.showToast({ title: '文件大小超限', icon: 'none' })
          return
        }
        this.uploadFile(file.tempFilePath, file.tempFilePath.split('/').pop())
      }
    })
  },

  uploadFile(filePath, fileName) {
    this.setData({ uploading: true, uploadProgress: 0 })
    const token = wx.getStorageSync('accessToken')
    const uploadTask = wx.uploadFile({
      url: BASE_URL + '/api/document/upload',
      filePath: filePath,
      name: 'file',
      header: { token: token },
      success: (res) => {
        const data = JSON.parse(res.data)
        if (data.code === 1) {
          wx.showToast({ title: '上传成功', icon: 'success' })
          const item = {
            id: data.data.documentId,
            taskId: data.data.taskId,
            name: fileName,
            status: data.data.status,
            time: this.formatTime(new Date())
          }
          const fileList = [item].concat(this.data.fileList)
          this.setData({ fileList: fileList })
        } else {
          wx.showToast({ title: data.msg || '上传失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' })
      },
      complete: () => {
        this.setData({ uploading: false, uploadProgress: 0 })
      }
    })
    uploadTask.onProgressUpdate((res) => {
      this.setData({ uploadProgress: res.progress })
    })
  },

  onViewReport(e) {
    const taskId = e.currentTarget.dataset.taskid
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  formatTime(date) {
    const y = date.getFullYear()
    const m = (date.getMonth() + 1).toString().padStart(2, '0')
    const d = date.getDate().toString().padStart(2, '0')
    return `${y}-${m}-${d}`
  }
})
