import type { KnowledgeItem } from '../types/knowledge.js'
import type {
  ConfidenceLevel,
  FallbackReason,
  MatchKnowledgeResult,
  RetrievalCandidate,
  RetrievalCandidateHint,
  RetrievalDecision,
  RetrievalAttemptTrace,
  RetrievalTrace,
} from '../types/retrieval.js'
import { generateAnswer } from './generateAnswer.js'
import { matchKnowledge } from './matchKnowledge.js'
import { rewriteQuery } from './queryRewrite.js'
import { saveQuestionLog } from './saveQuestionLog.js'
import {
  extractKnowledgeContentTokens,
  getKnowledgeTokenSet,
} from './knowledgeTokenSet.js'
import { normalizeQuestionText } from './searchText.js'

export interface RetrieveResult {
  matched: KnowledgeItem | null
  source: 'knowledge' | 'ai_fallback'
  answer: string
  confidence: ConfidenceLevel
  fallbackReason: FallbackReason
  candidates?: RetrievalCandidateHint[]
  trace: RetrievalTrace
}

const TRACE_CANDIDATE_LIMIT = 3
export const LOW_CONFIDENCE_ABS_THRESHOLD = 8
export const LOW_CONFIDENCE_GAP_RATIO = 0.04
export const UNKNOWN_ENTITY_TOKEN_THRESHOLD = 3
const AMBIGUOUS_CANDIDATE_SCORE_RATIO = 0.35
const AMBIGUOUS_CANDIDATE_LIMIT = 3
const UNKNOWN_TOKEN_DISPLAY_LIMIT = 3
const OUT_OF_SCOPE_HINT_TERMS = [
  '火星',
  '月球',
  '外太空',
  '打印机',
  '直升机',
  '基因',
  '检测',
  '宠物',
  '托管',
  '区块链',
  '报销',
  '宇宙',
  '发票',
  '量子',
  '传送',
  '简历',
  '天气',
  '比特币',
  '投资',
  '手机',
  '电脑',
  '配件',
  '治好',
] as const
const AMBIGUOUS_CONNECTOR_TERMS = [
  '、',
  '，',
  ',',
  '和',
  '以及',
  '还有',
  '又',
  '同时',
  '然后',
  '顺便',
  '但',
] as const
const VAGUE_QUERY_TERMS = ['怎么弄', '怎么搞', '咋弄'] as const
const AVAILABLE_TOPIC_HINT =
  '你可以询问菜品、套餐、支付、营业时间、饮食需求、外带或停车等食堂相关问题。'
const BENIGN_UNKNOWN_QUERY_TERMS = [
  '中午',
  '早上',
  '晚上',
  '今天',
  '现在',
  '这里',
  '这边',
  '店里',
  '窗口',
  '顺便',
  '大概',
  '比较',
  '一点',
  '同时',
  '然后',
  '过去',
  '进来',
  '开着',
  '菜单上',
  '选好',
  '开车',
  '吃饭',
  '点餐',
  '好菜',
  '以后',
  '点但',
  '但怕',
  '菜汤',
  '汤面',
] as const

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

function buildCandidateHints(
  candidates: RetrievalCandidate[],
): RetrievalCandidateHint[] {
  return candidates.slice(0, AMBIGUOUS_CANDIDATE_LIMIT).map((candidate) => ({
    id: candidate.item.id,
    question: candidate.item.question,
  }))
}

function normalizeForSignal(text: string): string {
  return normalizeQuestionText(text).replace(/\s+/g, '')
}

function findHintUnknownTokens(queryTokens: string[]): string[] {
  const queryTokenSet = new Set(queryTokens)

  return OUT_OF_SCOPE_HINT_TERMS.filter((term) =>
      queryTokenSet.has(normalizeForSignal(term)),
  )
}

function removeKnownTokenMatches(
  normalizedQuestion: string,
  knowledgeTokenSet: Set<string>,
): string {
  const sortedTokens = [...knowledgeTokenSet]
    .filter((token) => token.length > 1)
    .sort((left, right) => right.length - left.length)
  let remainingQuestion = normalizedQuestion

  for (const token of sortedTokens) {
    remainingQuestion = remainingQuestion.split(token).join(' ')
  }

  for (const term of BENIGN_UNKNOWN_QUERY_TERMS) {
    remainingQuestion = remainingQuestion
      .split(normalizeForSignal(term))
      .join(' ')
  }

  return remainingQuestion
}

