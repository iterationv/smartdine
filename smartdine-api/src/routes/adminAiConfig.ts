import { randomUUID } from 'node:crypto'
import { Hono } from 'hono'
import { adminJwtAuthMiddleware } from '../middleware/jwtAuth.js'
import {
  AiConfigValidationError,
  getAiConfigView,
  resetAiRuntimeConfig,
  updateAiRuntimeConfig,
} from '../services/aiConfigService.js'
import { logAdminEvent } from '../utils/adminEvents.js'

const adminAiConfigRoutes = new Hono()

async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    throw new AiConfigValidationError('Request body must be valid JSON.')
  }
}

adminAiConfigRoutes.use('/api/admin/ai-config', adminJwtAuthMiddleware)
adminAiConfigRoutes.use('/api/admin/ai-config/*', adminJwtAuthMiddleware)

adminAiConfigRoutes.get('/api/admin/ai-config', (c) => {
  return c.json(getAiConfigView())
})

adminAiConfigRoutes.put('/api/admin/ai-config', async (c) => {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const body = await readJsonBody(c.req.raw)
    const { diff } = await updateAiRuntimeConfig(body)

    logAdminEvent({
      requestId,
      timestamp: new Date(start).toISOString(),
      actor: 'admin',
      action: 'ai-config.update',
      diff,
      duration: Date.now() - start,
    })

    return c.json(getAiConfigView())
  } catch (error) {
    if (error instanceof AiConfigValidationError) {
      return c.json(
        {
          message: error.message,
        },
        400,
      )
    }

    console.error('Failed to update AI config:', error)

    return c.json(
      {
        message: 'Failed to update AI config',
      },
      500,
    )
  }
})

adminAiConfigRoutes.post('/api/admin/ai-config/reset', async (c) => {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const { diff } = await resetAiRuntimeConfig()

    logAdminEvent({
      requestId,
      timestamp: new Date(start).toISOString(),
      actor: 'admin',
      action: 'ai-config.reset',
      diff,
      duration: Date.now() - start,
    })

    return c.json(getAiConfigView())
  } catch (error) {
    console.error('Failed to reset AI config:', error)

    return c.json(
      {
        message: 'Failed to reset AI config',
      },
      500,
    )
  }
})

export default adminAiConfigRoutes
