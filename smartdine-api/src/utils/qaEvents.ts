import { appendFile, mkdir, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

export type QaEventConfidence =
  | 'high'
  | 'low'
  | 'ambiguous'
  | 'unknown_entity'

export interface QaEvent {
  requestId: string
  timestamp: number
  query: string
  confidence: QaEventConfidence
  fallbackReason: string | null
  topMatchId: string | null
  topScore: number
  duration: number
}

export interface QueryQaEventsOptions {
  limit?: number
  confidence?: QaEventConfidence
}

export interface QueryQaEventsResult {
  list: QaEvent[]
  total: number
}

const LOG_DIR = path.resolve(process.cwd(), 'logs')
const QUERY_MAX_LENGTH = 200
const DEFAULT_QUERY_LIMIT = 20
const MAX_QUERY_LIMIT = 100

function getDateKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10)
}

function getLogFilePath(timestamp: number): string {
  return path.join(LOG_DIR, `qa-events-${getDateKey(timestamp)}.jsonl`)
}

export function sanitizeQuery(query: string): string {
  const normalizedQuery = query.replace(/\s+/g, ' ').trim()

  return normalizedQuery.length > QUERY_MAX_LENGTH
    ? normalizedQuery.slice(0, QUERY_MAX_LENGTH)
    : normalizedQuery
}

export function logQaEvent(event: QaEvent): void {
  const safeEvent: QaEvent = {
    ...event,
    query: sanitizeQuery(event.query),
  }
  const line = `${JSON.stringify(safeEvent)}\n`

  void (async () => {
    try {
      await mkdir(LOG_DIR, { recursive: true })
      await appendFile(getLogFilePath(safeEvent.timestamp), line, 'utf8')
    } catch (error) {
      console.error('Failed to write QA event log:', error)
    }
  })()
}

function parseQaEventLine(line: string): QaEvent | null {
  if (!line.trim()) {
    return null
  }

  try {
    const value = JSON.parse(line) as QaEvent

    return value && typeof value.requestId === 'string' ? value : null
  } catch {
    return null
  }
}

async function readLogFile(filePath: string): Promise<QaEvent[]> {
  try {
    const content = await readFile(filePath, 'utf8')

    return content
      .split(/\r?\n/)
      .map(parseQaEventLine)
      .filter((event): event is QaEvent => event !== null)
  } catch {
    return []
  }
}

export async function queryQaEvents(
  options: QueryQaEventsOptions = {},
): Promise<QueryQaEventsResult> {
  const limit = Math.min(
    Math.max(options.limit ?? DEFAULT_QUERY_LIMIT, 1),
    MAX_QUERY_LIMIT,
  )

  let fileNames: string[] = []

  try {
    fileNames = await readdir(LOG_DIR)
  } catch {
    return {
      list: [],
      total: 0,
    }
  }

  const events = (
    await Promise.all(
      fileNames
        .filter((fileName) => /^qa-events-\d{4}-\d{2}-\d{2}\.jsonl$/.test(fileName))
        .sort()
        .map((fileName) => readLogFile(path.join(LOG_DIR, fileName))),
    )
  )
    .flat()
    .filter(
      (event) => !options.confidence || event.confidence === options.confidence,
    )
    .sort((left, right) => right.timestamp - left.timestamp)

  return {
    list: events.slice(0, limit),
    total: events.length,
  }
}
