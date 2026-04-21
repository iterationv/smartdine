import {
  readMissedQuestions,
  readQuestionLogs,
} from '../data/logStore.js'
import type { MissedQuestion, QuestionLog } from '../types/log.js'

const DEFAULT_PAGE = 1
const DEFAULT_SIZE = 20

export interface ListQuestionLogsParams {
  page?: number
  size?: number
  keyword?: string
}

export interface ListQuestionLogsResult {
  list: QuestionLog[]
  total: number
  page: number
  size: number
}

export interface ListMissedQuestionsParams {
  page?: number
  size?: number
  keyword?: string
  startDate?: string
  endDate?: string
}

export interface ListMissedQuestionsResult {
  list: MissedQuestion[]
  total: number
  page: number
  size: number
}

export type LogStatsRange = 'today' | '7d' | '30d'

export interface LogStatsItem {
  question: string
  count: number
}

export interface LogStatsResult {
  topQuestions: LogStatsItem[]
  missedCount: number
}

function normalizePositiveInteger(value: unknown, fallbackValue: number): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 1
  ) {
    return fallbackValue
  }

  return value
}

function normalizeKeyword(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().toLowerCase()
}

function parseOptionalDate(value: unknown, errorMessage: string): number | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalizedValue = value.trim()

  if (normalizedValue === '') {
    return null
  }

  const timestamp = Date.parse(normalizedValue)

  if (Number.isNaN(timestamp)) {
    throw new Error(errorMessage)
  }

  return timestamp
}

function getCreatedAtTimestamp(createdAt: string): number {
  const timestamp = Date.parse(createdAt)

  if (Number.isNaN(timestamp)) {
    return 0
  }

  return timestamp
}

function sortByCreatedAtDesc<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort(
    (left, right) =>
      getCreatedAtTimestamp(right.createdAt) -
      getCreatedAtTimestamp(left.createdAt),
  )
}

function paginateList<T>(items: T[], page: number, size: number): T[] {
  const startIndex = (page - 1) * size
  const endIndex = startIndex + size

  return items.slice(startIndex, endIndex)
}

function includesKeyword(value: string | null, keyword: string): boolean {
  if (!value) {
    return false
  }

  return value.toLowerCase().includes(keyword)
}

function normalizeStatsRange(value: unknown): LogStatsRange {
  if (value === 'today' || value === '7d' || value === '30d') {
    return value
  }

  return '7d'
}

function getRangeStartTimestamp(range: LogStatsRange): number {
  const now = new Date()
  const startDate = new Date(now)

  startDate.setHours(0, 0, 0, 0)

  if (range === '7d') {
    startDate.setDate(startDate.getDate() - 6)
  }

  if (range === '30d') {
    startDate.setDate(startDate.getDate() - 29)
  }

  return startDate.getTime()
}

function buildTopQuestions(items: QuestionLog[]): LogStatsItem[] {
  const counter = new Map<string, number>()

  for (const item of items) {
    const question = item.question.trim()

    if (!question) {
      continue
    }

    counter.set(question, (counter.get(question) ?? 0) + 1)
  }

  return [...counter.entries()]
    .map(([question, count]) => ({ question, count }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count
      }

      return left.question.localeCompare(right.question, 'zh-CN')
    })
    .slice(0, 10)
}

export async function listQuestionLogs(
  params: ListQuestionLogsParams = {},
): Promise<ListQuestionLogsResult> {
  const page = normalizePositiveInteger(params.page, DEFAULT_PAGE)
  const size = normalizePositiveInteger(params.size, DEFAULT_SIZE)
  const keyword = normalizeKeyword(params.keyword)
  const items = sortByCreatedAtDesc(await readQuestionLogs())
  const filteredItems = items.filter((item) => {
    if (keyword === '') {
      return true
    }

    return (
      includesKeyword(item.question, keyword) ||
      includesKeyword(item.matchedTitle, keyword) ||
      includesKeyword(item.answer, keyword)
    )
  })

  return {
    list: paginateList(filteredItems, page, size),
    total: filteredItems.length,
    page,
    size,
  }
}

export async function listMissedQuestions(
  params: ListMissedQuestionsParams = {},
): Promise<ListMissedQuestionsResult> {
  const page = normalizePositiveInteger(params.page, DEFAULT_PAGE)
  const size = normalizePositiveInteger(params.size, DEFAULT_SIZE)
  const keyword = normalizeKeyword(params.keyword)
  const startDate = parseOptionalDate(params.startDate, 'Invalid startDate.')
  const endDate = parseOptionalDate(params.endDate, 'Invalid endDate.')
  const items = sortByCreatedAtDesc(await readMissedQuestions())
  const filteredItems = items.filter((item) => {
    const createdAtTimestamp = Date.parse(item.createdAt)

    if (keyword !== '' && !includesKeyword(item.question, keyword)) {
      return false
    }

    if (
      startDate !== null &&
      (Number.isNaN(createdAtTimestamp) || createdAtTimestamp < startDate)
    ) {
      return false
    }

    if (
      endDate !== null &&
      (Number.isNaN(createdAtTimestamp) || createdAtTimestamp > endDate)
    ) {
      return false
    }

    return true
  })

  return {
    list: paginateList(filteredItems, page, size),
    total: filteredItems.length,
    page,
    size,
  }
}

export async function getLogStats(
  range: LogStatsRange | string = '7d',
): Promise<LogStatsResult> {
  const normalizedRange = normalizeStatsRange(range)
  const startTimestamp = getRangeStartTimestamp(normalizedRange)
  const endTimestamp = Date.now()
  const items = await readQuestionLogs()
  const filteredItems = items.filter((item) => {
    const createdAtTimestamp = getCreatedAtTimestamp(item.createdAt)

    return (
      createdAtTimestamp >= startTimestamp &&
      createdAtTimestamp <= endTimestamp
    )
  })

  return {
    topQuestions: buildTopQuestions(filteredItems),
    missedCount: filteredItems.filter((item) => item.source === 'ai_fallback')
      .length,
  }
}
