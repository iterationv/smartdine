import { defineStore } from 'pinia'
import { getLogStats, getMissedQuestions, updateMissedQuestion } from '../api/logs'

// 跨页面共享状态走 store；页面局部 UI 状态（如筛选器临时交互）留在组件内处理。
export const useLogStore = defineStore('log', {
  state: () => ({
    missedList: [],
    missedTotal: 0,
    loading: false,
    statsLoading: false,
    statsRange: '7d',
    topQuestions: [],
    totalQuestions: 0,
    hitCount: 0,
    missedCount: 0,
    hitRate: 0,
    trend: [],
    trendGranularity: 'day',
    filters: {
      keyword: '',
      dateRange: [],
      handledStatus: 'all',
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
          handled:
            this.filters.handledStatus === 'handled'
              ? true
              : this.filters.handledStatus === 'unhandled'
                ? false
                : undefined,
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
        this.totalQuestions = result.totalQuestions
        this.hitCount = result.hitCount
        this.missedCount = result.missedCount
        this.hitRate = result.hitRate
        this.trend = result.trend
        this.trendGranularity = result.granularity

        return result
      } finally {
        this.statsLoading = false
      }
    },

    async updateMissedStatus(id, payload) {
      const item = await updateMissedQuestion(id, payload)
      await this.fetchMissed()
      return item
    },
  },
})
