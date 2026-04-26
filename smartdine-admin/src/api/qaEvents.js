const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
const API_SECRET = import.meta.env.VITE_API_SECRET || ''

const QA_EVENTS_ENDPOINT = `${API_BASE_URL}/api/admin/qa-events`
const QA_EVENTS_ERROR_MESSAGE = '问答日志加载失败，请稍后重试。'
const CONFIDENCE_VALUES = new Set(['high', 'low', 'ambiguous', 'unknown_entity'])

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
  const limit = Number.isInteger(params.limit) && params.limit > 0 ? params.limit : 20

  query.set('limit', String(limit))

  if (CONFIDENCE_VALUES.has(params.confidence)) {
    query.set('confidence', params.confidence)
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

  if (!data || !Array.isArray(data.list)) {
    throw new Error(QA_EVENTS_ERROR_MESSAGE)
  }

  return {
    list: data.list.map(normalizeQaEvent).filter(Boolean),
    total: Number.isInteger(data.total) ? data.total : 0,
  }
}
