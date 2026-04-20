import type { KnowledgeItem } from '../types/knowledge.js'
import { generateAnswer } from './generateAnswer.js'
import { matchKnowledge } from './matchKnowledge.js'

export interface RetrieveResult {
  matched: KnowledgeItem | null
  source: 'knowledge' | 'ai_fallback'
  answer: string
}

export async function retrieve(question: string): Promise<RetrieveResult> {
  const matched = await matchKnowledge(question)

  if (matched) {
    const answer = await generateAnswer(question, matched)

    return {
      matched,
      source: 'knowledge',
      answer,
    }
  }

  const answer = await generateAnswer(question, null)

  return {
    matched: null,
    source: 'ai_fallback',
    answer,
  }
}
