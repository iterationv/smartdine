import type { RetrievalTrace } from './retrieval.js'

export type QuestionLogSource = 'knowledge' | 'faq' | 'ai_fallback'

export interface QuestionLog {
  id: string
  question: string
  matchedId: string | null
  matchedTitle: string | null
  source: QuestionLogSource
  answer: string
  retrieval?: RetrievalTrace
  createdAt: string
}

export interface MissedQuestion {
  id: string
  question: string
  createdAt: string
  convertedToKnowledge: boolean
}
