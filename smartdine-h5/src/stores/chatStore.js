import { defineStore } from 'pinia'
import { postChat } from '../api/chat'

// 跨组件共享会话状态走 store；页面局部 UI 状态仍留在组件内处理。
const DEFAULT_ERROR_MESSAGE = '网络异常，请稍后再试'
const POST_CHAT_ERROR_MESSAGE = '当前服务暂不可用，请稍后再试。'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const API_SECRET = import.meta.env.VITE_API_SECRET || ''

let messageSeed = 0

const createMessage = (role, content, extra = {}) => {
  messageSeed += 1

  return {
    id: `msg_${Date.now()}_${messageSeed}`,
    role,
    content,
    ...extra,
  }
}

const normalizeMatched = (matched) => {
  if (!matched || typeof matched !== 'object' || typeof matched.id !== 'string') {
    return null
  }

  return {
    id: matched.id,
    title: typeof matched.title === 'string' ? matched.title : '',
    question: typeof matched.question === 'string' ? matched.question : '',
  }
}

const requestChatDirect = async (question) => {
  if (!API_BASE_URL) {
    throw new Error(DEFAULT_ERROR_MESSAGE)
  }

  let response

  try {
    response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_SECRET,
      },
      body: JSON.stringify({
        question,
      }),
    })
  } catch {
    throw new Error(DEFAULT_ERROR_MESSAGE)
  }

  let data = null

  try {
    data = await response.json()
  } catch {
    throw new Error(DEFAULT_ERROR_MESSAGE)
  }

  if (!response.ok || !data || typeof data.answer !== 'string') {
    throw new Error(DEFAULT_ERROR_MESSAGE)
  }

  return {
    answer: data.answer,
    source: typeof data.source === 'string' ? data.source : data.matched ? 'knowledge' : 'ai_fallback',
    matched: normalizeMatched(data.matched),
  }
}

const requestChat = async (question) => {
  try {
    const result = await postChat(question)

    return {
      answer: result.answer,
      source: result.matched ? 'knowledge' : 'ai_fallback',
      matched: normalizeMatched(result.matched),
    }
  } catch (error) {
    if (error instanceof Error && error.message === POST_CHAT_ERROR_MESSAGE) {
      return requestChatDirect(question)
    }

    throw error
  }
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [],
    loading: false,
    error: null,
  }),

  actions: {
    async sendQuestion(question) {
      const normalizedQuestion = typeof question === 'string' ? question.trim() : ''

      if (!normalizedQuestion || this.loading) {
        return
      }

      this.error = null
      this.loading = true
      this.messages.push(createMessage('user', normalizedQuestion))

      try {
        const result = await requestChat(normalizedQuestion)

        this.messages.push(
          createMessage('assistant', result.answer, {
            source: result.source,
            matched: result.matched,
          }),
        )
      } catch (error) {
        console.error(error)
        this.error = DEFAULT_ERROR_MESSAGE
      } finally {
        this.loading = false
      }
    },

    clearMessages() {
      this.messages = []
      this.loading = false
      this.error = null
    },
  },
})
