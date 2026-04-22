<script setup>
defineProps({
  categories: {
    type: Array,
    default: () => [],
  },
  activeCategory: {
    type: String,
    default: '全部',
  },
})

const emit = defineEmits(['change'])
</script>

<template>
  <div class="category-tab" role="tablist" aria-label="问题分类">
    <button
      v-for="cat in categories"
      :key="cat"
      role="tab"
      type="button"
      class="tab-btn"
      :class="{ 'tab-btn--active': cat === activeCategory }"
      :aria-selected="cat === activeCategory"
      @click="emit('change', cat)"
    >
      {{ cat }}
    </button>
  </div>
</template>

<style scoped>
.category-tab {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  margin-bottom: 4px;
}

.tab-btn {
  padding: 6px 14px;
  border: 1px solid #d0dbeb;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  color: #4b5563;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  border-color: #a8bbd8;
  background: #f0f5ff;
  color: #2f6fed;
}

.tab-btn--active {
  background: #2f6fed;
  border-color: #2f6fed;
  color: #ffffff;
  font-weight: 600;
}

.tab-btn--active:hover {
  background: #2562d8;
  border-color: #2562d8;
  color: #ffffff;
}

@media (max-width: 480px) {
  .tab-btn {
    padding: 5px 12px;
    font-size: 12px;
  }
}
</style>
