const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
const API_SECRET = import.meta.env.VITE_API_SECRET || ''

const QA_EVENTS_ENDPOINT = `${API_BASE_URL}/api/admin/qa-events`
const QA_EVENTS_ERROR_MESSAGE = '问答日志加载失败，请稍后重试。'
export const QA_EVENT_CONFIDENCE_VALUES = [
  'high',
  'low',
  'ambiguous',
  'unknown_entity',
]
const CONFIDENCE_VALUES = new Set(QA_EVENT_CONFIDENCE_VALUES)

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

const normalizeConfidence = (value) => {
  return CONFIDENCE_VALUES.has(value) ? value : 'unknown_entity'
}

const normalizePositiveInteger = (value, fallbackValue) => {
  return Number.isInteger(value) && value > 0 ? value : fallbackValue
}

const normalizeConfidenceParams = (value) => {
  if (Array.isArray(value)) {
    return [...new Set(value.filter((item) => CONFIDENCE_VALUES.has(item)))]
  }

  if (typeof value === 'string' && value.trim()) {
    return [...new Set(value.split(',').map((item) => item.trim()).filter((item) => CONFIDENCE_VALUES.has(item)))]
  }

  return []
}

const normalizeQaEvent = (item, index) => {
  if (!item || typeof item !== 'object') {
    return null
  }

  const timestamp =
    typeof item.timestamp === 'string' && !Number.isNaN(Date.parse(item.timestamp))
      ? item.timestamp
      : ''

  return {
    requestId:
      typeof item.requestId === 'string' && item.requestId.trim()
        ? item.requestId.trim()
        : `qa_event_${index}`,
    timestamp,
    queryDigest:
      typeof item.queryDigest === 'string' ? item.queryDigest.trim() : '',
    queryLength: Number.isFinite(item.queryLength) ? Number(item.queryLength) : 0,
    confidence: normalizeConfidence(item.confidence),
    fallbackReason:
      typeof item.fallbackReason === 'string' && item.fallbackReason.trim()
        ? item.fallbackReason.trim()
        : null,
    topMatchId:
      typeof item.topMatchId === 'string' && item.topMatchId.trim()
        ? item.topMatchId.trim()
        : null,
    topScore: Number.isFinite(item.topScore) ? Number(item.topScore) : null,
    duration: Number.isFinite(item.duration) ? Number(item.duration) : 0,
  }
}

export const getQaEvents = async (params = {}) => {
  const query = new URLSearchParams()
  const page = normalizePositiveInteger(params.page, 1)
  const limit = Math.min(normalizePositiveInteger(params.limit, 20), 100)
  const confidence = normalizeConfidenceParams(params.confidence)

  query.set('page', String(page))
  query.set('limit', String(limit))

  if (typeof params.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(params.date.trim())) {
    query.set('date', params.date.trim())
  }

  if (confidence.length > 0 && confidence.length < QA_EVENT_CONFIDENCE_VALUES.length) {
    query.set('confidence', confidence.join(','))
  }

  let response

  try {
    response = await fetch(`${QA_EVENTS_ENDPOINT}?${query.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_SECRET,
      },
    })
  } catch {
    throw new Error(QA_EVENTS_ERROR_MESSAGE)
  }

  const data = await parseResponse(response, QA_EVENTS_ERROR_MESSAGE)

  const rawItems = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.list)
      ? data.list
      : null

  if (!rawItems) {
    throw new Error(QA_EVENTS_ERROR_MESSAGE)
  }

  const items = rawItems.map(normalizeQaEvent).filter(Boolean)

  return {
    items,
    list: items,
    total: Number.isInteger(data.total) ? data.total : 0,
    page: Number.isInteger(data.page) ? data.page : page,
    limit: Number.isInteger(data.limit) ? data.limit : limit,
    date: typeof data.date === 'string' ? data.date : params.date || '',
  }
}
