import { Hono } from 'hono'
import { adminJwtAuthMiddleware } from '../middleware/jwtAuth.js'
import {
  createKnowledge,
  deleteKnowledge,
  listKnowledge,
  updateKnowledge,
  updateKnowledgeStatus,
} from '../services/knowledgeService.js'
import type { KnowledgeStatus } from '../types/knowledge.js'

const knowledgeRoutes = new Hono()

type KnowledgeBody = {
  title?: unknown
  question?: unknown
  answer?: unknown
  aliases?: unknown
  tags?: unknown
  status?: unknown
}

const isValidStatus = (value: unknown): value is KnowledgeStatus => {
  return value === 'active' || value === 'inactive'
}

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0
}

const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

const isKnowledgeNotFoundError = (error: unknown): error is Error => {
  return (
    error instanceof Error &&
    error.message.startsWith('Knowledge item not found:')
  )
}

const getOptionalQuery = (value: string | undefined): string | undefined => {
  return value === undefined || value === '' ? undefined : value
}

const readKnowledgeBody = async (request: Request): Promise<KnowledgeBody | null> => {
  try {
    const body = await request.json()

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return null
    }

    return body as KnowledgeBody
  } catch {
    return null
  }
}

knowledgeRoutes.use('/api/knowledge', adminJwtAuthMiddleware)
knowledgeRoutes.use('/api/knowledge/*', adminJwtAuthMiddleware)

knowledgeRoutes.get('/api/knowledge', async (c) => {
  const rawStatus = c.req.query('status')

  if (rawStatus !== undefined && !isValidStatus(rawStatus)) {
    return c.json(
      {
        message: 'Invalid status query',
      },
      400,
    )
  }

  try {
    const items = await listKnowledge({
      status: rawStatus,
      tag: getOptionalQuery(c.req.query('tag')),
      keyword: getOptionalQuery(c.req.query('keyword')),
    })

    return c.json({
      items,
    })
  } catch (error) {
    console.error('Failed to list knowledge items:', error)

    return c.json(
      {
        message: 'Internal server error',
      },
      500,
    )
  }
})

knowledgeRoutes.post('/api/knowledge', async (c) => {
  const body = await readKnowledgeBody(c.req.raw)

  if (!body) {
    return c.json(
      {
        message: 'title, question and answer are required',
      },
      400,
    )
  }

  if (body.status !== undefined && !isValidStatus(body.status)) {
    return c.json(
      {
        message: 'Invalid status value',
      },
      400,
    )
  }

  if (
    !isNonEmptyString(body.title) ||
    !isNonEmptyString(body.question) ||
    !isNonEmptyString(body.answer)
  ) {
    return c.json(
      {
        message: 'title, question and answer are required',
      },
      400,
    )
  }

  try {
    const createdItem = await createKnowledge({
      title: body.title,
      question: body.question,
      answer: body.answer,
      aliases: isStringArray(body.aliases) ? body.aliases : undefined,
      tags: isStringArray(body.tags) ? body.tags : undefined,
      status: body.status,
    })

    return c.json(
      {
        item: createdItem,
      },
      201,
    )
  } catch (error) {
    console.error('Failed to create knowledge item:', error)

    return c.json(
      {
        message: 'Internal server error',
      },
      500,
    )
  }
})

knowledgeRoutes.put('/api/knowledge/:id', async (c) => {
  const body = await readKnowledgeBody(c.req.raw)

  if (!body) {
    return c.json(
      {
        message: 'title, question and answer are required',
      },
      400,
    )
  }

  if (body.status !== undefined && !isValidStatus(body.status)) {
    return c.json(
      {
        message: 'Invalid status value',
      },
      400,
    )
  }

  if (
    !isNonEmptyString(body.title) ||
    !isNonEmptyString(body.question) ||
    !isNonEmptyString(body.answer)
  ) {
    return c.json(
      {
        message: 'title, question and answer are required',
      },
      400,
    )
  }

  try {
    const updatedItem = await updateKnowledge(c.req.param('id'), {
      title: body.title,
      question: body.question,
      answer: body.answer,
      aliases: isStringArray(body.aliases) ? body.aliases : undefined,
      tags: isStringArray(body.tags) ? body.tags : undefined,
      status: body.status,
    })

    return c.json({
      item: updatedItem,
    })
  } catch (error) {
    if (isKnowledgeNotFoundError(error)) {
      return c.json(
        {
          message: error.message,
        },
        404,
      )
    }

    console.error('Failed to update knowledge item:', error)

    return c.json(
      {
        message: 'Internal server error',
      },
      500,
    )
  }
})

knowledgeRoutes.patch('/api/knowledge/:id/status', async (c) => {
  const body = await readKnowledgeBody(c.req.raw)

  if (!body || !isValidStatus(body.status)) {
    return c.json(
      {
        message: 'Invalid status value',
      },
      400,
    )
  }

  try {
    const updatedItem = await updateKnowledgeStatus(c.req.param('id'), body.status)

    return c.json({
      item: updatedItem,
    })
  } catch (error) {
    if (isKnowledgeNotFoundError(error)) {
      return c.json(
        {
          message: error.message,
        },
        404,
      )
    }

    console.error('Failed to update knowledge status:', error)

    return c.json(
      {
        message: 'Internal server error',
      },
      500,
    )
  }
})

knowledgeRoutes.delete('/api/knowledge/:id', async (c) => {
  try {
    await deleteKnowledge(c.req.param('id'))

    return c.json({
      success: true,
    })
  } catch (error) {
    if (isKnowledgeNotFoundError(error)) {
      return c.json(
        {
          message: error.message,
        },
        404,
      )
    }

    console.error('Failed to delete knowledge item:', error)

    return c.json(
      {
        message: 'Internal server error',
      },
      500,
    )
  }
})

export default knowledgeRoutes
