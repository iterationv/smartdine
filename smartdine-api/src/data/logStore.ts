import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { MissedQuestion, QuestionLog } from '../types/log.js'

const QUESTION_LOGS_FILE_PATH = path.resolve(
  process.cwd(),
  'src/data/questionLogs.json',
)
const MISSED_QUESTIONS_FILE_PATH = path.resolve(
  process.cwd(),
  'src/data/missedQuestions.json',
)

async function readJsonArray<T>(
  filePath: string,
  errorMessage: string,
): Promise<T[]> {
  try {
    const content = await readFile(filePath, 'utf8')
    const parsed = JSON.parse(content) as unknown

    if (!Array.isArray(parsed)) {
      throw new Error(errorMessage)
    }

    return parsed as T[]
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }

    throw error
  }
}

async function writeJsonArray<T>(filePath: string, items: T[]): Promise<void> {
  const content = JSON.stringify(items, null, 2)

  await writeFile(filePath, `${content}\n`, 'utf8')
}

function normalizeMissedQuestion(
  item: unknown,
  index: number,
): MissedQuestion | null {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return null
  }

  const source = item as Record<string, unknown>

  return {
    id:
      typeof source.id === 'string' && source.id.trim().length > 0
        ? source.id.trim()
        : `missed_${index}`,
    question: typeof source.question === 'string' ? source.question.trim() : '',
    createdAt: typeof source.createdAt === 'string' ? source.createdAt : '',
    convertedToKnowledge: source.convertedToKnowledge === true,
    handled: source.handled === true,
  }
}

export async function readQuestionLogs(): Promise<QuestionLog[]> {
  return readJsonArray<QuestionLog>(
    QUESTION_LOGS_FILE_PATH,
    'Question logs data must be a JSON array.',
  )
}

export async function writeQuestionLogs(items: QuestionLog[]): Promise<void> {
  await writeJsonArray(QUESTION_LOGS_FILE_PATH, items)
}

export async function readMissedQuestions(): Promise<MissedQuestion[]> {
  const items = await readJsonArray<unknown>(
    MISSED_QUESTIONS_FILE_PATH,
    'Missed questions data must be a JSON array.',
  )

  return items
    .map((item, index) => normalizeMissedQuestion(item, index))
    .filter((item): item is MissedQuestion => item !== null)
}

export async function writeMissedQuestions(
  items: MissedQuestion[],
): Promise<void> {
  await writeJsonArray(MISSED_QUESTIONS_FILE_PATH, items)
}

export async function updateMissedQuestion(
  id: string,
  updates: Partial<Pick<MissedQuestion, 'handled' | 'convertedToKnowledge'>>,
): Promise<MissedQuestion> {
  const items = await readMissedQuestions()
  const targetIndex = items.findIndex((item) => item.id === id)

  if (targetIndex === -1) {
    throw new Error(`Missed question not found: ${id}`)
  }

  const existingItem = items[targetIndex]
  const updatedItem: MissedQuestion = {
    ...existingItem,
    convertedToKnowledge:
      updates.convertedToKnowledge ?? existingItem.convertedToKnowledge,
    handled: updates.handled ?? existingItem.handled,
  }

  items[targetIndex] = updatedItem
  await writeMissedQuestions(items)

  return updatedItem
}
