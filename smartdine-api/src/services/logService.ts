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
