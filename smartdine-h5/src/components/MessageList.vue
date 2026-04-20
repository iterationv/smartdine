<script setup>
import { nextTick, ref, watch } from 'vue'

const props = defineProps({
  messages: {
    type: Array,
    default: () => [],
  },
})

const listRef = ref(null)

const scrollToBottom = () => {
  if (!listRef.value) {
    return
  }

  listRef.value.scrollTop = listRef.value.scrollHeight
}

const getAssistantTagMeta = (message) => {
  if (message.status === 'loading') {
    return {
      label: '思考中',
      tone: 'loading',
    }
  }

  if (message.status === 'error') {
    return {
      label: '请求失败',
      tone: 'error',
    }
  }

  if (message.source === 'welcome') {
    return {
      label: '欢迎语',
      tone: 'welcome',
    }
  }

  if (message.matched) {
    return {
      label: 'FAQ回答',
      tone: 'faq',
    }
  }

  return {
    label: 'AI回答',
    tone: 'ai',
  }
}

watch(
  () => props.messages,
  async () => {
    await nextTick()
    scrollToBottom()
  },
  { deep: true, immediate: true },
)
</script>

<template>
  <section ref="listRef" class="message-list" aria-label="消息列表">
    <article
      v-for="message in messages"
      :key="message.id"
      class="message-row"
      :class="message.role === 'user' ? 'message-row--user' : 'message-row--assistant'"
    >
      <div class="message-meta">
        <p class="message-role">{{ message.role === 'user' ? '我' : 'AI' }}</p>
        <span
          v-if="message.role === 'assistant'"
          class="message-tag"
          :class="`message-tag--${getAssistantTagMeta(message).tone}`"
        >
          {{ getAssistantTagMeta(message).label }}
        </span>
      </div>
      <div class="message-bubble" :class="message.role === 'user' ? 'message-bubble--user' : 'message-bubble--assistant'">
        {{ message.content }}
      </div>
    </article>
  </section>
</template>

<style scoped>
.message-list {
  flex: 1;
  min-height: 0;
  padding: 16px 16px 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overscroll-behavior: contain;
}

.message-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.message-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 4px;
}

.message-row--assistant {
  align-items: flex-start;
}

.message-row--user {
  align-items: flex-end;
}

.message-role {
  font-size: 12px;
  color: #64748b;
}

.message-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  line-height: 1.4;
  border: 1px solid transparent;
}

.message-tag--welcome {
  background: #f2f4f7;
  border-color: #dce3eb;
  color: #52606d;
}

.message-tag--faq {
  background: #e7f6ec;
  border-color: #b9e2c7;
  color: #1f7a45;
}

.message-tag--ai {
  background: #e8f0ff;
  border-color: #cfe0ff;
  color: #2550a8;
}

.message-tag--loading {
  background: #fff5db;
  border-color: #f7de98;
  color: #8a5a00;
}

.message-tag--error {
  background: #fdeaea;
  border-color: #f3c1c1;
  color: #b42318;
}

.message-bubble {
  max-width: min(82%, 520px);
  padding: 12px 14px;
  border-radius: 18px;
  line-height: 1.6;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
}

.message-bubble--assistant {
  background: #ffffff;
  color: #1f2937;
  border-bottom-left-radius: 6px;
  border: 1px solid #dde5f0;
}

.message-bubble--user {
  background: #2f6fed;
  color: #ffffff;
  border-bottom-right-radius: 6px;
}

@media (max-width: 480px) {
  .message-list {
    padding: 14px 14px 10px;
    gap: 12px;
  }

  .message-bubble {
    max-width: 88%;
    padding: 11px 13px;
    font-size: 13px;
  }
}
</style>
