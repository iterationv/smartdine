<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { message } from 'ant-design-vue'
import { useLogStore } from '../stores/logStore'

const logStore = useLogStore()
const { statsLoading, statsRange, topQuestions, missedCount } = storeToRefs(logStore)

const pageError = ref('')

const rangeOptions = [
  { label: '今天', value: 'today' },
  { label: '最近7天', value: '7d' },
  { label: '最近30天', value: '30d' },
]

const rangeLabelMap = {
  today: '今天',
  '7d': '最近7天',
  '30d': '最近30天',
}

const currentRangeLabel = computed(() => {
  return rangeLabelMap[statsRange.value] || '最近7天'
})

const hasTopQuestions = computed(() => topQuestions.value.length > 0)

const loadStats = async (range = statsRange.value) => {
  pageError.value = ''

  try {
    await logStore.fetchStats(range)
  } catch (error) {
    pageError.value =
      error instanceof Error && error.message
        ? error.message
        : '统计数据加载失败，请稍后重试。'
    message.error(pageError.value)
  }
}

onMounted(() => {
  loadStats()
})

const handleRangeChange = async (event) => {
  await loadStats(event.target.value)
}
</script>

<template>
  <a-card class="page-card dashboard-page-card" title="热门问题统计">
    <a-typography-paragraph class="dashboard-copy" type="secondary">
      基于已记录的问题日志聚合展示当前高频问题，并统计所选时间范围内的未命中问题数量。
    </a-typography-paragraph>

    <a-space class="page-actions page-actions--top dashboard-toolbar" wrap>
      <a-radio-group :value="statsRange" @change="handleRangeChange">
        <a-radio-button
          v-for="option in rangeOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </a-radio-button>
      </a-radio-group>
      <a-button :loading="statsLoading" @click="loadStats()">刷新</a-button>
    </a-space>

    <a-alert
      v-if="pageError"
      class="dashboard-feedback"
      type="error"
      show-icon
      :message="pageError"
    />

    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :lg="8">
        <a-card class="dashboard-stat-card" :loading="statsLoading">
          <a-statistic title="未命中问题数量" :value="missedCount" />
          <a-typography-paragraph class="dashboard-stat-copy" type="secondary">
            统计范围：{{ currentRangeLabel }}
          </a-typography-paragraph>
        </a-card>
      </a-col>

      <a-col :xs="24" :lg="16">
        <a-card class="dashboard-list-card" title="热门问题 Top 10" :loading="statsLoading">
          <a-empty v-if="!hasTopQuestions" description="暂无统计数据" />
          <div v-else class="dashboard-question-list">
            <div
              v-for="(item, index) in topQuestions"
              :key="`${item.question}-${index}`"
              class="dashboard-question-item"
            >
              <div class="dashboard-question-meta">
                <span class="dashboard-question-rank">{{ index + 1 }}</span>
                <span class="dashboard-question-text">{{ item.question }}</span>
              </div>
              <a-tag color="blue">{{ item.count }} 次</a-tag>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </a-card>
</template>

<style scoped>
.dashboard-page-card {
  max-width: 1180px;
}

.dashboard-copy {
  margin-bottom: 12px;
}

.dashboard-toolbar {
  justify-content: space-between;
}

.dashboard-feedback {
  margin-bottom: 16px;
}

.dashboard-stat-card,
.dashboard-list-card {
  height: 100%;
}

.dashboard-stat-copy {
  margin-top: 12px;
  margin-bottom: 0;
}

.dashboard-question-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dashboard-question-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 14px;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  background: #fafafa;
}

.dashboard-question-meta {
  display: flex;
  gap: 12px;
  min-width: 0;
}

.dashboard-question-rank {
  min-width: 24px;
  height: 24px;
  border-radius: 999px;
  background: #e6f4ff;
  color: #1677ff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.dashboard-question-text {
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.88);
  word-break: break-word;
}
</style>
