import { defineStore } from 'pinia'
import { getLogStats, getMissedQuestions } from '../api/logs'

// 跨页面共享状态走 store；页面局部 UI 状态（如筛选器临时交互）留在组件内处理。
export const useLogStore = defineStore('log', {
  state: () => ({
    missedList: [],
    missedTotal: 0,
    loading: false,
    statsLoading: false,
    statsRange: '7d',
    topQuestions: [],
    missedCount: 0,
    filters: {
      keyword: '',
      dateRange: [],
    },
    currentPage: 1,
    pageSize: 20,
  }),

  actions: {
    async fetchMissed() {
      this.loading = true

      try {
        const [startDate, endDate] = Array.isArray(this.filters.dateRange)
          ? this.filters.dateRange
          : []
        const result = await getMissedQuestions({
          page: this.currentPage,
          size: this.pageSize,
          keyword: this.filters.keyword,
          startDate,
          endDate,
        })

        this.missedList = result.list
        this.missedTotal = result.total
        this.currentPage = result.page

        return result
      } finally {
        this.loading = false
      }
    },

    async fetchStats(range) {
      const nextRange =
        range === 'today' || range === '7d' || range === '30d'
          ? range
          : this.statsRange

      this.statsLoading = true
      this.statsRange = nextRange

      try {
        const result = await getLogStats(nextRange)

        this.topQuestions = result.topQuestions
        this.missedCount = result.missedCount

        return result
      } finally {
        this.statsLoading = false
      }
    },
  },
})
