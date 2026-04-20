const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const API_SECRET = import.meta.env.VITE_API_SECRET || ''
const SERVICE_ERROR_MESSAGE = '当前服务暂不可用，请稍后再试。'

const buildChatUrl = () => {
  if (!API_BASE_URL) {
    throw new Error(SERVICE_ERROR_MESSAGE)
  }

  return `${API_BASE_URL}/chat`
}

const normalizeMatched = (matched) => {
  if (matched == null) {
    return null
  }

  if (
    typeof matched === 'object' &&
    typeof matched.id === 'string' &&
    typeof matched.question === 'string'
  ) {
    return {
      id: matched.id,
      question: matched.question,
    }
  }

  throw new Error(SERVICE_ERROR_MESSAGE)
}

export const postChat = async (question) => {
  const normalizedQuestion = typeof question === 'string' ? question.trim() : ''

  if (!normalizedQuestion) {
    throw new Error('question is required')
  }

  let response

  try {
    response = await fetch(buildChatUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_SECRET,
      },
      body: JSON.stringify({
        question: normalizedQuestion,
      }),
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
    matched: normalizeMatched(data.matched),
  }
}
