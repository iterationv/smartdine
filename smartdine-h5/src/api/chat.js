const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const API_SECRET = import.meta.env.VITE_API_SECRET || ''
const SERVICE_ERROR_MESSAGE = '当前服务暂不可用，请稍后再试。'
const CONFIDENCE_VALUES = new Set(['high', 'low', 'ambiguous', 'unknown_entity'])

const buildUrl = (path) => {
  if (!API_BASE_URL) {
    throw new Error(SERVICE_ERROR_MESSAGE)
  }

  return `${API_BASE_URL}${path}`
}

const defaultHeaders = () => ({
  'Content-Type': 'application/json',
  'x-api-key': API_SECRET,
})

const normalizeMatched = (matched) => {
  if (matched == null) {
    return null
  }

  if (
    typeof matched === 'object' &&
    typeof matched.id === 'string' &&
    typeof matched.title === 'string'
  ) {
    return {
      id: matched.id,
      title: matched.title,
    }
  }

  throw new Error(SERVICE_ERROR_MESSAGE)
}

const normalizeSource = (source) => {
  if (source === 'knowledge' || source === 'faq' || source === 'ai_fallback') {
    return source
  }

  throw new Error(SERVICE_ERROR_MESSAGE)
}

const normalizeRelated = (related) => {
  if (!Array.isArray(related)) return []
  return related.filter((q) => typeof q === 'string' && q.trim().length > 0)
}

const normalizeConfidence = (confidence) => {
  return CONFIDENCE_VALUES.has(confidence) ? confidence : 'high'
}

const normalizeCandidates = (candidates) => {
  if (!Array.isArray(candidates)) {
    return []
  }

  return candidates
    .map((candidate) => {
      if (!candidate || typeof candidate !== 'object') {
        return null
      }

      const id =
        typeof candidate.id === 'string' && candidate.id.trim()
          ? candidate.id.trim()
          : ''
      const question =
        typeof candidate.question === 'string' && candidate.question.trim()
          ? candidate.question.trim()
          : ''

      if (!id || !question) {
        return null
      }

      return {
        id,
        question,
      }
    })
    .filter(Boolean)
}

export const postChat = async (question) => {
  const normalizedQuestion = typeof question === 'string' ? question.trim() : ''

  if (!normalizedQuestion) {
    throw new Error('question is required')
  }

  let response

  try {
    response = await fetch(buildUrl('/chat'), {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ question: normalizedQuestion }),
    })
  } catch {
    throw new Error(SERVICE_ERROR_MESSAGE)
  }

  let data = null

  try {
    data = await response.json()
  } catch {
    throw new Error(SERVICE_ERROR_MESSAGE)
  }

  if (!response.ok) {
    throw new Error(SERVICE_ERROR_MESSAGE)
  }

  if (!data || typeof data.answer !== 'string') {
    throw new Error(SERVICE_ERROR_MESSAGE)
  }

  return {
    answer: data.answer,
    source: normalizeSource(data.source),
    matched: normalizeMatched(data.matched),
    related: normalizeRelated(data.related),
    confidence: normalizeConfidence(data.confidence),
    candidates: normalizeCandidates(data.candidates),
  }
}

export const getSuggestions = async () => {
  let response

  try {
    response = await fetch(buildUrl('/api/suggestions'), {
      headers: defaultHeaders(),
    })
  } catch {
    throw new Error(SERVICE_ERROR_MESSAGE)
  }

  let data = null

  try {
    data = await response.json()
  } catch {
    throw new Error(SERVICE_ERROR_MESSAGE)
  }

  if (!response.ok) {
    throw new Error(SERVICE_ERROR_MESSAGE)
  }

  if (!data || !Array.isArray(data.suggestions)) {
    throw new Error(SERVICE_ERROR_MESSAGE)
  }

  return data.suggestions
}
