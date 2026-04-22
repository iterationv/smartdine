<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { message } from 'ant-design-vue'
import * as echarts from 'echarts'
import { useLogStore } from '../stores/logStore'

const logStore = useLogStore()
const {
  statsLoading,
  statsRange,
  topQuestions,
  totalQuestions,
  hitCount,
  missedCount,
  hitRate,
  trend,
  trendGranularity,
} = storeToRefs(logStore)

const pageError = ref('')
const volumeChartRef = ref(null)
const outcomeChartRef = ref(null)
let volumeChart = null
let outcomeChart = null

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
const trendLabels = computed(() => trend.value.map((item) => item.label))
const trendDescription = computed(() => {
  return trendGranularity.value === 'hour' ? '按小时查看' : '按天查看'
})

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

const handleRangeChange = async (event) => {
  await loadStats(event.target.value)
}

const ensureChart = (container, chartInstance) => {
  if (!container) {
    return chartInstance
  }

  if (chartInstance) {
    return chartInstance
  }

  return echarts.init(container)
}

const renderCharts = async () => {
  await nextTick()

  volumeChart = ensureChart(volumeChartRef.value, volumeChart)
  outcomeChart = ensureChart(outcomeChartRef.value, outcomeChart)

  if (!volumeChart || !outcomeChart) {
    return
  }

  volumeChart.setOption({
    tooltip: {
      trigger: 'axis',
    },
    grid: {
      left: 36,
      right: 16,
      top: 28,
      bottom: 28,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendLabels.value,
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
    },
    series: [
      {
        name: '提问量',
        type: 'line',
        smooth: true,
        data: trend.value.map((item) => item.total),
        lineStyle: {
          color: '#1677ff',
          width: 3,
        },
        itemStyle: {
          color: '#1677ff',
        },
        areaStyle: {
          color: 'rgba(22, 119, 255, 0.12)',
        },
      },
    ],
  })

  outcomeChart.setOption({
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      top: 0,
    },
    grid: {
      left: 36,
      right: 36,
      top: 36,
      bottom: 28,
    },
    xAxis: {
      type: 'category',
      data: trendLabels.value,
    },
    yAxis: [
      {
        type: 'value',
        minInterval: 1,
        name: '问题数',
      },
      {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}%',
        },
        name: '命中率',
      },
    ],
    series: [
      {
        name: '命中',
        type: 'bar',
        stack: 'outcome',
        data: trend.value.map((item) => item.hit),
        itemStyle: {
          color: '#52c41a',
        },
      },
      {
        name: '未命中',
        type: 'bar',
        stack: 'outcome',
        data: trend.value.map((item) => item.missed),
        itemStyle: {
          color: '#fa8c16',
        },
      },
      {
        name: '命中率',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: trend.value.map((item) => item.hitRate),
        lineStyle: {
          color: '#722ed1',
          width: 2,
        },
        itemStyle: {
          color: '#722ed1',
        },
      },
    ],
  })
}

const handleWindowResize = () => {
  volumeChart?.resize()
  outcomeChart?.resize()
}

onMounted(() => {
  loadStats()
  window.addEventListener('resize', handleWindowResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleWindowResize)
  volumeChart?.dispose()
  outcomeChart?.dispose()
})

watch(
  () => [trend.value, statsLoading.value],
  async () => {
    if (!statsLoading.value) {
      await renderCharts()
    }
  },
  { deep: true },
)
</script>

<template>
  <a-card class="page-card dashboard-page-card" title="热门问题统计">
    <a-typography-paragraph class="dashboard-copy" type="secondary">
      基于真实问题日志展示提问量、命中情况与高频问题，支持按时间范围观察运营趋势。
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
      <a-col :xs="24" :sm="12" :xl="6">
        <a-card class="dashboard-stat-card" :loading="statsLoading">
          <a-statistic title="提问总量" :value="totalQuestions" />
          <a-typography-paragraph class="dashboard-stat-copy" type="secondary">
            统计范围：{{ currentRangeLabel }}
          </a-typography-paragraph>
        </a-card>
      </a-col>

      <a-col :xs="24" :sm="12" :xl="6">
        <a-card class="dashboard-stat-card" :loading="statsLoading">
          <a-statistic title="命中问题数量" :value="hitCount" />
          <a-typography-paragraph class="dashboard-stat-copy" type="secondary">
            {{ trendDescription }}
          </a-typography-paragraph>
        </a-card>
      </a-col>

      <a-col :xs="24" :sm="12" :xl="6">
        <a-card class="dashboard-stat-card" :loading="statsLoading">
          <a-statistic title="未命中问题数量" :value="missedCount" />
          <a-typography-paragraph class="dashboard-stat-copy" type="secondary">
            便于持续补充知识条目
          </a-typography-paragraph>
        </a-card>
      </a-col>

      <a-col :xs="24" :sm="12" :xl="6">
        <a-card class="dashboard-stat-card" :loading="statsLoading">
          <a-statistic title="命中率" :value="hitRate" suffix="%" :precision="1" />
          <a-typography-paragraph class="dashboard-stat-copy" type="secondary">
            统计范围：{{ currentRangeLabel }}
          </a-typography-paragraph>
        </a-card>
      </a-col>

      <a-col :xs="24" :xl="12">
        <a-card
          class="dashboard-chart-card"
          title="提问量趋势"
          :loading="statsLoading"
        >
          <a-typography-paragraph class="dashboard-chart-copy" type="secondary">
            展示 {{ currentRangeLabel }} 内各时间点的提问量变化。
          </a-typography-paragraph>
          <div ref="volumeChartRef" class="dashboard-chart" />
        </a-card>
      </a-col>

      <a-col :xs="24" :xl="12">
        <a-card
          class="dashboard-chart-card"
          title="命中 / 未命中趋势"
          :loading="statsLoading"
        >
          <a-typography-paragraph class="dashboard-chart-copy" type="secondary">
            同时查看命中、未命中数量与命中率走势。
          </a-typography-paragraph>
          <div ref="outcomeChartRef" class="dashboard-chart" />
        </a-card>
      </a-col>

      <a-col :xs="24">
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
.dashboard-chart-card,
.dashboard-list-card {
  height: 100%;
}

.dashboard-stat-copy {
  margin-top: 12px;
  margin-bottom: 0;
}

.dashboard-chart-copy {
  margin-bottom: 12px;
}

.dashboard-chart {
  width: 100%;
  height: 320px;
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
