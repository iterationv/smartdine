const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
const API_SECRET = import.meta.env.VITE_API_SECRET || ''

const FAQ_ENDPOINT = `${API_BASE_URL}/admin/faq`
const LIST_ERROR_MESSAGE = 'FAQ 列表加载失败，请稍后重试。'
const CREATE_ERROR_MESSAGE = 'FAQ 新增失败，请稍后重试。'
const UPDATE_ERROR_MESSAGE = 'FAQ 编辑失败，请稍后重试。'
const DELETE_ERROR_MESSAGE = 'FAQ 删除失败，请稍后重试。'

export const faqApiConfig = {
  baseUrl: API_BASE_URL,
  apiSecret: API_SECRET,
}

const normalizeTags = (value) => {
  if (Array.isArray(value)) {
    return value
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(/[,\n，]/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

const normalizeFaqItem = (item, index) => {
  if (!item || typeof item !== 'object') {
    return null
  }

  return {
    id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `faq_${index}`,
    question: typeof item.question === 'string' ? item.question.trim() : '',
    answer: typeof item.answer === 'string' ? item.answer.trim() : '',
    tags: normalizeTags(item.tags),
  }
}

const normalizeFaqList = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray(payload.value)
      ? payload.value
      : null

  if (!list) {
    throw new Error(LIST_ERROR_MESSAGE)
  }

  return list
    .map(normalizeFaqItem)
    .filter((item) => item && (item.question || item.answer))
}

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

const requestFaq = async ({ url = FAQ_ENDPOINT, method, body, fallbackMessage }) => {
  let response

  try {
    response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_SECRET,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  } catch {
    throw new Error(fallbackMessage)
  }

  return parseResponse(response, fallbackMessage)
}

const normalizeCreatePayload = (input) => {
  if (!input || typeof input !== 'object') {
    throw new Error(CREATE_ERROR_MESSAGE)
  }

  const question = typeof input.question === 'string' ? input.question.trim() : ''
  const answer = typeof input.answer === 'string' ? input.answer.trim() : ''
  const tags = normalizeTags(input.tags)
  const id =
    typeof input.id === 'string' && input.id.trim()
      ? input.id.trim()
      : `faq_${Date.now()}`

  if (!question || !answer || tags.length === 0) {
    throw new Error('请完整填写问题、答案和标签。')
  }

  return {
    id,
    question,
    answer,
    tags,
  }
}

const normalizeUpdatePayload = (input) => {
  if (!input || typeof input !== 'object') {
    throw new Error(UPDATE_ERROR_MESSAGE)
  }

  const question = typeof input.question === 'string' ? input.question.trim() : ''
  const answer = typeof input.answer === 'string' ? input.answer.trim() : ''
  const tags = normalizeTags(input.tags)

  if (!question || !answer || tags.length === 0) {
    throw new Error('请完整填写问题、答案和标签。')
  }

  return {
    question,
    answer,
    tags,
  }
}

export const getFaqList = async () => {
  const data = await requestFaq({
    method: 'GET',
    fallbackMessage: LIST_ERROR_MESSAGE,
  })

  return normalizeFaqList(data)
}

export const getFaqById = async (id) => {
  const normalizedId = typeof id === 'string' ? id.trim() : ''

  if (!normalizedId) {
    throw new Error('FAQ 不存在或已被删除。')
  }

  const list = await getFaqList()
  const item = list.find((faq) => faq.id === normalizedId)

  if (!item) {
    throw new Error('FAQ 不存在或已被删除。')
  }

  return item
}

export const createFaq = async (input) => {
  const payload = normalizeCreatePayload(input)
  const data = await requestFaq({
    method: 'POST',
    body: payload,
    fallbackMessage: CREATE_ERROR_MESSAGE,
  })
  const item = normalizeFaqItem(data, 0)

  if (!item || !item.question || !item.answer) {
    throw new Error(CREATE_ERROR_MESSAGE)
  }

  return item
}

export const updateFaq = async (id, input) => {
  const normalizedId = typeof id === 'string' ? id.trim() : ''

  if (!normalizedId) {
    throw new Error(UPDATE_ERROR_MESSAGE)
  }

  const payload = normalizeUpdatePayload(input)
  const data = await requestFaq({
    url: `${FAQ_ENDPOINT}/${encodeURIComponent(normalizedId)}`,
    method: 'PUT',
    body: payload,
    fallbackMessage: UPDATE_ERROR_MESSAGE,
  })
  const item = normalizeFaqItem(data, 0)

  if (!item || !item.question || !item.answer) {
    throw new Error(UPDATE_ERROR_MESSAGE)
  }

  return item
}

export const deleteFaq = async (id) => {
  const normalizedId = typeof id === 'string' ? id.trim() : ''

  if (!normalizedId) {
    throw new Error(DELETE_ERROR_MESSAGE)
  }

  const data = await requestFaq({
    url: `${FAQ_ENDPOINT}/${encodeURIComponent(normalizedId)}`,
    method: 'DELETE',
    fallbackMessage: DELETE_ERROR_MESSAGE,
  })

  if (!data || data.success !== true) {
    throw new Error(DELETE_ERROR_MESSAGE)
  }

  return data
}
