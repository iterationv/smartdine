import { defineStore } from 'pinia'
import { getSuggestions } from '../api/chat'

// 接口失败时的硬编码兜底列表
const FALLBACK_SUGGESTIONS = [
  { question: '今天有什么菜？', category: '推荐' },
  { question: '有适合素食者的菜吗？', category: '菜品' },
  { question: '今天的套餐是什么？', category: '推荐' },
  { question: '有没有低卡的选择？', category: '菜品' },
  { question: '营业时间是几点？', category: '营业时间' },
]

const ALL_CATEGORY = '全部'

export const useSuggestStore = defineStore('suggest', {
  state: () => ({
    allSuggestions: [...FALLBACK_SUGGESTIONS],
    activeCategory: ALL_CATEGORY,
    loading: false,
  }),

  getters: {
    categories: (state) => {
      const cats = [...new Set(state.allSuggestions.map((s) => s.category))]
      return [ALL_CATEGORY, ...cats]
    },

    suggestions: (state) => {
      if (state.activeCategory === ALL_CATEGORY) {
        return state.allSuggestions
      }
      return state.allSuggestions.filter((s) => s.category === state.activeCategory)
    },
  },

  actions: {
    async fetchSuggestions() {
      this.loading = true
      try {
        const items = await getSuggestions()
        if (Array.isArray(items) && items.length > 0) {
          this.allSuggestions = items
        }
      } catch {
        // 接口失败静默降级，保留兜底列表
      } finally {
        this.loading = false
      }
    },

    setActiveCategory(category) {
      this.activeCategory = category
    },
  },
})
