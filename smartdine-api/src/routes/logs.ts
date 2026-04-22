import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import {
  getLogStats,
  listMissedQuestions,
  listQuestionLogs,
  updateMissedQuestionStatus,
} from '../services/logService.js'

const logsRoutes = new Hono()

type MissedQuestionStatusBody = {
  handled?: unknown
  convertedToKnowledge?: unknown
}

const getOptionalQuery = (value: string | undefined): string | undefined => {
  return value === undefined || value === '' ? undefined : value
}

const getOptionalNumberQuery = (
  value: string | undefined,
): number | undefined => {
  const query = getOptionalQuery(value)

  return query === undefined ? undefined : Number(query)
}

const getOptionalBooleanQuery = (
  value: string | undefined,
): boolean | undefined => {
  const query = getOptionalQuery(value)

  if (query === undefined) {
    return undefined
  }

  if (query === 'true') {
    return true
  }

  if (query === 'false') {
    return false
  }

  throw new Error('Invalid handled query.')
}

const isInvalidDateError = (error: unknown): error is Error => {
  return (
    error instanceof Error &&
    (error.message === 'Invalid startDate.' ||
      error.message === 'Invalid endDate.' ||
      error.message === 'Invalid handled query.')
  )
}

const isMissedQuestionNotFoundError = (error: unknown): error is Error => {
  return (
    error instanceof Error &&
    error.message.startsWith('Missed question not found:')
  )
}

const readMissedQuestionStatusBody = async (
  request: Request,
): Promise<MissedQuestionStatusBody | null> => {
  try {
    const body = await request.json()

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return null
    }

    return body as MissedQuestionStatusBody
  } catch {
    return null
  }
}

logsRoutes.use('*', authMiddleware)

logsRoutes.get('/api/logs', async (c) => {
  try {
    const result = await listQuestionLogs({
      page: getOptionalNumberQuery(c.req.query('page')),
      size: getOptionalNumberQuery(c.req.query('size')),
      keyword: getOptionalQuery(c.req.query('keyword')),
    })

    return c.json(result)
  } catch (error) {
    console.error('Failed to list question logs:', error)

    return c.json(
      {
        message: 'Internal server error',
      },
      500,
    )
  }
})

logsRoutes.get('/api/logs/stats', async (c) => {
  try {
    const result = await getLogStats(getOptionalQuery(c.req.query('range')))

    return c.json(result)
  } catch (error) {
    console.error('Failed to load log stats:', error)

    return c.json(
      {
        message: 'Internal server error',
      },
      500,
    )
  }
})

logsRoutes.get('/api/logs/missed', async (c) => {
  try {
    const result = await listMissedQuestions({
      page: getOptionalNumberQuery(c.req.query('page')),
      size: getOptionalNumberQuery(c.req.query('size')),
      keyword: getOptionalQuery(c.req.query('keyword')),
      startDate: getOptionalQuery(c.req.query('startDate')),
      endDate: getOptionalQuery(c.req.query('endDate')),
      handled: getOptionalBooleanQuery(c.req.query('handled')),
    })

    return c.json(result)
  } catch (error) {
    if (isInvalidDateError(error)) {
      return c.json(
        {
          message: error.message,
        },
        400,
      )
    }

    console.error('Failed to list missed questions:', error)

    return c.json(
      {
        message: 'Internal server error',
      },
      500,
    )
  }
})

logsRoutes.patch('/api/logs/missed/:id', async (c) => {
  const body = await readMissedQuestionStatusBody(c.req.raw)

  if (
    !body ||
    (body.handled !== undefined && typeof body.handled !== 'boolean') ||
    (body.convertedToKnowledge !== undefined &&
      typeof body.convertedToKnowledge !== 'boolean')
  ) {
    return c.json(
      {
        message: 'Invalid missed question status payload',
      },
      400,
    )
  }

  try {
    const item = await updateMissedQuestionStatus(c.req.param('id'), {
      handled: body.handled,
      convertedToKnowledge: body.convertedToKnowledge,
    })

    return c.json({ item })
  } catch (error) {
    if (isMissedQuestionNotFoundError(error)) {
      return c.json(
        {
          message: error.message,
        },
        404,
      )
    }

    if (
      error instanceof Error &&
      error.message === 'At least one status field is required.'
    ) {
      return c.json(
        {
          message: error.message,
        },
        400,
      )
    }

    console.error('Failed to update missed question status:', error)

    return c.json(
      {
        message: 'Internal server error',
      },
      500,
    )
  }
})

export default logsRoutes
