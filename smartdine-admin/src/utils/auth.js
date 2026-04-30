import { buildApiUrl } from '../api/request'

const AUTH_STORAGE_KEY = 'smartdine_admin_authenticated'
const LOGIN_ERROR_MESSAGE = '用户名或密码错误'

export const isAdminAuthenticated = () => {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(AUTH_STORAGE_KEY) === '1'
}

export const markAdminAuthenticated = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, '1')
}

export const clearAdminSession = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}

export const loginAdmin = async ({ username, password }) => {
  const normalizedUsername = typeof username === 'string' ? username.trim() : ''
  const normalizedPassword = typeof password === 'string' ? password : ''

  let response

  try {
    response = await fetch(buildApiUrl('/api/admin/login'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: normalizedUsername,
        password: normalizedPassword,
      }),
    })
  } catch {
    throw new Error(LOGIN_ERROR_MESSAGE)
  }

  if (response.status === 401) {
    throw new Error(LOGIN_ERROR_MESSAGE)
  }

  if (!response.ok) {
    throw new Error(LOGIN_ERROR_MESSAGE)
  }

  markAdminAuthenticated()

  return true
}

export const logoutAdmin = async () => {
  try {
    await fetch(buildApiUrl('/api/admin/logout'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } finally {
    clearAdminSession()
  }
}
