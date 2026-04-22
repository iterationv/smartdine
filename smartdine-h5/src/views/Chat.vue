<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import InputBar from '../components/InputBar.vue'
import MessageList from '../components/MessageList.vue'
import CategoryTab from '../components/CategoryTab.vue'
import { useChatStore } from '../stores/chatStore'
import { useSuggestStore } from '../stores/suggestStore'

const restaurantName = import.meta.env.VITE_RESTAURANT_NAME || 'SmartDine 餐厅'
const restaurantLogo = import.meta.env.VITE_RESTAURANT_LOGO || ''
const placeholder = '试着问：今天有什么好吃的？'

const chatStore = useChatStore()
const suggestStore = useSuggestStore()
const { messages, loading, error } = storeToRefs(chatStore)
const { suggestions, categories, activeCategory } = storeToRefs(suggestStore)

const logoPlaceholder = computed(() => {
  const name = restaurantName.trim()
  return name ? name.slice(0, 2).toUpperCase() : 'SD'
})

const hasMessages = computed(() => messages.value.length > 0)
const showConversation = computed(() => hasMessages.value || loading.value || Boolean(error.value))

const handleSend = (question) => {
  chatStore.sendQuestion(question)
}

const handleSuggestionClick = (question) => {
  chatStore.sendQuestion(question)
}

const handleCategoryChange = (category) => {
  suggestStore.setActiveCategory(category)
}

onMounted(() => {
  suggestStore.fetchSuggestions()
})
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

    <section v-if="!showConversation" class="chat-empty">
      <div class="welcome-card">
        <p class="welcome-tag">今日推荐问法</p>
        <h2>从这里开始提问</h2>
        <p class="welcome-copy">
          可以先问菜品、套餐、营业时间或饮食偏好，首页会优先展示常见问题入口。
        </p>
      </div>

      <div class="suggest-section">
        <p class="suggest-title">推荐问题</p>

        <CategoryTab
          :categories="categories"
          :active-category="activeCategory"
          @change="handleCategoryChange"
        />

        <div v-if="suggestions.length > 0" class="suggest-grid">
          <button
            v-for="s in suggestions"
            :key="s.question"
            type="button"
            class="suggest-card"
            :disabled="loading"
            @click="handleSuggestionClick(s.question)"
          >
            {{ s.question }}
          </button>
        </div>
        <p v-else class="suggest-empty">该分类暂无推荐问题</p>
      </div>
    </section>

    <MessageList
      v-else
      :messages="messages"
      :loading="loading"
      :error="error || ''"
      @suggest="handleSuggestionClick"
    />

    <InputBar :loading="loading" :placeholder="placeholder" @send="handleSend" />
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

.chat-empty {
  flex: 1;
  min-height: 0;
  padding: 20px 16px 12px;
  overflow-y: auto;
}

.welcome-card {
  padding: 18px;
  border-radius: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #eef4ff 100%);
  border: 1px solid #d6e1f4;
  box-shadow: 0 14px 30px rgba(37, 80, 168, 0.08);
}

.welcome-tag {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #2f6fed;
}

.welcome-card h2 {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.welcome-copy {
  margin-top: 10px;
  font-size: 14px;
  line-height: 1.7;
  color: #5b6472;
}

.suggest-section {
  margin-top: 20px;
}

.suggest-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.suggest-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.suggest-card {
  min-height: 68px;
  padding: 14px 16px;
  border: 1px solid #d8e2f1;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.96);
  text-align: left;
  font-size: 14px;
  line-height: 1.5;
  color: #1f2937;
  cursor: pointer;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.05);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.suggest-card:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: #b7caea;
  box-shadow: 0 16px 26px rgba(15, 23, 42, 0.08);
}

.suggest-card:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.suggest-empty {
  margin-top: 16px;
  padding: 20px;
  text-align: center;
  font-size: 14px;
  color: #94a3b8;
  border: 1px dashed #d0d9e8;
  border-radius: 16px;
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

  .chat-empty {
    padding: 16px 14px 10px;
  }

  .welcome-card {
    padding: 16px;
    border-radius: 20px;
  }

  .welcome-card h2 {
    font-size: 22px;
  }

  .welcome-copy {
    font-size: 13px;
  }

  .suggest-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .suggest-card {
    min-height: 60px;
    padding: 12px 14px;
    font-size: 13px;
  }
}
</style>
