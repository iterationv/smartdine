import type { KnowledgeItem } from '../types/knowledge.js'
import type {
  KnowledgeSearchField,
  RetrievalCandidate,
  RetrievalEvidence,
} from '../types/retrieval.js'
import {
  extractMeaningfulSearchTerms,
  filterMeaningfulSearchTerms,
  hasPhraseRelation,
  intersectSearchTerms,
  normalizeQuestionText,
  tokenizeSearchText,
} from './searchText.js'

type SearchFieldEntry = {
  source: KnowledgeSearchField
  text: string
  normalizedText: string
  tokens: string[]
}

type SearchDocument = {
  item: KnowledgeItem
  fields: SearchFieldEntry[]
}

const BM25_CONFIG = {
  k1: 1.2,
  b: 0.75,
  minimumScore: 0.8,
  maximumCandidates: 8,
  fieldBoosts: {
    title: 2.2,
    question: 2.5,
    alias: 2.8,
    tag: 1.6,
  } satisfies Record<KnowledgeSearchField, number>,
} as const

type CorpusStats = {
  docCount: number
  docFrequency: Map<string, number>
  averageFieldLength: Record<KnowledgeSearchField, number>
}

function buildSearchDocuments(items: KnowledgeItem[]): SearchDocument[] {
  return items.map((item) => {
    const fields: SearchFieldEntry[] = [
      {
        source: 'title',
        text: item.title,
        normalizedText: normalizeQuestionText(item.title),
        tokens: tokenizeSearchText(item.title),
      },
      {
        source: 'question',
        text: item.question,
        normalizedText: normalizeQuestionText(item.question),
        tokens: tokenizeSearchText(item.question),
      },
      ...item.aliases.map((alias) => ({
        source: 'alias' as const,
        text: alias,
        normalizedText: normalizeQuestionText(alias),
        tokens: tokenizeSearchText(alias),
      })),
      ...item.tags.map((tag) => ({
        source: 'tag' as const,
        text: tag,
        normalizedText: normalizeQuestionText(tag),
        tokens: tokenizeSearchText(tag),
      })),
    ]

    return {
      item,
      fields: fields.filter((field) => field.tokens.length > 0),
    }
  })
}

function buildCorpusStats(documents: SearchDocument[]): CorpusStats {
  const docFrequency = new Map<string, number>()
  const fieldLengthSums: Record<KnowledgeSearchField, number> = {
    title: 0,
    question: 0,
    alias: 0,
    tag: 0,
  }
  const fieldCounts: Record<KnowledgeSearchField, number> = {
    title: 0,
    question: 0,
    alias: 0,
    tag: 0,
  }

  for (const document of documents) {
    const documentTerms = new Set<string>()

    for (const field of document.fields) {
      fieldLengthSums[field.source] += field.tokens.length
      fieldCounts[field.source] += 1

      for (const token of filterMeaningfulSearchTerms(field.tokens)) {
        documentTerms.add(token)
      }
    }

    for (const token of documentTerms) {
      docFrequency.set(token, (docFrequency.get(token) ?? 0) + 1)
    }
  }

  return {
    docCount: documents.length,
    docFrequency,
    averageFieldLength: {
      title: fieldCounts.title > 0 ? fieldLengthSums.title / fieldCounts.title : 1,
      question:
        fieldCounts.question > 0
          ? fieldLengthSums.question / fieldCounts.question
          : 1,
      alias: fieldCounts.alias > 0 ? fieldLengthSums.alias / fieldCounts.alias : 1,
      tag: fieldCounts.tag > 0 ? fieldLengthSums.tag / fieldCounts.tag : 1,
    },
  }
}

function calculateInverseDocumentFrequency(
  term: string,
  stats: CorpusStats,
): number {
  const documentFrequency = stats.docFrequency.get(term) ?? 0

  return Math.log(1 + (stats.docCount - documentFrequency + 0.5) / (documentFrequency + 0.5))
}

