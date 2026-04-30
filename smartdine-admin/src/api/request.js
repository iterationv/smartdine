export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')

const AUTH_EXPIRED_MESSAGE = '登录状态已过期，请重新登录。'
let unauthorizedHandler = null

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = typeof handler === 'function' ? handler : null
}

export const buildApiUrl = (path) => {
  return `${API_BASE_URL}${path}`
}

const getErrorMessage = (payload, fallbackMessage) => {
  if (payload && typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message.trim()
  }

  return fallbackMessage
}

const readJsonPayload = async (response, fallbackMessage) => {
  try {
    return await response.json()
  } catch {
    if (!response.ok) {
      throw new Error(fallbackMessage)
    }

    return null
  }
}

export const requestAdminJson = async ({
  path,
  url,
  method = 'GET',
  body,
  fallbackMessage,
}) => {
  const requestUrl = url || buildApiUrl(path)
  let response

  try {
    response = await fetch(requestUrl, {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  } catch {
    throw new Error(fallbackMessage)
  }

  const data = await readJsonPayload(response, fallbackMessage)

  if (response.status === 401) {
    unauthorizedHandler?.()
    throw new Error(AUTH_EXPIRED_MESSAGE)
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data, fallbackMessage))
  }

  return data
}
