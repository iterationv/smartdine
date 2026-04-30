import { API_BASE_URL, requestAdminJson } from './request'

const KNOWLEDGE_ENDPOINT = `${API_BASE_URL}/api/knowledge`
const LIST_ERROR_MESSAGE = '知识条目列表加载失败，请稍后重试。'
const CREATE_ERROR_MESSAGE = '知识条目新增失败，请稍后重试。'
const UPDATE_ERROR_MESSAGE = '知识条目编辑失败，请稍后重试。'
const STATUS_ERROR_MESSAGE = '知识条目状态切换失败，请稍后重试。'
const DELETE_ERROR_MESSAGE = '知识条目删除失败，请稍后重试。'

const normalizeStringArray = (value) => {
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

const normalizeStatus = (value) => {
  return value === 'inactive' ? 'inactive' : 'active'
}

const normalizeKnowledgeItem = (item, index) => {
  if (!item || typeof item !== 'object') {
    return null
  }

  return {
    id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `knowledge_${index}`,
    title: typeof item.title === 'string' ? item.title.trim() : '',
    question: typeof item.question === 'string' ? item.question.trim() : '',
    answer: typeof item.answer === 'string' ? item.answer.trim() : '',
    aliases: normalizeStringArray(item.aliases),
    tags: normalizeStringArray(item.tags),
    status: normalizeStatus(item.status),
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : '',
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : '',
  }
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

const requestKnowledge = async ({ url = KNOWLEDGE_ENDPOINT, method, body, fallbackMessage }) => {
  return requestAdminJson({ url, method, body, fallbackMessage })
}

const buildKnowledgePayload = (input, fallbackMessage) => {
  if (!input || typeof input !== 'object') {
    throw new Error(fallbackMessage)
  }

  const title = typeof input.title === 'string' ? input.title.trim() : ''
  const question = typeof input.question === 'string' ? input.question.trim() : ''
  const answer = typeof input.answer === 'string' ? input.answer.trim() : ''

  if (!title || !question || !answer) {
    throw new Error('请完整填写标题、标准问法和标准答案。')
  }

  return {
    title,
    question,
    answer,
    aliases: normalizeStringArray(input.aliases),
    tags: normalizeStringArray(input.tags),
    status: normalizeStatus(input.status),
  }
}

export const getKnowledgeList = async (filters = {}) => {
  const query = new URLSearchParams()

  if (typeof filters.keyword === 'string' && filters.keyword.trim()) {
    query.set('keyword', filters.keyword.trim())
  }

  if (typeof filters.tag === 'string' && filters.tag.trim()) {
    query.set('tag', filters.tag.trim())
  }

  if (filters.status === 'active' || filters.status === 'inactive') {
    query.set('status', filters.status)
  }

  const requestUrl = query.size > 0 ? `${KNOWLEDGE_ENDPOINT}?${query.toString()}` : KNOWLEDGE_ENDPOINT
  const data = await requestKnowledge({
    url: requestUrl,
    method: 'GET',
    fallbackMessage: LIST_ERROR_MESSAGE,
  })

  if (!data || !Array.isArray(data.items)) {
    throw new Error(LIST_ERROR_MESSAGE)
  }

  return data.items.map(normalizeKnowledgeItem).filter(Boolean)
}

export const createKnowledgeItem = async (input) => {
  const data = await requestKnowledge({
    method: 'POST',
    body: buildKnowledgePayload(input, CREATE_ERROR_MESSAGE),
    fallbackMessage: CREATE_ERROR_MESSAGE,
  })
  const item = normalizeKnowledgeItem(data?.item, 0)

  if (!item) {
    throw new Error(CREATE_ERROR_MESSAGE)
  }

  return item
}

export const updateKnowledgeItem = async (id, input) => {
  const normalizedId = typeof id === 'string' ? id.trim() : ''

  if (!normalizedId) {
    throw new Error(UPDATE_ERROR_MESSAGE)
  }

  const data = await requestKnowledge({
    url: `${KNOWLEDGE_ENDPOINT}/${encodeURIComponent(normalizedId)}`,
    method: 'PUT',
    body: buildKnowledgePayload(input, UPDATE_ERROR_MESSAGE),
    fallbackMessage: UPDATE_ERROR_MESSAGE,
  })
  const item = normalizeKnowledgeItem(data?.item, 0)

  if (!item) {
    throw new Error(UPDATE_ERROR_MESSAGE)
  }

  return item
}

export const toggleKnowledgeStatus = async (id, status) => {
  const normalizedId = typeof id === 'string' ? id.trim() : ''

  if (!normalizedId) {
    throw new Error(STATUS_ERROR_MESSAGE)
  }

  const data = await requestKnowledge({
    url: `${KNOWLEDGE_ENDPOINT}/${encodeURIComponent(normalizedId)}/status`,
    method: 'PATCH',
    body: {
      status: normalizeStatus(status),
    },
    fallbackMessage: STATUS_ERROR_MESSAGE,
  })
  const item = normalizeKnowledgeItem(data?.item, 0)

  if (!item) {
    throw new Error(STATUS_ERROR_MESSAGE)
  }

  return item
}

export const deleteKnowledgeItem = async (id) => {
  const normalizedId = typeof id === 'string' ? id.trim() : ''

  if (!normalizedId) {
    throw new Error(DELETE_ERROR_MESSAGE)
  }

  const data = await requestKnowledge({
    url: `${KNOWLEDGE_ENDPOINT}/${encodeURIComponent(normalizedId)}`,
    method: 'DELETE',
    fallbackMessage: DELETE_ERROR_MESSAGE,
  })

  if (!data || data.success !== true) {
    throw new Error(DELETE_ERROR_MESSAGE)
  }

  return data
}
