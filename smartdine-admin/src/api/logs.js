const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
const API_SECRET = import.meta.env.VITE_API_SECRET || ''

const MISSED_LOGS_ENDPOINT = `${API_BASE_URL}/api/logs/missed`
const MISSED_ERROR_MESSAGE = '未命中问题列表加载失败，请稍后重试。'

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
  }
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
