import { askLLM } from '../llm.js'
import type { KnowledgeItem } from '../types/knowledge.js'
import { buildContext } from './buildContext.js'

const UNMATCHED_PREFIX = '这个问题暂时没有找到准确答案，以下仅供参考：'
const EMPTY_ANSWER_FALLBACK = '暂时无法生成回答，请稍后再试。'

function finalizeAnswer(answer: string, matched: KnowledgeItem | null): string {
  const trimmedAnswer = answer.trim()

  if (!trimmedAnswer) {
    return matched
      ? EMPTY_ANSWER_FALLBACK
      : `${UNMATCHED_PREFIX}${EMPTY_ANSWER_FALLBACK}`
  }

  return matched ? trimmedAnswer : `${UNMATCHED_PREFIX}${trimmedAnswer}`
}

export async function generateAnswer(
  question: string,
  matched: KnowledgeItem | null,
): Promise<string> {
  const context = buildContext(question, matched)
  const answer = matched
    ? await askLLM({
        userQuestion: context,
        matchedFaq: {
          question: matched.question,
          answer: matched.answer,
        },
      })
    : await askLLM({
        userQuestion: context,
      })

  return finalizeAnswer(answer, matched)
}
