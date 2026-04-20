import { defineStore } from 'pinia'
import {
  createKnowledgeItem,
  deleteKnowledgeItem,
  getKnowledgeList,
  toggleKnowledgeStatus as requestToggleKnowledgeStatus,
  updateKnowledgeItem,
} from '../api/knowledge'

// 跨页面共享状态走 store；页面局部 UI 状态（如 modal 开关、表单临时值）留在组件内处理。
const sortByUpdatedAtDesc = (items) => {
  return [...items].sort((left, right) => {
    const rightTime = Date.parse(right.updatedAt || right.createdAt || '')
    const leftTime = Date.parse(left.updatedAt || left.createdAt || '')

    return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime)
  })
}

export const useKnowledgeStore = defineStore('knowledge', {
  state: () => ({
    list: [],
    total: 0,
    loading: false,
    filters: {
      keyword: '',
      status: 'all',
      tag: '',
    },
    currentPage: 1,
    pageSize: 10,
  }),

  actions: {
    async fetchList() {
      this.loading = true

      try {
        const items = await getKnowledgeList(this.filters)
        const sortedItems = sortByUpdatedAtDesc(items)

        this.list = sortedItems
        this.total = sortedItems.length

        const maxPage = Math.max(1, Math.ceil(this.total / this.pageSize))

        if (this.currentPage > maxPage) {
          this.currentPage = maxPage
        }

        return sortedItems
      } finally {
        this.loading = false
      }
    },

    async createItem(data) {
      const item = await createKnowledgeItem(data)
      await this.fetchList()
      this.currentPage = 1
      return item
    },

    async updateItem(id, data) {
      const item = await updateKnowledgeItem(id, data)
      await this.fetchList()
      return item
    },

    async toggleStatus(id, status) {
      const item = await requestToggleKnowledgeStatus(id, status)
      await this.fetchList()
      return item
    },

    async deleteItem(id) {
      const result = await deleteKnowledgeItem(id)
      await this.fetchList()
      return result
    },
  },
})
