import { useState } from 'react'
import Taro from '@tarojs/taro'
import { ArrowUp, Edit, Order, Photograph, Success, Tips } from '@nutui/icons-react-taro'
import { Text, View } from '@tarojs/components'

import AppButton from '../../components/app-button'
import PageShell from '../../components/page-shell'
import { confirmDocumentUpload, getUploadCredential, uploadFileToOss } from '../../services'
import { runUploadFlow, type SelectedUploadFile, type UploadFlowDependencies } from './model'

import './index.less'

/** 三步编排放在 model.ts，页面只做 Taro 侧接线，方便脱离运行时测试 */
const uploadFlowDependencies: UploadFlowDependencies = {
  getUploadCredential,
  uploadFileToOss,
  confirmDocumentUpload,
  notify: title => Taro.showToast({ title, icon: 'none' }),
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<SelectedUploadFile | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleChoose = async () => {
    try {
      const result = await Taro.chooseMessageFile({ count: 1, type: 'all' })
      const file = result.tempFiles[0]
      if (!file) return
      setSelectedFile({ name: file.name, path: file.path, size: file.size })
    } catch {
      // 用户取消选择时保持当前页面即可。
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || uploading) return
    setUploading(true)

    try {
      const result = await runUploadFlow(uploadFlowDependencies, selectedFile)
      if (!result) return
      await Taro.redirectTo({
        url: `/pages/analysis/index?taskId=${result.taskId}&documentId=${result.documentId}&fileName=${encodeURIComponent(selectedFile.name)}`,
      })
    } catch {
      //失败提示已由请求层给出，这里只需要放开按钮，避免用户被禁用状态卡住
    } finally {
      setUploading(false)
    }
  }

  return (
    <PageShell className="upload-page">
      <View
        className={`drop-zone ${selectedFile ? 'drop-zone--selected' : ''}`}
        hoverClass="drop-zone--pressed"
        onClick={handleChoose}
      >
        <View className="drop-zone__icon">
          {selectedFile ? <Success size="34" /> : <ArrowUp size="34" />}
        </View>
        <Text className="drop-zone__title">
          {selectedFile ? selectedFile.name : '点击选择文件'}
        </Text>
        <Text className="drop-zone__description">
          {selectedFile ? formatSize(selectedFile.size) : '从微信会话或本机文件中选择'}
        </Text>
        <Text className="drop-zone__security">上传后将校验文件类型、大小及内容安全</Text>
      </View>

      <View className="upload-section">
        <Text className="upload-section__title">支持格式</Text>
        <Text className="upload-section__note">PDF / DOCX / JPG / PNG，文档最大 10MB</Text>
        <View className="format-grid">
          <View className="format-card format-card--pdf">
            <View className="format-card__icon">
              <Order size="28" />
            </View>
            <Text className="format-card__label">PDF</Text>
          </View>
          <View className="format-card format-card--word">
            <View className="format-card__icon">
              <Edit size="28" />
            </View>
            <Text className="format-card__label">Word</Text>
          </View>
          <View className="format-card format-card--image">
            <View className="format-card__icon">
              <Photograph size="28" />
            </View>
            <Text className="format-card__label">图片</Text>
          </View>
        </View>
      </View>

      <View className="upload-tip">
        <View className="upload-tip__icon">
          <Tips size="18" />
        </View>
        <Text>文件仅用于本次风险分析，请勿上传含有无关敏感信息的内容。</Text>
      </View>

      <AppButton
        className="upload-submit"
        disabled={!selectedFile || uploading}
        loading={uploading}
        onClick={handleUpload}
      >
        {selectedFile ? '上传并开始分析' : '请先选择文件'}
      </AppButton>
    </PageShell>
  )
}
