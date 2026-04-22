import type { KnowledgeItem } from '../types/knowledge.js'
import type {
  MatchKnowledgeResult,
  RetrievalAttemptTrace,
  RetrievalTrace,
} from '../types/retrieval.js'
import { generateAnswer } from './generateAnswer.js'
import { matchKnowledge } from './matchKnowledge.js'
import { rewriteQuery } from './queryRewrite.js'
import { saveQuestionLog } from './saveQuestionLog.js'

export interface RetrieveResult {
  matched: KnowledgeItem | null
  source: 'knowledge' | 'ai_fallback'
  answer: string
  trace: RetrievalTrace
}

const TRACE_CANDIDATE_LIMIT = 3

function buildAttemptTrace(
  stage: RetrievalAttemptTrace['stage'],
  query: string,
  matchResult: MatchKnowledgeResult | null,
): RetrievalAttemptTrace {
  return {
    stage,
    query,
    candidateCount: matchResult?.candidates.length ?? 0,
    selectedCandidateId: matchResult?.selectedCandidate.item.id ?? null,
    selectedCandidateTitle: matchResult?.selectedCandidate.item.title ?? null,
    topCandidates:
      matchResult?.candidates.slice(0, TRACE_CANDIDATE_LIMIT).map((candidate) => ({
        id: candidate.item.id,
        title: candidate.item.title,
        rawScore: candidate.rawScore,
        rerankScore: candidate.rerankScore,
        evidence: candidate.evidence,
        reasons: candidate.reasons,
      })) ?? [],
  }
}

export async function retrieve(question: string): Promise<RetrieveResult> {
  const originalMatch = await matchKnowledge({
    question,
    originalQuestion: question,
    stage: 'original',
  })
  const attempts: RetrievalAttemptTrace[] = [
    buildAttemptTrace('original', question, originalMatch),
  ]
  let matched = originalMatch
  let rewrittenQuestion: string | null = null
  let finalQuestion = question

  if (!matched) {
    const rewriteResult = rewriteQuery(question)
    rewrittenQuestion = rewriteResult.rewrittenQuestion

    if (rewrittenQuestion) {
      finalQuestion = rewrittenQuestion

      const rewrittenMatch = await matchKnowledge({
        question: rewrittenQuestion,
        originalQuestion: question,
        rewrittenQuestion,
        stage: 'rewritten',
      })

      attempts.push(
        buildAttemptTrace('rewritten', rewrittenQuestion, rewrittenMatch),
      )

      if (rewrittenMatch) {
        matched = rewrittenMatch
      }
    }
  }

  const trace: RetrievalTrace = {
    originalQuestion: question,
    rewrittenQuestion,
    finalQuestion,
    selectedStage: matched?.stage ?? null,
    attempts,
  }

  if (matched) {
    const answer = await generateAnswer(question, matched.item)
    await saveQuestionLog({
      question,
      matchedId: matched.item.id,
      matchedTitle: matched.item.title,
      source: 'knowledge',
      answer,
      retrieval: trace,
    })

    return {
      matched: matched.item,
      source: 'knowledge',
      answer,
      trace,
    }
  }

  const answer = await generateAnswer(question, null)
  await saveQuestionLog({
    question,
    matchedId: null,
    matchedTitle: null,
    source: 'ai_fallback',
    answer,
    retrieval: trace,
  })

  return {
    matched: null,
    source: 'ai_fallback',
    answer,
    trace,
  }
}
