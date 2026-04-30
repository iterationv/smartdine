import type { MiddlewareHandler } from 'hono'
import { appConfig } from '../config.js'

const ALLOW_METHODS = 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
const ALLOW_HEADERS = 'Content-Type,x-api-key'

const getAllowedOrigin = (origin: string | undefined): string | null => {
  if (appConfig.corsOrigins.length === 0) {
    return origin ?? '*'
  }

  if (origin && appConfig.corsOrigins.includes(origin)) {
    return origin
  }

  return null
}

const applyCorsHeaders = (response: Response, origin: string | undefined, isPrivateNetwork = false) => {
  response.headers.set('Access-Control-Allow-Methods', ALLOW_METHODS)
  response.headers.set('Access-Control-Allow-Headers', ALLOW_HEADERS)

  if (isPrivateNetwork) {
    response.headers.set('Access-Control-Allow-Private-Network', 'true')
  }

  const allowedOrigin = getAllowedOrigin(origin)

  if (allowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin)

    if (allowedOrigin !== '*') {
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      response.headers.set('Vary', 'Origin')
    }
  }
}

export const corsMiddleware: MiddlewareHandler = async (c, next) => {
  const origin = c.req.header('origin')
  const isPrivateNetwork = c.req.header('access-control-request-private-network') === 'true'

  if (c.req.method === 'OPTIONS') {
    const response = new Response(null, { status: 204 })
    applyCorsHeaders(response, origin, isPrivateNetwork)

    return response
  }

  await next()
  applyCorsHeaders(c.res, origin)
}
