import { defineStore } from 'pinia'

// 推荐问题在 P0 阶段先使用硬编码，后续再切换为接口返回。
export const useSuggestStore = defineStore('suggest', {
  state: () => ({
    suggestions: [
      '今天有什么菜？',
      '有适合素食者的菜吗？',
      '今天的套餐是什么？',
      '有没有低卡的选择？',
      '营业时间是几点？',
    ],
  }),
})
