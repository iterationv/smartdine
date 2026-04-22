<script setup>
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { useLogStore } from '../stores/logStore'

const router = useRouter()
const logStore = useLogStore()
const { missedList, missedTotal, loading, filters, currentPage, pageSize } = storeToRefs(logStore)

const pageError = ref('')
const datePreset = ref('all')
const customDateRange = ref([])
const actionLoadingId = ref('')

const columns = [
  {
    title: '问题内容',
    dataIndex: 'question',
    key: 'question',
  },
  {
    title: '提问时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 200,
  },
  {
    title: '处理状态',
    dataIndex: 'handled',
    key: 'handled',
    width: 140,
  },
  {
    title: '转知识状态',
    dataIndex: 'convertedToKnowledge',
    key: 'convertedToKnowledge',
    width: 140,
  },
  {
    title: '操作',
    key: 'actions',
    width: 280,
  },
]

const buildDateParam = (dateString, endOfDay = false) => {
  if (typeof dateString !== 'string' || !dateString.trim()) {
    return ''
  }

  const timestamp = Date.parse(
    endOfDay ? `${dateString.trim()}T23:59:59.999` : `${dateString.trim()}T00:00:00.000`,
  )

  return Number.isNaN(timestamp) ? '' : new Date(timestamp).toISOString()
}

const formatDateInput = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const setPresetRange = (preset) => {
  const today = new Date()

  if (preset === 'today') {
    const dateString = formatDateInput(today)
    filters.value.dateRange = [
      buildDateParam(dateString),
      buildDateParam(dateString, true),
    ]
    return
  }

  if (preset === '7d') {
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - 6)

    filters.value.dateRange = [
      buildDateParam(formatDateInput(startDate)),
      buildDateParam(formatDateInput(today), true),
    ]
    return
  }

  filters.value.dateRange = []
}

const formatDateTime = (value) => {
  const timestamp = Date.parse(value)

  if (Number.isNaN(timestamp)) {
    return '-'
  }

  return new Date(timestamp).toLocaleString('zh-CN', {
    hour12: false,
  })
}

const loadMissedQuestions = async () => {
  pageError.value = ''

  try {
    await logStore.fetchMissed()
  } catch (error) {
    pageError.value =
      error instanceof Error && error.message
        ? error.message
        : '未命中问题列表加载失败，请稍后重试。'
    message.error(pageError.value)
  }
}

onMounted(() => {
  loadMissedQuestions()
})

const handleSearch = async () => {
  if (datePreset.value === 'custom') {
    if (customDateRange.value.length === 2) {
      filters.value.dateRange = [
        buildDateParam(customDateRange.value[0]),
        buildDateParam(customDateRange.value[1], true),
      ]
    } else {
      filters.value.dateRange = []
    }
  } else {
    setPresetRange(datePreset.value)
  }

  logStore.currentPage = 1
  await loadMissedQuestions()
}

const handleResetFilters = async () => {
  logStore.filters.keyword = ''
  logStore.filters.dateRange = []
  logStore.filters.handledStatus = 'all'
  logStore.currentPage = 1
  customDateRange.value = []
  datePreset.value = 'all'
  await loadMissedQuestions()
}

const handlePresetChange = async (event) => {
  datePreset.value = event.target.value

  if (datePreset.value !== 'custom') {
    customDateRange.value = []
    await handleSearch()
  }
}

const handleCustomRangeChange = async () => {
  if (datePreset.value !== 'custom') {
    return
  }

  await handleSearch()
}

const handlePageChange = async (page) => {
  logStore.currentPage = page
  await loadMissedQuestions()
}

const handleTransfer = (record) => {
  router.push({
    name: 'knowledge-create',
    query: {
      question: record.question,
      missedId: record.id,
    },
  })
}

