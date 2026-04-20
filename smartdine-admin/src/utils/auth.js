const AUTH_STORAGE_KEY = 'smartdine_admin_logged_in'
const VALID_USERNAME = 'admin'
const VALID_PASSWORD = 'admin123'

export const isAdminAuthenticated = () => {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(AUTH_STORAGE_KEY) === '1'
}

export const loginAdmin = ({ username, password }) => {
  if (typeof window === 'undefined') {
    return false
  }

  const normalizedUsername = typeof username === 'string' ? username.trim() : ''
  const normalizedPassword = typeof password === 'string' ? password : ''

  if (
    normalizedUsername !== VALID_USERNAME ||
    normalizedPassword !== VALID_PASSWORD
  ) {
    return false
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, '1')

  return true
}