function removeUnknownStopChars(text: string): string {
  return Array.from(text)
    .filter((char) => !'的了吗呢啊是有在和不能可几怎什么哪这那你我他她它们吧嘛呀又都还或想给帮看说问到来去个一'.includes(char))
    .join('')
}

function extractResidualUnknownTokens(text: string): string[] {
  const normalizedText = removeUnknownStopChars(text)
  const tokens: string[] = []
  const parts = normalizedText.match(/[a-z0-9]+|[\u4e00-\u9fff]+/g) ?? []

  for (const part of parts) {
    if (/^[a-z0-9]+$/u.test(part)) {
      if (part.length > 1) {
        tokens.push(part)
      }

      continue
    }

    if (part.length === 2) {
      tokens.push(part)
      continue
    }

    for (let index = 0; index < part.length - 1; index += 1) {
      tokens.push(part.slice(index, index + 2))
    }
  }

  return [...new Set(tokens)]
}

async function findUnknownEntityTokens(question: string): Promise<string[]> {
  const queryTokens = extractKnowledgeContentTokens(question)

  if (queryTokens.length === 0) {
    return []
  }

  const knowledgeTokenSet = await getKnowledgeTokenSet()
  const residualText = removeKnownTokenMatches(
    normalizeForSignal(question),
    knowledgeTokenSet,
  )
  const unknownTokens = extractResidualUnknownTokens(residualText)

  if (unknownTokens.length >= UNKNOWN_ENTITY_TOKEN_THRESHOLD) {
    return unknownTokens.slice(0, UNKNOWN_TOKEN_DISPLAY_LIMIT)
  }

  return findHintUnknownTokens(queryTokens).slice(0, UNKNOWN_TOKEN_DISPLAY_LIMIT)
}

function hasAmbiguousConnector(question: string): boolean {
  const normalizedQuestion = normalizeForSignal(question)

  return AMBIGUOUS_CONNECTOR_TERMS.some((term) => {
    const normalizedTerm = normalizeForSignal(term)

    return normalizedTerm
      ? normalizedQuestion.includes(normalizedTerm)
      : question.includes(term)
  })
}

function findDirectTopicMatches(
  question: string,
  candidates: RetrievalCandidate[],
): string[] {
  const normalizedQuestion = normalizeForSignal(question)
  const matchedTopics = new Set<string>()

  for (const candidate of candidates.slice(0, AMBIGUOUS_CANDIDATE_LIMIT)) {
    for (const topic of [candidate.item.title, ...candidate.item.tags.slice(1)]) {
      const normalizedTopic = normalizeForSignal(topic)

      if (normalizedTopic && normalizedQuestion.includes(normalizedTopic)) {
        matchedTopics.add(normalizedTopic)
      }
    }
  }

  return [...matchedTopics]
}

function isVagueQuery(question: string): boolean {
  const normalizedQuestion = normalizeForSignal(question)

  return VAGUE_QUERY_TERMS.some((term) =>
    normalizedQuestion.includes(normalizeForSignal(term)),
  )
}

function countMatchedKnowledgeTopics(candidates: RetrievalCandidate[]): number {
  return new Set(
    candidates
      .slice(0, AMBIGUOUS_CANDIDATE_LIMIT)
      .map((candidate) => candidate.item.id),
  ).size
}

function hasCompetingCandidates(candidates: RetrievalCandidate[]): boolean {
  const topCandidate = candidates[0]

  if (!topCandidate) {
    return false
  }

  const strongCandidates = candidates.filter(
    (candidate) =>
      candidate.rerankScore >=
      topCandidate.rerankScore * AMBIGUOUS_CANDIDATE_SCORE_RATIO,
  )

  return countMatchedKnowledgeTopics(strongCandidates) > 1
}

function hasSmallTopCandidateGap(candidates: RetrievalCandidate[]): boolean {
  const [topCandidate, secondCandidate] = candidates

  if (!topCandidate || !secondCandidate || topCandidate.rerankScore <= 0) {
    return false
  }

  const gapRatio =
    (topCandidate.rerankScore - secondCandidate.rerankScore) /
    topCandidate.rerankScore

  return gapRatio < LOW_CONFIDENCE_GAP_RATIO
}

