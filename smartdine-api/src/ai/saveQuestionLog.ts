import {
  readMissedQuestions,
  readQuestionLogs,
  writeMissedQuestions,
  writeQuestionLogs,
} from '../data/logStore.js'
import type {
  MissedQuestion,
  QuestionLog,
  QuestionLogSource,
} from '../types/log.js'

export interface SaveQuestionLogParams {
  question: string
  matchedId?: string | null
  matchedTitle?: string | null
  source: QuestionLogSource
  answer: string
}

function createLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function createMissedQuestionId(): string {
  return `missed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export async function saveQuestionLog(
  params: SaveQuestionLogParams,
): Promise<QuestionLog> {
  const createdAt = new Date().toISOString()
  const questionLogs = await readQuestionLogs()
  const newQuestionLog: QuestionLog = {
    id: createLogId(),
    question: params.question,
    matchedId: params.matchedId ?? null,
    matchedTitle: params.matchedTitle ?? null,
    source: params.source,
    answer: params.answer,
    createdAt,
  }

  await writeQuestionLogs([...questionLogs, newQuestionLog])

  if (params.source === 'ai_fallback') {
    const missedQuestions = await readMissedQuestions()
    const newMissedQuestion: MissedQuestion = {
      id: createMissedQuestionId(),
      question: params.question,
      createdAt,
      convertedToKnowledge: false,
    }

    await writeMissedQuestions([...missedQuestions, newMissedQuestion])
  }

  return newQuestionLog
}