const handleToggleHandled = async (record) => {
  if (actionLoadingId.value || !record?.id) {
    return
  }

  actionLoadingId.value = record.id
  pageError.value = ''

  try {
    await logStore.updateMissedStatus(record.id, {
      handled: !record.handled,
    })
    message.success(record.handled ? '已撤销处理状态' : '已标记为处理完成')
  } catch (error) {
    const nextMessage =
      error instanceof Error && error.message
        ? error.message
        : '未命中问题状态更新失败，请稍后重试。'

    pageError.value = nextMessage
    message.error(nextMessage)
  } finally {
    actionLoadingId.value = ''
  }
}
</script>

<template>
  <a-card class="page-card missed-page-card" title="未命中问题">
    <a-space class="page-actions page-actions--top missed-toolbar" wrap>
      <a-input
        v-model:value="filters.keyword"
        style="width: 280px"
        placeholder="搜索未命中问题"
        allow-clear
        @pressEnter="handleSearch"
      />
      <a-radio-group v-model:value="datePreset" @change="handlePresetChange">
        <a-radio-button value="all">全部</a-radio-button>
        <a-radio-button value="today">今天</a-radio-button>
        <a-radio-button value="7d">最近7天</a-radio-button>
        <a-radio-button value="custom">自定义</a-radio-button>
      </a-radio-group>
      <a-select v-model:value="filters.handledStatus" style="width: 150px">
        <a-select-option value="all">全部状态</a-select-option>
        <a-select-option value="unhandled">待处理</a-select-option>
        <a-select-option value="handled">已处理</a-select-option>
      </a-select>
      <a-range-picker
        v-if="datePreset === 'custom'"
        v-model:value="customDateRange"
        value-format="YYYY-MM-DD"
        @change="handleCustomRangeChange"
      />
      <a-button type="primary" @click="handleSearch">查询</a-button>
      <a-button :disabled="loading" @click="handleResetFilters">重置</a-button>
      <a-button :loading="loading" @click="loadMissedQuestions">刷新</a-button>
    </a-space>

    <a-alert
      v-if="pageError"
      class="missed-feedback"
      type="error"
      show-icon
      :message="pageError"
    />

    <a-table
      row-key="id"
      :columns="columns"
      :data-source="missedList"
      :loading="loading"
      :pagination="false"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'question'">
          <a-typography-paragraph class="missed-question">
            {{ record.question || '-' }}
          </a-typography-paragraph>
        </template>

        <template v-else-if="column.key === 'createdAt'">
          {{ formatDateTime(record.createdAt) }}
        </template>

        <template v-else-if="column.key === 'handled'">
          <a-tag :color="record.handled ? 'green' : 'orange'">
            {{ record.handled ? '已处理' : '待处理' }}
          </a-tag>
        </template>

        <template v-else-if="column.key === 'convertedToKnowledge'">
          <a-tag :color="record.convertedToKnowledge ? 'blue' : 'default'">
            {{ record.convertedToKnowledge ? '已转知识' : '未转化' }}
          </a-tag>
        </template>

        <template v-else-if="column.key === 'actions'">
          <a-space wrap>
            <a-button
              type="link"
              class="missed-action-link"
              :disabled="record.convertedToKnowledge"
              @click="handleTransfer(record)"
            >
              {{ record.convertedToKnowledge ? '已转知识条目' : '转为知识条目' }}
            </a-button>
            <a-button
              size="small"
              :loading="actionLoadingId === record.id"
              :disabled="loading || (!!actionLoadingId && actionLoadingId !== record.id)"
              @click="handleToggleHandled(record)"
            >
              {{ record.handled ? '撤销处理' : '标记已处理' }}
            </a-button>
          </a-space>
        </template>
      </template>
    </a-table>

    <div v-if="missedTotal > 0" class="missed-pagination">
      <a-pagination
        :current="currentPage"
        :page-size="pageSize"
        :total="missedTotal"
        :show-size-changer="false"
        @change="handlePageChange"
      />
    </div>
  </a-card>
</template>

<style scoped>
.missed-page-card {
  max-width: 1080px;
}

.missed-toolbar {
  justify-content: space-between;
}

.missed-feedback {
  margin-bottom: 16px;
}

.missed-question {
  margin-bottom: 0;
  white-space: pre-wrap;
}

.missed-action-link {
  padding-inline: 0;
}

.missed-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
