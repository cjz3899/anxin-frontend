import { useEffect, useRef, useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { Message, Right } from '@nutui/icons-react-taro'
import { Input, ScrollView, Text, View } from '@tarojs/components'

import AppButton from '../../components/app-button'
import EmptyPage from '../../components/empty-page'
import PageShell from '../../components/page-shell'
import {
  createChatSession,
  listChatMessages,
  listChatSessions,
  sendChatMessage,
  type ChatMessage,
} from '../../services'

import './index.less'

const MAX_CONTENT_LENGTH = 1000

export default function ChatPage() {
  const { params } = useRouter()
  const documentId = params.documentId ?? ''
  const fileName = params.fileName ? decodeURIComponent(params.fileName) : ''

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const sessionIdRef = useRef('')
  const scrollAnchorId = useRef(`anchor-${Date.now()}`)

  const scrollToBottom = () => {
    scrollAnchorId.current = `anchor-${Date.now()}`
  }

  // 进入页面：定位或创建当前文档的会话，并加载历史消息
  useEffect(() => {
    if (!documentId) {
      setLoading(false)
      return
    }
    let cancelled = false

    const ensureSession = async () => {
      try {
        const page = await listChatSessions(documentId, 1, 1)
        if (cancelled) return
        const existing = page.records[0]
        const session =
          existing ??
          (await createChatSession(documentId, fileName ? `《${fileName}》问答` : '文档问答'))
        if (cancelled) return
        sessionIdRef.current = session.id
        const history = await listChatMessages(session.id)
        if (cancelled) return
        setMessages(history)
        scrollToBottom()
      } catch {
        if (!cancelled) setLoadFailed(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void ensureSession()
    return () => {
      cancelled = true
    }
  }, [documentId, fileName])

  const handleSend = async () => {
    const content = inputValue.trim()
    if (!content || sending || !sessionIdRef.current) return

    setInputValue('')
    setSending(true)
    // 本地先插入用户消息，AI 回复由接口返回后追加
    setMessages(prev => [
      ...prev,
      {
        messageId: `local-${Date.now()}`,
        role: 'USER',
        content,
        references: [],
        createdTime: '',
      },
    ])
    scrollToBottom()

    try {
      const reply = await sendChatMessage(sessionIdRef.current, content)
      setMessages(prev => [...prev, reply])
      scrollToBottom()
    } catch {
      Taro.showToast({ title: '发送失败，请重试', icon: 'none' })
    } finally {
      setSending(false)
    }
  }

  const goFiles = () => {
    Taro.redirectTo({ url: '/pages/files/index' })
  }

  if (!documentId || loadFailed) {
    return (
      <PageShell className="empty-shell">
        <EmptyPage
          description={
            loadFailed
              ? '会话加载失败，请返回重试。'
              : '选择一个已完成分析的文件，即可基于原文进行智能问答。'
          }
          icon={<Message size="34" />}
          showConstruction={false}
          title="智能问答"
        />
        {!loadFailed && (
          <AppButton className="chat-goto-files" onClick={goFiles}>
            去我的文件
          </AppButton>
        )}
      </PageShell>
    )
  }

  if (loading) {
    return (
      <PageShell className="empty-shell">
        <EmptyPage
          description="正在准备会话…"
          icon={<Message size="34" />}
          showConstruction={false}
          title="智能问答"
        />
      </PageShell>
    )
  }

  return (
    <PageShell className="chat-page">
      <ScrollView
        className="chat-message-list"
        enableFlex
        scrollIntoView={scrollAnchorId.current}
        scrollY
      >
        {messages.length === 0 && (
          <View className="chat-welcome">
            <Text className="chat-welcome__title">基于文件原文的 AI 问答</Text>
            <Text className="chat-welcome__description">
              {fileName ? `当前文件：${fileName}` : '你可以就文件条款内容随时提问'}
            </Text>
          </View>
        )}

        {messages.map(message =>
          message.role === 'USER' ? (
            <View className="chat-bubble chat-bubble--user" key={message.messageId}>
              <Text>{message.content}</Text>
            </View>
          ) : (
            <View className="chat-answer" key={message.messageId}>
              <View className="chat-answer__avatar">AI</View>
              <View className="chat-answer__body">
                <View className="chat-bubble chat-bubble--assistant">
                  <Text>{message.content}</Text>
                </View>
                {(message.references ?? []).map(reference => (
                  <View className="chat-reference" key={reference.sectionId}>
                    <Text className="chat-reference__label">引用原文</Text>
                    <Text className="chat-reference__content">{reference.content}</Text>
                    <Text className="chat-reference__meta">
                      {reference.title}
                      {reference.sectionNo ? ` · 第 ${reference.sectionNo} 条` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )
        )}
        <View className="chat-scroll-anchor" id={scrollAnchorId.current} />
      </ScrollView>

      <View className="chat-composer">
        <Input
          className="chat-composer__input"
          confirmType="send"
          disabled={sending}
          maxlength={MAX_CONTENT_LENGTH}
          placeholder="请输入你的问题…"
          value={inputValue}
          onConfirm={() => void handleSend()}
          onInput={event => setInputValue(event.detail.value)}
        />
        <View
          className={`chat-composer__send ${inputValue.trim() && !sending ? '' : 'chat-composer__send--disabled'}`}
          hoverClass="chat-composer__send--pressed"
          onClick={() => void handleSend()}
        >
          <Right size="20" />
        </View>
      </View>
    </PageShell>
  )
}
