import type {
  RetrievalCandidate,
  RetrievalCandidateReason,
} from '../types/retrieval.js'
import {
  extractMeaningfulSearchTerms,
  intersectSearchTerms,
} from './searchText.js'

interface RerankContext {
  originalQuestion: string
  rewrittenQuestion: string | null
}

const RERANK_CONFIG = {
  candidateWindow: 5,
  minimumAcceptedScore: 1.2,
  weights: {
    aliasPhraseMatch: 1.4,
    questionPhraseMatch: 1.0,
    titlePhraseMatch: 0.7,
    tagPhraseMatch: 0.55,
    rewriteConsistency: 0.45,
  },
} as const

function buildRerankReasons(candidate: RetrievalCandidate): RetrievalCandidateReason[] {
  const reasons: RetrievalCandidateReason[] = []

  if (candidate.signals.aliasPhraseMatched) {
    reasons.push({
      code: 'alias_phrase_match',
      delta: RERANK_CONFIG.weights.aliasPhraseMatch,
    })
  }

  if (candidate.signals.questionPhraseMatched) {
    reasons.push({
      code: 'question_phrase_match',
      delta: RERANK_CONFIG.weights.questionPhraseMatch,
    })
  }

  if (candidate.signals.titlePhraseMatched) {
    reasons.push({
      code: 'title_phrase_match',
      delta: RERANK_CONFIG.weights.titlePhraseMatch,
    })
  }

  if (candidate.signals.tagPhraseMatched) {
    reasons.push({
      code: 'tag_phrase_match',
      delta: RERANK_CONFIG.weights.tagPhraseMatch,
    })
  }

  if (candidate.signals.rewriteConsistent) {
    reasons.push({
      code: 'rewrite_consistency',
      delta: RERANK_CONFIG.weights.rewriteConsistency,
    })
  }

  return reasons
}

function markRewriteConsistency(
  candidate: RetrievalCandidate,
  context: RerankContext,
): RetrievalCandidate {
  if (!context.rewrittenQuestion) {
    return candidate
  }

  const matchedTerms = candidate.signals.matchedTerms
  const originalTerms = extractMeaningfulSearchTerms(context.originalQuestion)
  const rewrittenTerms = extractMeaningfulSearchTerms(context.rewrittenQuestion)
  const matchesOriginal = intersectSearchTerms(matchedTerms, originalTerms).length > 0
  const matchesRewritten =
    intersectSearchTerms(matchedTerms, rewrittenTerms).length ===
    [...new Set(rewrittenTerms)].length

  return {
    ...candidate,
    signals: {
      ...candidate.signals,
      rewriteConsistent: matchesOriginal && matchesRewritten,
    },
  }
}

function sortCandidates(
  left: RetrievalCandidate,
  right: RetrievalCandidate,
): number {
  if (right.rerankScore !== left.rerankScore) {
    return right.rerankScore - left.rerankScore
  }

  if (right.rawScore !== left.rawScore) {
    return right.rawScore - left.rawScore
  }

  if (right.signals.matchedTerms.length !== left.signals.matchedTerms.length) {
    return right.signals.matchedTerms.length - left.signals.matchedTerms.length
  }

  return left.item.title.localeCompare(right.item.title, 'zh-CN')
}

export function rerankKnowledgeCandidates(
  candidates: RetrievalCandidate[],
  context: RerankContext,
): RetrievalCandidate[] {
  if (candidates.length === 0) {
    return []
  }

  const rerankWindow = candidates.slice(0, RERANK_CONFIG.candidateWindow).map((candidate) => {
    const candidateWithRewriteSignal = markRewriteConsistency(candidate, context)
    const reasons = buildRerankReasons(candidateWithRewriteSignal)
    const rerankScore =
      candidateWithRewriteSignal.rawScore +
      reasons.reduce((totalScore, reason) => totalScore + reason.delta, 0)

    return {
      ...candidateWithRewriteSignal,
      rerankScore,
      reasons,
    }
  })

  const untouchedCandidates = candidates.slice(RERANK_CONFIG.candidateWindow)

  return [...rerankWindow, ...untouchedCandidates].sort(sortCandidates)
}

export function shouldAcceptCandidate(
  candidate: RetrievalCandidate | null,
): boolean {
  if (!candidate) {
    return false
  }

  return (
    candidate.rerankScore >= RERANK_CONFIG.minimumAcceptedScore &&
    (candidate.signals.aliasPhraseMatched ||
      candidate.signals.questionPhraseMatched ||
      candidate.signals.titlePhraseMatched ||
      candidate.signals.tagPhraseMatched ||
      candidate.signals.matchedTerms.length >= 2)
  )
}
