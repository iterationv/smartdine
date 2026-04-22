const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
const API_SECRET = import.meta.env.VITE_API_SECRET || ''

const MISSED_LOGS_ENDPOINT = `${API_BASE_URL}/api/logs/missed`
const LOG_STATS_ENDPOINT = `${API_BASE_URL}/api/logs/stats`
const MISSED_ERROR_MESSAGE = '未命中问题列表加载失败，请稍后重试。'
const UPDATE_MISSED_ERROR_MESSAGE = '未命中问题状态更新失败，请稍后重试。'
const STATS_ERROR_MESSAGE = '统计数据加载失败，请稍后重试。'

const getErrorMessage = (payload, fallbackMessage) => {
  if (payload && typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message.trim()
  }

  return fallbackMessage
}

const parseResponse = async (response, fallbackMessage) => {
  let data = null

  try {
    data = await response.json()
  } catch {
    if (!response.ok) {
      throw new Error(fallbackMessage)
    }

    return null
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data, fallbackMessage))
  }

  return data
}

const requestMissedLogs = async (queryString) => {
  const requestUrl = queryString ? `${MISSED_LOGS_ENDPOINT}?${queryString}` : MISSED_LOGS_ENDPOINT
  let response

  try {
    response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_SECRET,
      },
    })
  } catch {
    throw new Error(MISSED_ERROR_MESSAGE)
  }

  return parseResponse(response, MISSED_ERROR_MESSAGE)
}

const normalizeMissedItem = (item, index) => {
  if (!item || typeof item !== 'object') {
    return null
  }

  return {
    id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `missed_${index}`,
    question: typeof item.question === 'string' ? item.question.trim() : '',
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : '',
    convertedToKnowledge: item.convertedToKnowledge === true,
    handled: item.handled === true,
  }
}

const normalizeStatsRange = (range) => {
  return range === 'today' || range === '7d' || range === '30d' ? range : '7d'
}

export const getMissedQuestions = async (params = {}) => {
  const query = new URLSearchParams()

  if (Number.isInteger(params.page) && params.page > 0) {
    query.set('page', String(params.page))
  }

  if (Number.isInteger(params.size) && params.size > 0) {
    query.set('size', String(params.size))
  }

  if (typeof params.keyword === 'string' && params.keyword.trim()) {
    query.set('keyword', params.keyword.trim())
  }

  if (typeof params.startDate === 'string' && params.startDate.trim()) {
    query.set('startDate', params.startDate.trim())
  }

  if (typeof params.endDate === 'string' && params.endDate.trim()) {
    query.set('endDate', params.endDate.trim())
  }

  if (params.handled === true) {
    query.set('handled', 'true')
  }

  if (params.handled === false) {
    query.set('handled', 'false')
  }

  const data = await requestMissedLogs(query.toString())

  if (!data || !Array.isArray(data.list)) {
    throw new Error(MISSED_ERROR_MESSAGE)
  }

  return {
    list: data.list.map(normalizeMissedItem).filter(Boolean),
    total: Number.isInteger(data.total) ? data.total : 0,
    page: Number.isInteger(data.page) ? data.page : params.page || 1,
    size: Number.isInteger(data.size) ? data.size : params.size || 20,
  }
}

export const getLogStats = async (range = '7d') => {
  const query = new URLSearchParams()
  query.set('range', normalizeStatsRange(range))

  let response

  try {
    response = await fetch(`${LOG_STATS_ENDPOINT}?${query.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_SECRET,
      },
    })
  } catch {
    throw new Error(STATS_ERROR_MESSAGE)
  }

  const data = await parseResponse(response, STATS_ERROR_MESSAGE)

  if (!data || !Array.isArray(data.topQuestions)) {
    throw new Error(STATS_ERROR_MESSAGE)
  }

  return {
    topQuestions: data.topQuestions
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null
        }

        return {
          question: typeof item.question === 'string' ? item.question.trim() : '',
          count: Number.isInteger(item.count) ? item.count : 0,
        }
      })
      .filter((item) => item && item.question),
    totalQuestions: Number.isInteger(data.totalQuestions) ? data.totalQuestions : 0,
    hitCount: Number.isInteger(data.hitCount) ? data.hitCount : 0,
    missedCount: Number.isInteger(data.missedCount) ? data.missedCount : 0,
    hitRate: typeof data.hitRate === 'number' ? data.hitRate : 0,
    granularity: data.granularity === 'hour' ? 'hour' : 'day',
    trend: Array.isArray(data.trend)
      ? data.trend
          .map((item, index) => {
            if (!item || typeof item !== 'object') {
              return null
            }

            return {
              key:
                typeof item.key === 'string' && item.key.trim()
                  ? item.key.trim()
                  : `trend_${index}`,
              label:
                typeof item.label === 'string' && item.label.trim()
                  ? item.label.trim()
                  : '-',
              total: Number.isFinite(item.total) ? Number(item.total) : 0,
              hit: Number.isFinite(item.hit) ? Number(item.hit) : 0,
              missed: Number.isFinite(item.missed) ? Number(item.missed) : 0,
              hitRate: Number.isFinite(item.hitRate) ? Number(item.hitRate) : 0,
            }
          })
          .filter(Boolean)
      : [],
  }
}

export const updateMissedQuestion = async (id, input = {}) => {
  const normalizedId = typeof id === 'string' ? id.trim() : ''

  if (!normalizedId) {
    throw new Error(UPDATE_MISSED_ERROR_MESSAGE)
  }

  const body = {}

  if (typeof input.handled === 'boolean') {
    body.handled = input.handled
  }

  if (typeof input.convertedToKnowledge === 'boolean') {
    body.convertedToKnowledge = input.convertedToKnowledge
  }

  if (Object.keys(body).length === 0) {
    throw new Error(UPDATE_MISSED_ERROR_MESSAGE)
  }

  let response

  try {
    response = await fetch(`${MISSED_LOGS_ENDPOINT}/${encodeURIComponent(normalizedId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_SECRET,
      },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error(UPDATE_MISSED_ERROR_MESSAGE)
  }

  const data = await parseResponse(response, UPDATE_MISSED_ERROR_MESSAGE)
  const item = normalizeMissedItem(data?.item, 0)

  if (!item) {
    throw new Error(UPDATE_MISSED_ERROR_MESSAGE)
  }

  return item
}
