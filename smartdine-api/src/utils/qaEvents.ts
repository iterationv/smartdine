import { appendFile, mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'

export type QaEventConfidence =
  | 'high'
  | 'low'
  | 'ambiguous'
  | 'unknown_entity'

export interface QaEvent {
  requestId: string
  timestamp: string
  queryDigest: string
  queryLength: number
  confidence: QaEventConfidence
  fallbackReason: string | null
  topMatchId: string | null
  topScore: number | null
  duration: number
}

export interface QueryQaEventsOptions {
  date?: string
  page?: number
  limit?: number
  confidence?: QaEventConfidence[]
}

export interface QueryQaEventsResult {
  items: QaEvent[]
  list: QaEvent[]
  total: number
  page: number
  limit: number
  date: string
}

const LOG_DIR = path.resolve(process.cwd(), 'logs')
const QUERY_MAX_LENGTH = 100
const DEFAULT_QUERY_PAGE = 1
const DEFAULT_QUERY_LIMIT = 20
const MAX_QUERY_LIMIT = 100
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function padNumber(value: number): string {
  return String(value).padStart(2, '0')
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`
}

function getDateKey(timestamp: string): string {
  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) {
    return timestamp.slice(0, 10)
  }

  return formatDateKey(date)
}

function getTodayDateKey(): string {
  return formatDateKey(new Date())
}

function normalizeDateKey(value: string | undefined): string {
  if (!value || !DATE_KEY_PATTERN.test(value)) {
    return getTodayDateKey()
  }

  return value
}

function normalizePositiveInteger(
  value: number | undefined,
  fallbackValue: number,
): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.trunc(value)
    : fallbackValue
}

function getLogFilePathByDateKey(dateKey: string): string {
  return path.join(LOG_DIR, `qa-events-${dateKey}.jsonl`)
}

function getLogFilePath(timestamp: string): string {
  return getLogFilePathByDateKey(getDateKey(timestamp))
}

export function digestQuery(query: string): string {
  const normalizedQuery = query.replace(/\s+/g, ' ').trim()

  return normalizedQuery.length > QUERY_MAX_LENGTH
    ? `${normalizedQuery.slice(0, QUERY_MAX_LENGTH)}...`
    : normalizedQuery
}

export function logQaEvent(event: QaEvent): void {
  const line = `${JSON.stringify(event)}\n`

  void (async () => {
    try {
      await mkdir(LOG_DIR, { recursive: true })
      await appendFile(getLogFilePath(event.timestamp), line, 'utf8')
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

    if (
      !value ||
      typeof value.requestId !== 'string' ||
      typeof value.timestamp !== 'string' ||
      Number.isNaN(new Date(value.timestamp).getTime()) ||
      typeof value.queryDigest !== 'string' ||
      typeof value.queryLength !== 'number'
    ) {
      return null
    }

    return value
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
  const date = normalizeDateKey(options.date)
  const page = normalizePositiveInteger(options.page, DEFAULT_QUERY_PAGE)
  const limit = Math.min(
    normalizePositiveInteger(options.limit, DEFAULT_QUERY_LIMIT),
    MAX_QUERY_LIMIT,
  )
  const confidenceFilters = new Set(options.confidence ?? [])
  const events = (await readLogFile(getLogFilePathByDateKey(date)))
    .filter(
      (event) =>
        confidenceFilters.size === 0 || confidenceFilters.has(event.confidence),
    )
    .sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
    )
  const startIndex = (page - 1) * limit
  const items = events.slice(startIndex, startIndex + limit)

  return {
    items,
    list: items,
    total: events.length,
    page,
    limit,
    date,
  }
}
