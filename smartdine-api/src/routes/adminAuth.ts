import { Hono } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { adminAuthConfig } from '../config.js'
import {
  ADMIN_AUTH_CONFIG_ERROR_RESPONSE,
  ADMIN_AUTH_COOKIE_NAME,
  ADMIN_AUTH_ISSUER,
  isAdminAuthConfigured,
} from '../middleware/jwtAuth.js'

const adminAuthRoutes = new Hono()

const INVALID_LOGIN_RESPONSE = {
  error: 'UNAUTHORIZED',
  message: 'Invalid username or password',
} as const

type LoginBody = {
  username?: unknown
  password?: unknown
}

async function readLoginBody(request: Request): Promise<LoginBody | null> {
  try {
    const body = await request.json()

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return null
    }

    return body as LoginBody
  } catch {
    return null
  }
}

const getCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: adminAuthConfig.jwtExpiresInSeconds,
  path: '/',
})

adminAuthRoutes.post('/api/admin/login', async (c) => {
  if (!isAdminAuthConfigured()) {
    return c.json(ADMIN_AUTH_CONFIG_ERROR_RESPONSE, 500)
  }

  const body = await readLoginBody(c.req.raw)
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!username || !password || username !== adminAuthConfig.username) {
    return c.json(INVALID_LOGIN_RESPONSE, 401)
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    adminAuthConfig.passwordHash,
  )

  if (!isPasswordValid) {
    return c.json(INVALID_LOGIN_RESPONSE, 401)
  }

  const token = jwt.sign(
    {
      scope: 'admin',
    },
    adminAuthConfig.jwtSecret,
    {
      subject: adminAuthConfig.username,
      issuer: ADMIN_AUTH_ISSUER,
      expiresIn: adminAuthConfig.jwtExpiresInSeconds,
    },
  )

  setCookie(c, ADMIN_AUTH_COOKIE_NAME, token, getCookieOptions())

  return c.json({
    success: true,
  })
})

adminAuthRoutes.post('/api/admin/logout', (c) => {
  deleteCookie(c, ADMIN_AUTH_COOKIE_NAME, {
    path: '/',
  })

  return c.json({
    success: true,
  })
})

export default adminAuthRoutes
