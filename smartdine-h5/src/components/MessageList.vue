<script setup>
import { nextTick, ref, watch } from 'vue'

const props = defineProps({
  messages: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['suggest'])

const listRef = ref(null)
const toastVisible = ref(false)
let toastTimer = null

const scrollToBottom = () => {
  if (!listRef.value) {
    return
  }

  listRef.value.scrollTop = listRef.value.scrollHeight
}

const getSourceLabel = (source) => {
  if (source === 'knowledge' || source === 'faq') {
    return '✓ 来自知识库'
  }

  if (source === 'ai_fallback') {
    return '⚡ AI 回答'
  }

  return ''
}

const isMissedAnswer = (message) => {
  return message.source === 'ai_fallback' && message.matched === null
}

const hasRelated = (message) => {
  return (
    message.source !== 'ai_fallback' &&
    Array.isArray(message.related) &&
    message.related.length > 0
  )
}

const hasCta = (message) => {
  return message.source !== 'ai_fallback' && message.matched != null
}

const showToast = () => {
  if (toastVisible.value) return
  toastVisible.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, 2000)
}

watch(
  () => [props.messages.length, props.loading, props.error],
  async () => {
    await nextTick()
    scrollToBottom()
  },
  { immediate: true },
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
      <div
        v-if="message.role === 'user'"
        class="message-bubble message-bubble--user"
      >
        {{ message.content }}
      </div>
      <div v-else class="assistant-card">
        <div v-if="isMissedAnswer(message)" class="assistant-alert">
          未找到精确答案，以下仅供参考
        </div>
        <p class="assistant-content">{{ message.content }}</p>
        <div v-if="getSourceLabel(message.source)" class="assistant-footer">
          <span class="assistant-tag" :class="message.source === 'ai_fallback' ? 'assistant-tag--ai' : 'assistant-tag--knowledge'">
            {{ getSourceLabel(message.source) }}
          </span>
        </div>

        <div v-if="hasRelated(message)" class="assistant-related">
          <p class="assistant-related-title">相关问题</p>
          <div class="assistant-related-list">
            <button
              v-for="q in message.related"
              :key="q"
              type="button"
              class="assistant-related-btn"
              @click="emit('suggest', q)"
            >
              {{ q }}
            </button>
          </div>
        </div>

        <div v-if="hasCta(message)" class="assistant-cta">
          <button type="button" class="cta-btn" @click="showToast">
            查看详情
          </button>
        </div>
      </div>
    </article>

    <article v-if="loading" class="message-row message-row--assistant">
      <div class="assistant-card assistant-card--loading">
        <p class="assistant-content">正在思考中...</p>
      </div>
    </article>

    <article v-if="error" class="message-row message-row--assistant">
      <div class="assistant-card assistant-card--error">
        <p class="assistant-content">{{ error }}</p>
      </div>
    </article>
  </section>

  <Transition name="toast">
    <div v-if="toastVisible" class="toast" role="status" aria-live="polite">
      即将上线
    </div>
  </Transition>
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
}

.message-row--assistant {
  align-items: flex-start;
}

.message-row--user {
  align-items: flex-end;
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

.assistant-card {
  width: min(100%, 560px);
  padding: 14px 16px;
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid #dde5f0;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
}

.assistant-card--loading {
  background: #fffaf0;
  border-color: #f5dfab;
}

.assistant-card--error {
  background: #fff3f2;
  border-color: #f3c1c1;
}

.assistant-alert {
  margin: -2px -4px 12px;
  padding: 8px 10px;
  border-radius: 12px;
  background: #fff4e6;
  border: 1px solid #f6c78b;
  font-size: 12px;
  line-height: 1.5;
  color: #a85b00;
}

.assistant-content {
  font-size: 14px;
  line-height: 1.7;
  color: #1f2937;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.assistant-footer {
  margin-top: 12px;
}

.assistant-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}

.assistant-tag--knowledge {
  background: #e7f6ec;
  color: #1f7a45;
}

.assistant-tag--ai {
  background: #edf3ff;
  color: #2550a8;
}

/* ── 相关问题 ── */
.assistant-related {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #eaeef5;
}

.assistant-related-title {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
}

.assistant-related-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.assistant-related-btn {
  width: 100%;
  padding: 8px 12px;
  text-align: left;
  font-size: 13px;
  line-height: 1.5;
  color: #2f6fed;
  background: #f0f5ff;
  border: 1px solid #d6e4ff;
  border-radius: 10px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.assistant-related-btn:hover {
  background: #e0ecff;
  border-color: #b3d0ff;
}

/* ── CTA ── */
.assistant-cta {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.cta-btn {
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #2f6fed;
  background: transparent;
  border: 1px solid #2f6fed;
  border-radius: 999px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.cta-btn:hover {
  background: #2f6fed;
  color: #ffffff;
}

/* ── Toast ── */
.toast {
  position: fixed;
  bottom: 88px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 40, 60, 0.85);
  color: #ffffff;
  padding: 8px 22px;
  border-radius: 999px;
  font-size: 13px;
  pointer-events: none;
  z-index: 200;
  white-space: nowrap;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(6px);
}

/* ── 移动端 ── */
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

  .assistant-card {
    padding: 13px 14px;
    border-radius: 18px;
  }

  .assistant-content {
    font-size: 13px;
  }

  .assistant-related-btn {
    font-size: 12px;
    padding: 7px 11px;
  }

  .cta-btn {
    font-size: 12px;
    padding: 5px 14px;
  }
}
</style>
