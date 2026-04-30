<script setup>
import { computed, onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { QA_EVENT_CONFIDENCE_VALUES, getQaEvents } from '../api/qaEvents'

const CONFIDENCE_OPTIONS = [
  { label: 'high', value: 'high' },
  { label: 'low', value: 'low' },
  { label: 'ambiguous', value: 'ambiguous' },
  { label: 'unknown_entity', value: 'unknown_entity' },
]
const DATE_PRESET_OPTIONS = [
  { label: '今天', value: 'today' },
  { label: '昨天', value: 'yesterday' },
  { label: '最近 3 天', value: 'last3' },
  { label: '自定义', value: 'custom' },
]
const PAGE_SIZE_OPTIONS = [20, 50, 100]
const CONFIDENCE_COLOR_MAP = {
  high: 'green',
  low: 'orange',
  ambiguous: 'blue',
  unknown_entity: 'red',
}
const DAY_IN_MS = 24 * 60 * 60 * 1000
const MAX_RANGE_DAYS = 7

const loading = ref(false)
const pageError = ref('')
const list = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const datePreset = ref('today')
const customDateRange = ref([])
const selectedConfidence = ref([...QA_EVENT_CONFIDENCE_VALUES])

const columns = [
  {
    title: '时间',
    dataIndex: 'timestamp',
    key: 'timestamp',
    width: 190,
  },
  {
    title: '用户问题',
    dataIndex: 'queryDigest',
    key: 'queryDigest',
    width: 320,
  },
  {
    title: '查询长度',
    dataIndex: 'queryLength',
    key: 'queryLength',
    width: 100,
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

const formatDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const parseDateKey = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const timestamp = Date.parse(`${value}T00:00:00`)

  if (Number.isNaN(timestamp)) {
    return null
  }

  return new Date(timestamp)
}

const shiftDate = (date, offsetDays) => {
  return new Date(date.getTime() + offsetDays * DAY_IN_MS)
}

const getPresetDateRange = (preset) => {
  const today = new Date()
  const todayKey = formatDateKey(today)

  if (preset === 'yesterday') {
    const yesterday = formatDateKey(shiftDate(today, -1))
    return [yesterday, yesterday]
  }

  if (preset === 'last3') {
    return [formatDateKey(shiftDate(today, -2)), todayKey]
  }

  return [todayKey, todayKey]
}

const buildDateKeys = (startDateKey, endDateKey) => {
  const startDate = parseDateKey(startDateKey)
  const endDate = parseDateKey(endDateKey)

  if (!startDate || !endDate || startDate.getTime() > endDate.getTime()) {
    return []
  }

  const keys = []

  for (let cursor = startDate; cursor.getTime() <= endDate.getTime(); cursor = shiftDate(cursor, 1)) {
    keys.push(formatDateKey(cursor))
  }

  return keys
}

const getDayCount = (startDateKey, endDateKey) => {
  const dateKeys = buildDateKeys(startDateKey, endDateKey)
  return dateKeys.length
}

const normalizeConfidenceSelection = (value) => {
  if (!Array.isArray(value)) {
    return []
  }

  return [...new Set(value.filter((item) => QA_EVENT_CONFIDENCE_VALUES.includes(item)))]
}

const activeConfidenceFilters = computed(() => {
  const values = normalizeConfidenceSelection(selectedConfidence.value)

  return values.length === 0 || values.length === QA_EVENT_CONFIDENCE_VALUES.length
    ? []
    : values
})

const selectedDateRange = computed(() => {
  if (datePreset.value === 'custom') {
    if (customDateRange.value.length !== 2) {
      return []
    }

    return [customDateRange.value[0], customDateRange.value[1]]
  }

  return getPresetDateRange(datePreset.value)
})

const selectedDateKeys = computed(() => {
  if (selectedDateRange.value.length !== 2) {
    return []
  }

  return buildDateKeys(selectedDateRange.value[0], selectedDateRange.value[1])
})

const isSingleDayQuery = computed(() => selectedDateKeys.value.length <= 1)

const totalPages = computed(() => {
  if (total.value <= 0) {
    return 0
  }

  return Math.ceil(total.value / pageSize.value)
})

const dateRangeSummary = computed(() => {
  if (selectedDateRange.value.length !== 2) {
    return '请选择日期范围'
  }

  const [startDateKey, endDateKey] = selectedDateRange.value

  return startDateKey === endDateKey ? startDateKey : `${startDateKey} 至 ${endDateKey}`
})

const formatDateTime = (value) => {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    return '-'
  }

  return new Date(value).toLocaleString('zh-CN', {
    hour12: false,
  })
}

const formatScore = (value) => {
  return Number.isFinite(value) ? value.toFixed(2) : '-'
}

const truncateText = (value, maxLength = 42) => {
  if (typeof value !== 'string' || !value) {
    return '-'
  }

  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
}

const sortByTimestampDesc = (left, right) => {
  return new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
}

const fetchAllEventsForDate = async (dateKey, confidenceFilters) => {
  const mergedItems = []
  let page = 1
  let totalItems = 0

  while (true) {
    const result = await getQaEvents({
      date: dateKey,
      page,
      limit: 100,
      confidence: confidenceFilters,
    })

    if (page === 1) {
      totalItems = result.total
    }

    if (!Array.isArray(result.items) || result.items.length === 0) {
      break
    }

    mergedItems.push(...result.items)

    if (mergedItems.length >= totalItems || result.items.length < result.limit) {
      break
    }

    page += 1
  }

  return mergedItems
}

const loadQaEvents = async () => {
  if (selectedDateRange.value.length !== 2) {
    return
  }

  if (selectedDateKeys.value.length === 0) {
    list.value = []
    total.value = 0
    return
  }

  loading.value = true
  pageError.value = ''

  try {
    if (isSingleDayQuery.value) {
      const result = await getQaEvents({
        date: selectedDateKeys.value[0],
        page: currentPage.value,
        limit: pageSize.value,
        confidence: activeConfidenceFilters.value,
      })

      list.value = result.items
      total.value = result.total
      return
    }

    const mergedItems = await Promise.all(
      selectedDateKeys.value.map((dateKey) =>
        fetchAllEventsForDate(dateKey, activeConfidenceFilters.value),
      ),
    )
    const sortedItems = mergedItems.flat().sort(sortByTimestampDesc)
    const startIndex = (currentPage.value - 1) * pageSize.value

    total.value = sortedItems.length
    list.value = sortedItems.slice(startIndex, startIndex + pageSize.value)
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

const resetToFirstPage = () => {
  currentPage.value = 1
}

const handleDatePresetChange = async (event) => {
  datePreset.value = event.target.value

  if (datePreset.value !== 'custom') {
    customDateRange.value = []
    resetToFirstPage()
    await loadQaEvents()
  }
}

const handleCustomRangeChange = async () => {
  if (datePreset.value !== 'custom' || customDateRange.value.length !== 2) {
    return
  }

  const [startDateKey, endDateKey] = customDateRange.value
  const dayCount = getDayCount(startDateKey, endDateKey)

  if (dayCount === 0) {
    pageError.value = '请选择有效的日期范围。'
    message.error(pageError.value)
    return
  }

  if (dayCount > MAX_RANGE_DAYS) {
    pageError.value = '自定义日期范围最多支持 7 天。'
    customDateRange.value = []
    message.error(pageError.value)
    return
  }

  resetToFirstPage()
  await loadQaEvents()
}

const handleConfidenceChange = async (values) => {
  selectedConfidence.value = normalizeConfidenceSelection(values)
  resetToFirstPage()
  await loadQaEvents()
}

const handlePageSizeChange = async () => {
  resetToFirstPage()
  await loadQaEvents()
}

const handlePageChange = async (page) => {
  currentPage.value = page
  await loadQaEvents()
}
</script>

<template>
  <a-card class="page-card qa-events-page-card" title="问答日志">
    <a-space class="page-actions page-actions--top qa-events-toolbar" wrap>
      <a-radio-group v-model:value="datePreset" @change="handleDatePresetChange">
        <a-radio-button
          v-for="option in DATE_PRESET_OPTIONS"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </a-radio-button>
      </a-radio-group>

      <a-range-picker
        v-if="datePreset === 'custom'"
        v-model:value="customDateRange"
        value-format="YYYY-MM-DD"
        @change="handleCustomRangeChange"
      />

      <a-checkbox-group
        v-model:value="selectedConfidence"
        :options="CONFIDENCE_OPTIONS"
        @change="handleConfidenceChange"
      />

      <a-select
        v-model:value="pageSize"
        style="width: 120px"
        @change="handlePageSizeChange"
      >
        <a-select-option
          v-for="option in PAGE_SIZE_OPTIONS"
          :key="option"
          :value="option"
        >
          {{ option }} / 页
        </a-select-option>
      </a-select>

      <a-button :loading="loading" @click="loadQaEvents">刷新</a-button>
      <a-typography-text type="secondary">
        {{ dateRangeSummary }} · 第 {{ totalPages === 0 ? 0 : currentPage }} / {{ totalPages }} 页，共 {{ total }} 条
      </a-typography-text>
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
      :scroll="{ x: 1330 }"
      :locale="{ emptyText: '暂无问答日志' }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'timestamp'">
          {{ formatDateTime(record.timestamp) }}
        </template>

        <template v-else-if="column.key === 'queryDigest'">
          <span class="qa-query" :title="record.queryDigest">
            {{ truncateText(record.queryDigest) }}
          </span>
        </template>

        <template v-else-if="column.key === 'queryLength'">
          {{ record.queryLength }}
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

    <div v-if="total > 0" class="qa-events-pagination">
      <a-pagination
        :current="currentPage"
        :page-size="pageSize"
        :total="total"
        :show-size-changer="false"
        @change="handlePageChange"
      />
    </div>
  </a-card>
</template>

<style scoped>
.qa-events-page-card {
  max-width: 1240px;
}

.qa-events-toolbar {
  align-items: center;
  justify-content: space-between;
}

.qa-events-feedback {
  margin-bottom: 16px;
}

.qa-events-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
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
