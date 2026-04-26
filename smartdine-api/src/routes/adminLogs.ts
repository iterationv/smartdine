import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import {
  queryQaEvents,
  type QaEventConfidence,
} from '../utils/qaEvents.js'

const adminLogsRoutes = new Hono()

const CONFIDENCE_VALUES = new Set<QaEventConfidence>([
  'high',
  'low',
  'ambiguous',
  'unknown_entity',
])

function parseLimit(value: string | undefined): number | undefined {
  if (!value) {
    return undefined
  }

  const parsedValue = Number.parseInt(value, 10)

  return Number.isFinite(parsedValue) ? parsedValue : undefined
}

function parsePage(value: string | undefined): number | undefined {
  if (!value) {
    return undefined
  }

  const parsedValue = Number.parseInt(value, 10)

  return Number.isFinite(parsedValue) ? parsedValue : undefined
}

function parseConfidence(value: string | undefined): QaEventConfidence[] | undefined {
  if (!value) {
    return undefined
  }

  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is QaEventConfidence =>
      CONFIDENCE_VALUES.has(item as QaEventConfidence),
    )

  return items.length > 0 ? items : undefined
}

adminLogsRoutes.use('/api/admin/qa-events', authMiddleware)

adminLogsRoutes.get('/api/admin/qa-events', async (c) => {
  const result = await queryQaEvents({
    date: c.req.query('date'),
    page: parsePage(c.req.query('page')),
    limit: parseLimit(c.req.query('limit')),
    confidence: parseConfidence(c.req.query('confidence')),
  })

  return c.json(result)
})

export default adminLogsRoutes
