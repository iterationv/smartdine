import type { KnowledgeItem } from './knowledge.js'

export type RetrievalStage = 'original' | 'rewritten'

export type KnowledgeSearchField = 'title' | 'question' | 'alias' | 'tag'

export type RetrievalReasonCode =
  | 'alias_phrase_match'
  | 'question_phrase_match'
  | 'title_phrase_match'
  | 'tag_phrase_match'
  | 'rewrite_consistency'

export interface RetrievalEvidence {
  source: KnowledgeSearchField
  text: string
  matchedTerms: string[]
}

export interface RetrievalCandidateSignals {
  aliasPhraseMatched: boolean
  questionPhraseMatched: boolean
  titlePhraseMatched: boolean
  tagPhraseMatched: boolean
  rewriteConsistent: boolean
  matchedTerms: string[]
}

export interface RetrievalCandidateReason {
  code: RetrievalReasonCode
  delta: number
}

export interface RetrievalCandidate {
  item: KnowledgeItem
  rawScore: number
  rerankScore: number
  evidence: RetrievalEvidence[]
  signals: RetrievalCandidateSignals
  reasons: RetrievalCandidateReason[]
}

export interface MatchKnowledgeInput {
  question: string
  originalQuestion?: string
  rewrittenQuestion?: string | null
  stage?: RetrievalStage
}

export interface MatchKnowledgeResult {
  item: KnowledgeItem
  selectedCandidate: RetrievalCandidate
  candidates: RetrievalCandidate[]
  stage: RetrievalStage
  query: string
}

export interface RetrievalAttemptTraceCandidate {
  id: string
  title: string
  rawScore: number
  rerankScore: number
  evidence: RetrievalEvidence[]
  reasons: RetrievalCandidateReason[]
}

export interface RetrievalAttemptTrace {
  stage: RetrievalStage
  query: string
  candidateCount: number
  selectedCandidateId: string | null
  selectedCandidateTitle: string | null
  topCandidates: RetrievalAttemptTraceCandidate[]
}

export interface RetrievalTrace {
  originalQuestion: string
  rewrittenQuestion: string | null
  finalQuestion: string
  selectedStage: RetrievalStage | null
  attempts: RetrievalAttemptTrace[]
}

export interface QueryRewriteResult {
  originalQuestion: string
  rewrittenQuestion: string | null
  appliedRules: string[]
}

export interface VectorSearchCandidate {
  id: string
  score: number
}
