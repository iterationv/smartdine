import { serve } from '@hono/node-server'
import { Hono, type Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { aiConfig, appConfig } from './config.js'
import {
  addFaq,
  deleteFaq,
  getFaqList,
  updateFaq,
  type CreateFaqInput,
  type UpdateFaqInput,
} from './faq.js'
import { retrieve } from './ai/retrieve.js'
import { authMiddleware } from './middleware/auth.js'
import { corsMiddleware } from './middleware/cors.js'
import knowledgeRoutes from './routes/knowledge.js'
import logsRoutes from './routes/logs.js'

const app = new Hono()

type ChatRequestBody = {
  question?: unknown
}

const isObjectBody = (value: unknown): value is Record<string, unknown> => {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0
}

const normalizeTags = (value: unknown): string[] | null => {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    return null
  }

  const tags = value.map((item) => item.trim())

  return tags.every((item) => item.length > 0) ? tags : null
}

const parseQuestionBody = async (request: Request): Promise<string> => {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    throw new Error('question is required')
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('question is required')
  }

  const { question } = body as ChatRequestBody

  if (typeof question !== 'string') {
    throw new Error('question is required')
  }

  const trimmedQuestion = question.trim()

  if (!trimmedQuestion) {
    throw new Error('question is required')
  }

  return trimmedQuestion
}

const parseCreateFaqBody = async (
  request: Request,
): Promise<CreateFaqInput | null> => {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return null
  }

  if (!isObjectBody(body)) {
    return null
  }

  const { id, question, answer, tags } = body
  const normalizedTags = normalizeTags(tags)

  if (
    !isNonEmptyString(id) ||
    !isNonEmptyString(question) ||
    !isNonEmptyString(answer) ||
    !normalizedTags
  ) {
    return null
  }

  return {
    id: id.trim(),
    question: question.trim(),
    answer: answer.trim(),
    tags: normalizedTags,
  }
}

const parseUpdateFaqBody = async (
  request: Request,
): Promise<UpdateFaqInput | null> => {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return null
  }

  if (!isObjectBody(body)) {
    return null
  }

  const updatePayload: UpdateFaqInput = {}

  if ('question' in body) {
    if (!isNonEmptyString(body.question)) {
      return null
    }

    updatePayload.question = body.question.trim()
  }

  if ('answer' in body) {
    if (!isNonEmptyString(body.answer)) {
      return null
    }

    updatePayload.answer = body.answer.trim()
  }

  if ('tags' in body) {
    const normalizedTags = normalizeTags(body.tags)

    if (!normalizedTags) {
      return null
    }

    updatePayload.tags = normalizedTags
  }

  return Object.keys(updatePayload).length > 0 ? updatePayload : null
}

const jsonUtf8 = (
  c: Context,
  data: unknown,
  status: ContentfulStatusCode = 200,
) => {
  c.header('Content-Type', 'application/json; charset=utf-8')
  c.header('X-Content-Type-Options', 'nosniff')

  return c.body(JSON.stringify(data), status)
}

const isFaqBusinessError = (error: unknown): error is Error => {
  return (
    error instanceof Error &&
    /^FAQ with id ".*" (already exists|does not exist)\.$/.test(error.message)
  )
}

app.use('*', corsMiddleware)

app.get('/', (c) => {
  return c.text('SmartDine API is running')
})

app.get('/health', (c) => {
  return jsonUtf8(c, {
    status: 'ok',
    timestamp: Date.now(),
    provider: aiConfig.provider,
    model: aiConfig.model,
  })
})

app.route('/', knowledgeRoutes)
app.route('/', logsRoutes)

app.use('/chat', authMiddleware)
app.use('/admin/faq', authMiddleware)
app.use('/admin/faq/*', authMiddleware)

app.post('/chat', async (c) => {
  let question: string

  try {
    question = await parseQuestionBody(c.req.raw)
  } catch {
    return jsonUtf8(
      c,
      {
        message: 'question is required',
      },
      400,
    )
  }

  try {
    const result = await retrieve(question)

    return jsonUtf8(c, {
      answer: result.answer,
      source: result.source,
      matched: result.matched
        ? {
            id: result.matched.id,
            title: result.matched.title,
          }
        : null,
    })
  } catch (error) {
    console.error('Failed to process /chat request:', error)

    return jsonUtf8(
      c,
      {
        message: 'Failed to process chat request',
      },
      500,
    )
  }
})

app.get('/admin/faq', async (c) => {
  try {
    const list = await getFaqList()

    return jsonUtf8(c, list)
  } catch (error) {
    console.error('Failed to process FAQ request:', error)

    return jsonUtf8(
      c,
      {
        message: 'Failed to process FAQ request',
      },
      500,
    )
  }
})

app.post('/admin/faq', async (c) => {
  const payload = await parseCreateFaqBody(c.req.raw)

  if (!payload) {
    return jsonUtf8(
      c,
      {
        message: 'Invalid FAQ payload',
      },
      400,
    )
  }

  try {
    const item = await addFaq(payload)

    return jsonUtf8(c, item, 201)
  } catch (error) {
    if (isFaqBusinessError(error)) {
      return jsonUtf8(
        c,
        {
          message: error.message,
        },
        400,
      )
    }

    console.error('Failed to process FAQ request:', error)

    return jsonUtf8(
      c,
      {
        message: 'Failed to process FAQ request',
      },
      500,
    )
  }
})

app.put('/admin/faq/:id', async (c) => {
  const id = c.req.param('id').trim()
  const payload = await parseUpdateFaqBody(c.req.raw)

  if (!id || !payload) {
    return jsonUtf8(
      c,
      {
        message: 'Invalid FAQ payload',
      },
      400,
    )
  }

  try {
    const item = await updateFaq(id, payload)

    return jsonUtf8(c, item)
  } catch (error) {
    if (isFaqBusinessError(error)) {
      return jsonUtf8(
        c,
        {
          message: error.message,
        },
        400,
      )
    }

    console.error('Failed to process FAQ request:', error)

    return jsonUtf8(
      c,
      {
        message: 'Failed to process FAQ request',
      },
      500,
    )
  }
})

app.delete('/admin/faq/:id', async (c) => {
  const id = c.req.param('id').trim()

  if (!id) {
    return jsonUtf8(
      c,
      {
        message: 'Invalid FAQ payload',
      },
      400,
    )
  }

  try {
    await deleteFaq(id)

    return jsonUtf8(c, {
      success: true,
    })
  } catch (error) {
    if (isFaqBusinessError(error)) {
      return jsonUtf8(
        c,
        {
          message: error.message,
        },
        400,
      )
    }

    console.error('Failed to process FAQ request:', error)

    return jsonUtf8(
      c,
      {
        message: 'Failed to process FAQ request',
      },
      500,
    )
  }
})

serve(
  {
    fetch: app.fetch,
    port: appConfig.port,
  },
  (info) => {
    console.log(`Server is running on http://127.0.0.1:${info.port}`)
  },
)

export default app
