import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { readActiveKnowledgeList } from '../data/knowledgeStore.js'
import {
  DEFAULT_SUGGESTIONS_LIMIT,
  FALLBACK_CATEGORY,
  MAX_FALLBACK_SUGGESTIONS,
  MAX_PER_CATEGORY,
  MAX_SUGGESTIONS_LIMIT,
  OTHER_CATEGORY,
} from '../config/suggestions.js'
import type { KnowledgeItem } from '../types/knowledge.js'

const suggestionsRoutes = new Hono()

const FALLBACK_SUGGESTIONS = [
  '今天有什么推荐？',
  '现在有什么吃的？',
  '支持什么支付方式？',
] as const

type SuggestionSourceType = 'active' | 'fallback'

interface SuggestionItem {
  id: string
  question: string
  category: string
  sourceType: SuggestionSourceType
  priority: number | null
  popularity: number | null
}

interface RankedKnowledgeItem {
  item: KnowledgeItem
  index: number
}

interface BuildSuggestionsOptions {
  limit?: number
}

function getCategory(item: KnowledgeItem): string {
  return item.tags?.[0]?.trim() || OTHER_CATEGORY
}

function getKnowledgePriority(item: KnowledgeItem): number | null {
  return Number.isFinite(item.priority) ? Number(item.priority) : null
}

function getKnowledgePopularity(item: KnowledgeItem): number | null {
  return Number.isFinite(item.popularity) ? Number(item.popularity) : null
}

function compareByOriginalSignals(
  left: RankedKnowledgeItem,
  right: RankedKnowledgeItem,
): number {
  const leftHasTags = left.item.tags.length > 0 ? 1 : 0
  const rightHasTags = right.item.tags.length > 0 ? 1 : 0

  if (rightHasTags !== leftHasTags) {
    return rightHasTags - leftHasTags
  }

  const leftHasAliases = left.item.aliases.length > 0 ? 1 : 0
  const rightHasAliases = right.item.aliases.length > 0 ? 1 : 0

  if (rightHasAliases !== leftHasAliases) {
    return rightHasAliases - leftHasAliases
  }

  return left.index - right.index
}

function sortKnowledgeItems(items: KnowledgeItem[]): KnowledgeItem[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const leftPriority = getKnowledgePriority(left.item)
      const rightPriority = getKnowledgePriority(right.item)

      if (leftPriority !== null || rightPriority !== null) {
        if (leftPriority === null) {
          return 1
        }

        if (rightPriority === null) {
          return -1
        }

        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority
        }
      }

      return compareByOriginalSignals(left, right)
    })
    .map(({ item }) => item)
}

function groupByCategory(items: KnowledgeItem[]): Map<string, KnowledgeItem[]> {
  const groups = new Map<string, KnowledgeItem[]>()

  for (const item of items) {
    const category = getCategory(item)
    const group = groups.get(category) ?? []

    group.push(item)
    groups.set(category, group)
  }

  return groups
}

function normalizeSuggestionsLimit(value: number | undefined): number {
  if (!Number.isFinite(value) || !value) {
    return DEFAULT_SUGGESTIONS_LIMIT
  }

  const normalizedValue = Math.trunc(value)

  if (normalizedValue < 1) {
    return DEFAULT_SUGGESTIONS_LIMIT
  }

  return Math.min(normalizedValue, MAX_SUGGESTIONS_LIMIT)
}

function selectBalancedItems(
  items: KnowledgeItem[],
  limit: number,
): KnowledgeItem[] {
  const groups = groupByCategory(sortKnowledgeItems(items))
  const categories = [...groups.keys()]
  const selected: KnowledgeItem[] = []
  const selectedIds = new Set<string>()
  let round = 0

  while (selected.length < limit && round < MAX_PER_CATEGORY) {
    let selectedInRound = false

    for (const category of categories) {
      const item = groups.get(category)?.[round]

      if (!item || selectedIds.has(item.id)) {
        continue
      }

      selected.push(item)
      selectedIds.add(item.id)
      selectedInRound = true

      if (selected.length >= limit) {
        break
      }
    }

    if (!selectedInRound) {
      break
    }

    round += 1
  }

  if (selected.length < limit) {
    for (const item of sortKnowledgeItems(items)) {
      if (selectedIds.has(item.id)) {
        continue
      }

      selected.push(item)
      selectedIds.add(item.id)

      if (selected.length >= limit) {
        break
      }
    }
  }

  return selected
}

function buildKnowledgeSuggestion(item: KnowledgeItem): SuggestionItem {
  return {
    id: item.id,
    question: item.question,
    category: getCategory(item),
    sourceType: 'active',
    priority: getKnowledgePriority(item),
    popularity: getKnowledgePopularity(item),
  }
}

function buildFallbackSuggestion(
  question: string,
  fallbackIndex: number,
): SuggestionItem {
  return {
    id: `fallback-${String(fallbackIndex + 1).padStart(3, '0')}`,
    question,
    category: FALLBACK_CATEGORY,
    sourceType: 'fallback',
    priority: null,
    popularity: null,
  }
}

export function buildSuggestions(
  items: KnowledgeItem[],
  options: BuildSuggestionsOptions = {},
): SuggestionItem[] {
  const limit = normalizeSuggestionsLimit(options.limit)
  const activeItems = items.filter((item) => item.status === 'active')
  const selectedItems = selectBalancedItems(activeItems, limit)
  const suggestions = selectedItems.map(buildKnowledgeSuggestion)
  const fallbackSlots = Math.min(
    limit - suggestions.length,
    MAX_FALLBACK_SUGGESTIONS,
  )
  const fallbackSuggestions = FALLBACK_SUGGESTIONS.slice(0, fallbackSlots).map(
    (question, index) => buildFallbackSuggestion(question, index),
  )

  return [...suggestions, ...fallbackSuggestions]
}

suggestionsRoutes.use('/api/suggestions', authMiddleware)

suggestionsRoutes.get('/api/suggestions', async (c) => {
  try {
    const items = await readActiveKnowledgeList()
    const limit = Number.parseInt(c.req.query('limit') ?? '', 10)
    const suggestions = buildSuggestions(items, { limit })

    return c.json({ suggestions })
  } catch (error) {
    console.error('Failed to fetch suggestions:', error)

    return c.json({ message: 'Internal server error' }, 500)
  }
})

export default suggestionsRoutes
