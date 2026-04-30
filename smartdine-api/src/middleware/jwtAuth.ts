import type { MiddlewareHandler } from 'hono'
import { getCookie } from 'hono/cookie'
import jwt from 'jsonwebtoken'
import { adminAuthConfig } from '../config.js'

export const ADMIN_AUTH_COOKIE_NAME = 'smartdine_admin_token'
export const ADMIN_AUTH_ISSUER = 'smartdine-admin'

export const ADMIN_AUTH_REQUIRED_RESPONSE = {
  error: 'UNAUTHORIZED',
  message: 'Authentication required',
} as const

export const ADMIN_AUTH_CONFIG_ERROR_RESPONSE = {
  error: 'ADMIN_AUTH_NOT_CONFIGURED',
  message: 'Admin authentication is not configured',
} as const

export function isAdminAuthConfigured(): boolean {
  return Boolean(
    adminAuthConfig.username &&
      adminAuthConfig.passwordHash &&
      adminAuthConfig.jwtSecret,
  )
}

export const adminJwtAuthMiddleware: MiddlewareHandler = async (c, next) => {
  if (!isAdminAuthConfigured()) {
    return c.json(ADMIN_AUTH_CONFIG_ERROR_RESPONSE, 500)
  }

  const token = getCookie(c, ADMIN_AUTH_COOKIE_NAME)

  if (!token) {
    return c.json(ADMIN_AUTH_REQUIRED_RESPONSE, 401)
  }

  try {
    const payload = jwt.verify(token, adminAuthConfig.jwtSecret, {
      issuer: ADMIN_AUTH_ISSUER,
    })

    if (
      !payload ||
      typeof payload !== 'object' ||
      payload.sub !== adminAuthConfig.username
    ) {
      return c.json(ADMIN_AUTH_REQUIRED_RESPONSE, 401)
    }
  } catch {
    return c.json(ADMIN_AUTH_REQUIRED_RESPONSE, 401)
  }

  await next()
}
