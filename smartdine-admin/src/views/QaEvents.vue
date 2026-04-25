<script setup>
import { computed, onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { getQaEvents } from '../api/qaEvents'

const CONFIDENCE_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: 'high', value: 'high' },
  { label: 'low', value: 'low' },
  { label: 'ambiguous', value: 'ambiguous' },
  { label: 'unknown_entity', value: 'unknown_entity' },
]
const LIMIT_OPTIONS = [20, 50, 100]
const CONFIDENCE_COLOR_MAP = {
  high: 'green',
  low: 'orange',
  ambiguous: 'blue',
  unknown_entity: 'red',
}

const loading = ref(false)
const pageError = ref('')
const list = ref([])
const total = ref(0)
const confidence = ref('all')
const limit = ref(20)

const columns = [
  {
    title: '时间',
    dataIndex: 'timestamp',
    key: 'timestamp',
    width: 190,
  },
  {
    title: '用户问题',
    dataIndex: 'query',
    key: 'query',
    width: 320,
  },
  {
    title: '置信度',
    dataIndex: 'confidence',
    key: 'confidence',
    width: 150,
  },
  {
    title: '兜底原因',
    dataIndex: 'fallbackReason',
    key: 'fallbackReason',
    width: 210,
  },
  {
    title: '命中知识 ID',
    dataIndex: 'topMatchId',
    key: 'topMatchId',
    width: 140,
  },
  {
    title: '命中分数',
    dataIndex: 'topScore',
    key: 'topScore',
    width: 120,
  },
  {
    title: '耗时',
    dataIndex: 'duration',
    key: 'duration',
    width: 100,
  },
]

const requestParams = computed(() => ({
  limit: limit.value,
  confidence: confidence.value === 'all' ? undefined : confidence.value,
}))

const formatDateTime = (value) => {
  if (!Number.isFinite(value) || value <= 0) {
    return '-'
  }

  return new Date(value).toLocaleString('zh-CN', {
    hour12: false,
  })
}

const formatScore = (value) => {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00'
}

const truncateText = (value, maxLength = 42) => {
  if (typeof value !== 'string' || !value) {
    return '-'
  }

  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
}

const loadQaEvents = async () => {
  loading.value = true
  pageError.value = ''

  try {
    const result = await getQaEvents(requestParams.value)

    list.value = result.list
    total.value = result.total
  } catch (error) {
    const nextMessage =
      error instanceof Error && error.message
        ? error.message
        : '问答日志加载失败，请稍后重试。'

    list.value = []
    total.value = 0
    pageError.value = nextMessage
    message.error(nextMessage)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadQaEvents()
})

const handleConfidenceChange = async () => {
  await loadQaEvents()
}

const handleLimitChange = async () => {
  await loadQaEvents()
}
</script>

<template>
  <a-card class="page-card qa-events-page-card" title="问答日志">
    <a-space class="page-actions page-actions--top qa-events-toolbar" wrap>
      <a-select
        v-model:value="confidence"
        style="width: 190px"
        @change="handleConfidenceChange"
      >
        <a-select-option
          v-for="option in CONFIDENCE_OPTIONS"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </a-select-option>
      </a-select>

      <a-select
        v-model:value="limit"
        style="width: 120px"
        @change="handleLimitChange"
      >
        <a-select-option
          v-for="option in LIMIT_OPTIONS"
          :key="option"
          :value="option"
        >
          {{ option }}
        </a-select-option>
      </a-select>

      <a-button :loading="loading" @click="loadQaEvents">刷新</a-button>
      <a-typography-text type="secondary">共 {{ total }} 条</a-typography-text>
    </a-space>

    <a-alert
      v-if="pageError"
      class="qa-events-feedback"
      type="error"
      show-icon
      :message="pageError"
    />

    <a-table
      row-key="requestId"
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      :scroll="{ x: 1230 }"
      :locale="{ emptyText: '暂无问答日志' }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'timestamp'">
          {{ formatDateTime(record.timestamp) }}
        </template>

        <template v-else-if="column.key === 'query'">
          <span class="qa-query" :title="record.query">
            {{ truncateText(record.query) }}
          </span>
        </template>

        <template v-else-if="column.key === 'confidence'">
          <a-tag :color="CONFIDENCE_COLOR_MAP[record.confidence] || 'default'">
            {{ record.confidence }}
          </a-tag>
        </template>

        <template v-else-if="column.key === 'fallbackReason'">
          {{ record.fallbackReason || '-' }}
        </template>

        <template v-else-if="column.key === 'topMatchId'">
          {{ record.topMatchId || '-' }}
        </template>

        <template v-else-if="column.key === 'topScore'">
          {{ formatScore(record.topScore) }}
        </template>

        <template v-else-if="column.key === 'duration'">
          {{ record.duration }} ms
        </template>
      </template>
    </a-table>
  </a-card>
</template>

<style scoped>
.qa-events-page-card {
  max-width: 1240px;
}

.qa-events-toolbar {
  align-items: center;
}

.qa-events-feedback {
  margin-bottom: 16px;
}

.qa-query {
  display: inline-block;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: bottom;
  white-space: nowrap;
}
</style>