function shouldTreatAsAmbiguous(
  question: string,
  candidates: RetrievalCandidate[],
): boolean {
  if (hasSmallTopCandidateGap(candidates)) {
    return true
  }

  if (!hasCompetingCandidates(candidates)) {
    return false
  }

  if (findDirectTopicMatches(question, candidates).length >= 2) {
    return true
  }

  return hasAmbiguousConnector(question) || isVagueQuery(question)
}

export async function assessRetrievalDecision(
  question: string,
  matchResult: MatchKnowledgeResult | null,
): Promise<RetrievalDecision> {
  const candidates = matchResult?.candidates ?? []
  const topCandidate = candidates[0] ?? null
  const unknownTokens = await findUnknownEntityTokens(question)

  if (unknownTokens.length >= UNKNOWN_ENTITY_TOKEN_THRESHOLD) {
    return {
      confidence: 'unknown_entity',
      fallbackReason: 'unknown_entity_in_query',
      unknownTokens,
      candidates: [],
      topMatchId: topCandidate?.item.id ?? null,
      topScore: topCandidate?.rerankScore ?? null,
    }
  }

  if (!topCandidate) {
    return {
      confidence: 'unknown_entity',
      fallbackReason: 'unknown_entity_in_query',
      unknownTokens: [],
      candidates: [],
      topMatchId: null,
      topScore: null,
    }
  }

  if (topCandidate.rerankScore < LOW_CONFIDENCE_ABS_THRESHOLD) {
    return {
      confidence: 'low',
      fallbackReason: 'low_absolute_score',
      unknownTokens: [],
      candidates: [],
      topMatchId: topCandidate.item.id,
      topScore: topCandidate.rerankScore,
    }
  }

  if (shouldTreatAsAmbiguous(question, candidates)) {
    return {
      confidence: 'ambiguous',
      fallbackReason: 'small_gap_between_top1_top2',
      unknownTokens: [],
      candidates: buildCandidateHints(candidates),
      topMatchId: topCandidate.item.id,
      topScore: topCandidate.rerankScore,
    }
  }

  return {
    confidence: 'high',
    fallbackReason: null,
    unknownTokens: [],
    candidates: [],
    topMatchId: topCandidate.item.id,
    topScore: topCandidate.rerankScore,
  }
}

function buildFallbackAnswer(decision: RetrievalDecision): string {
  if (decision.confidence === 'ambiguous') {
    return '我找到几个可能相关的问题，你可以先确认想问哪一个。'
  }

  if (decision.confidence === 'unknown_entity') {
    const tokenHint =
      decision.unknownTokens.length > 0
        ? `「${decision.unknownTokens.join('、')}」`
        : '这个问题'

    return `目前知识库中没有找到${tokenHint}的相关说明。${AVAILABLE_TOPIC_HINT}`
  }

  return '我不太确定你问的是不是当前知识库里的这个主题。你可以换一种问法，或者点击下面的推荐问题。'
}

function selectDecisionMatch(
  originalMatch: MatchKnowledgeResult | null,
  rewrittenMatch: MatchKnowledgeResult | null,
): MatchKnowledgeResult | null {
  if (rewrittenMatch?.accepted) {
    return rewrittenMatch
  }

  if (originalMatch?.accepted) {
    return originalMatch
  }

  if (!originalMatch) {
    return rewrittenMatch
  }

  if (!rewrittenMatch) {
    return originalMatch
  }

  return rewrittenMatch.selectedCandidate.rerankScore >
    originalMatch.selectedCandidate.rerankScore
    ? rewrittenMatch
    : originalMatch
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
  let rewrittenMatch: MatchKnowledgeResult | null = null
  let rewrittenQuestion: string | null = null
  let finalQuestion = question

  if (!originalMatch?.accepted) {
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
    }
  }

  const matched = selectDecisionMatch(originalMatch, rewrittenMatch)
  const decision = await assessRetrievalDecision(question, matched)

  const trace: RetrievalTrace = {
    originalQuestion: question,
    rewrittenQuestion,
    finalQuestion,
    selectedStage: decision.confidence === 'high' ? matched?.stage ?? null : null,
    decision,
    attempts,
  }

  if (matched && decision.confidence === 'high') {
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
      confidence: decision.confidence,
      fallbackReason: decision.fallbackReason,
      trace,
    }
  }

  const answer = buildFallbackAnswer(decision)
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
    confidence: decision.confidence,
    fallbackReason: decision.fallbackReason,
    candidates:
      decision.confidence === 'ambiguous' ? decision.candidates : undefined,
    trace,
  }
}
