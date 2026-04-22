import { readActiveKnowledgeList } from '../data/knowledgeStore.js'
import type {
  MatchKnowledgeInput,
  MatchKnowledgeResult,
  RetrievalStage,
} from '../types/retrieval.js'
import { rerankKnowledgeCandidates, shouldAcceptCandidate } from './rerankKnowledgeCandidates.js'
import { scoreKnowledgeCandidates } from './scoreKnowledgeCandidates.js'
import { normalizeQuestionText } from './searchText.js'

function normalizeMatchInput(input: string | MatchKnowledgeInput): MatchKnowledgeInput {
  if (typeof input === 'string') {
    return {
      question: input,
      originalQuestion: input,
      rewrittenQuestion: null,
      stage: 'original',
    }
  }

  return {
    stage: 'original',
    rewrittenQuestion: null,
    originalQuestion: input.question,
    ...input,
  }
}

export async function matchKnowledge(
  input: string | MatchKnowledgeInput,
): Promise<MatchKnowledgeResult | null> {
  const normalizedInput = normalizeMatchInput(input)
  const normalizedQuestion = normalizeQuestionText(normalizedInput.question)

  if (!normalizedQuestion) {
    return null
  }

  const items = await readActiveKnowledgeList()
  const rawCandidates = scoreKnowledgeCandidates(normalizedQuestion, items)
  const rerankedCandidates = rerankKnowledgeCandidates(rawCandidates, {
    originalQuestion: normalizedInput.originalQuestion ?? normalizedInput.question,
    rewrittenQuestion: normalizedInput.rewrittenQuestion ?? null,
  })
  const bestCandidate = rerankedCandidates[0] ?? null

  if (!shouldAcceptCandidate(bestCandidate)) {
    return null
  }

  return {
    item: bestCandidate.item,
    selectedCandidate: bestCandidate,
    candidates: rerankedCandidates,
    stage: (normalizedInput.stage ?? 'original') as RetrievalStage,
    query: normalizedInput.question,
  }
}
