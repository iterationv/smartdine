<script setup>
import { computed, ref } from 'vue'
import { postChat } from '../api/chat'
import InputBar from '../components/InputBar.vue'
import MessageList from '../components/MessageList.vue'

const restaurantName = import.meta.env.VITE_RESTAURANT_NAME || 'SmartDine 餐厅'
const restaurantLogo = import.meta.env.VITE_RESTAURANT_LOGO || ''
const DEFAULT_ERROR_MESSAGE = '当前服务暂不可用，请稍后再试。'

const logoPlaceholder = computed(() => {
  const name = restaurantName.trim()
  return name ? name.slice(0, 2).toUpperCase() : 'SD'
})

const initialMessages = [
  {
    id: 'msg_001',
    role: 'assistant',
    content: `你好，欢迎来到${restaurantName}。你可以先问我营业时间、推荐菜品或用餐服务相关问题。`,
    status: 'done',
    matched: null,
    source: 'welcome',
  },
]

const messages = ref([...initialMessages])
let messageSeed = initialMessages.length

const createMessage = (role, content, status = 'done', matched = null, source = null) => {
  messageSeed += 1

  return {
    id: `msg_${String(messageSeed).padStart(3, '0')}`,
    role,
    content,
    status,
    matched,
    source,
  }
}

const updateMessage = (messageId, patch) => {
  const targetIndex = messages.value.findIndex((message) => message.id === messageId)

  if (targetIndex === -1) {
    return
  }

  messages.value[targetIndex] = {
    ...messages.value[targetIndex],
    ...patch,
  }
}

const handleSend = async (content) => {
  const question = content.trim()

  if (!question) {
    return
  }

  messages.value.push(createMessage('user', question))

  const pendingMessage = createMessage(
    'assistant',
    '正在为你整理答案，请稍候...',
    'loading',
    null,
  )

  messages.value.push(pendingMessage)

  try {
    const result = await postChat(question)

    updateMessage(pendingMessage.id, {
      content: result.answer,
      status: 'done',
      matched: result.matched,
      source: result.matched ? 'faq' : 'ai',
    })
  } catch (error) {
    updateMessage(pendingMessage.id, {
      content:
        error instanceof Error && error.message && error.message !== 'question is required'
          ? error.message
          : DEFAULT_ERROR_MESSAGE,
      status: 'error',
      matched: null,
      source: 'error',
    })
  }
}
</script>

<template>
  <main class="chat-page">
    <header class="chat-header">
      <div class="brand-block">
        <div class="brand-logo" :class="{ 'brand-logo--placeholder': !restaurantLogo }">
          <img v-if="restaurantLogo" :src="restaurantLogo" :alt="`${restaurantName} logo`" />
          <span v-else>{{ logoPlaceholder }}</span>
        </div>
        <div class="brand-copy">
          <p class="brand-tag">SmartDine 顾客问答</p>
          <h1>{{ restaurantName }}</h1>
        </div>
      </div>
      <p class="brand-hint">扫码即可提问，支持菜品、营业时间和用餐服务咨询。</p>
    </header>

    <MessageList :messages="messages" />

    <InputBar @send="handleSend" />
  </main>
</template>

<style scoped>
.chat-page {
  min-height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f5f7fb 0%, #eef2f8 100%);
  color: #1f2937;
  overflow: hidden;
}

.chat-header {
  flex-shrink: 0;
  padding: calc(18px + env(safe-area-inset-top)) 16px 14px;
  border-bottom: 1px solid #dbe3ef;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(8px);
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  overflow: hidden;
  background: #e5edf8;
  border: 1px solid #d0dbeb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.brand-logo--placeholder span {
  color: #355070;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.brand-copy {
  min-width: 0;
}

.brand-tag {
  margin-bottom: 2px;
  font-size: 12px;
  color: #64748b;
}

.brand-copy h1 {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  color: #111827;
  word-break: break-word;
}

.brand-hint {
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.5;
  color: #6b7280;
}

@media (max-width: 480px) {
  .chat-header {
    padding: calc(16px + env(safe-area-inset-top)) 14px 12px;
  }

  .brand-block {
    gap: 10px;
  }

  .brand-logo {
    width: 42px;
    height: 42px;
  }

  .brand-copy h1 {
    font-size: 16px;
  }

  .brand-hint {
    margin-top: 8px;
    font-size: 12px;
  }
}
</style>
