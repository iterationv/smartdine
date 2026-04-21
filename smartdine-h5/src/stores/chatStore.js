import { defineStore } from 'pinia'
import { postChat } from '../api/chat'

// 跨组件共享会话状态走 store；页面局部 UI 状态仍留在组件内处理。
const DEFAULT_ERROR_MESSAGE = '网络异常，请稍后再试'

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
        const result = await postChat(normalizedQuestion)

        this.messages.push(
          createMessage('assistant', result.answer, {
            source: result.source,
            matched: normalizeMatched(result.matched),
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