function calculateFieldScore(
  queryTerms: string[],
  field: SearchFieldEntry,
  stats: CorpusStats,
): number {
  if (queryTerms.length === 0 || field.tokens.length === 0) {
    return 0
  }

  const termFrequency = new Map<string, number>()

  for (const token of field.tokens) {
    termFrequency.set(token, (termFrequency.get(token) ?? 0) + 1)
  }

  const averageFieldLength = stats.averageFieldLength[field.source] || 1
  let score = 0

  for (const term of queryTerms) {
    const frequency = termFrequency.get(term) ?? 0

    if (frequency === 0) {
      continue
    }

    const idf = calculateInverseDocumentFrequency(term, stats)
    const numerator = frequency * (BM25_CONFIG.k1 + 1)
    const denominator =
      frequency +
      BM25_CONFIG.k1 *
        (1 - BM25_CONFIG.b + (BM25_CONFIG.b * field.tokens.length) / averageFieldLength)

    score += idf * (numerator / denominator)
  }

  return score * BM25_CONFIG.fieldBoosts[field.source]
}

function buildEvidence(
  queryTerms: string[],
  fields: SearchFieldEntry[],
): RetrievalEvidence[] {
  return fields.flatMap((field) => {
    const matchedTerms = intersectSearchTerms(queryTerms, field.tokens)

    if (matchedTerms.length === 0) {
      return []
    }

    return [
      {
        source: field.source,
        text: field.text,
        matchedTerms,
      },
    ]
  })
}

function buildCandidate(
  query: string,
  queryTerms: string[],
  document: SearchDocument,
  stats: CorpusStats,
): RetrievalCandidate | null {
  const evidence = buildEvidence(queryTerms, document.fields)

  if (evidence.length === 0) {
    return null
  }

  const rawScore = document.fields.reduce(
    (totalScore, field) =>
      totalScore + calculateFieldScore(queryTerms, field, stats),
    0,
  )

  if (rawScore < BM25_CONFIG.minimumScore) {
    return null
  }

  return {
    item: document.item,
    rawScore,
    rerankScore: rawScore,
    evidence,
    signals: {
      aliasPhraseMatched: document.fields
        .filter((field) => field.source === 'alias')
        .some((field) => hasPhraseRelation(field.normalizedText, query)),
      questionPhraseMatched: document.fields
        .filter((field) => field.source === 'question')
        .some((field) => hasPhraseRelation(field.normalizedText, query)),
      titlePhraseMatched: document.fields
        .filter((field) => field.source === 'title')
        .some((field) => hasPhraseRelation(field.normalizedText, query)),
      tagPhraseMatched: document.fields
        .filter((field) => field.source === 'tag')
        .some((field) => hasPhraseRelation(field.normalizedText, query)),
      rewriteConsistent: false,
      matchedTerms: filterMeaningfulSearchTerms(
        evidence.flatMap((item) => item.matchedTerms),
      ),
    },
    reasons: [],
  }
}

export function scoreKnowledgeCandidates(
  query: string,
  items: KnowledgeItem[],
): RetrievalCandidate[] {
  const queryTerms = extractMeaningfulSearchTerms(query)

  if (queryTerms.length === 0 || items.length === 0) {
    return []
  }

  const documents = buildSearchDocuments(items)
  const corpusStats = buildCorpusStats(documents)

  return documents
    .map((document) => buildCandidate(query, queryTerms, document, corpusStats))
    .filter((candidate): candidate is RetrievalCandidate => candidate !== null)
    .sort((left, right) => {
      if (right.rawScore !== left.rawScore) {
        return right.rawScore - left.rawScore
      }

      if (right.evidence.length !== left.evidence.length) {
        return right.evidence.length - left.evidence.length
      }

      return left.item.title.localeCompare(right.item.title, 'zh-CN')
    })
    .slice(0, BM25_CONFIG.maximumCandidates)
}
