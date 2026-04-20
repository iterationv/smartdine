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
  return readJsonArray<MissedQuestion>(
    MISSED_QUESTIONS_FILE_PATH,
    'Missed questions data must be a JSON array.',
  )
}

export async function writeMissedQuestions(
  items: MissedQuestion[],
): Promise<void> {
  await writeJsonArray(MISSED_QUESTIONS_FILE_PATH, items)
}
