import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { readActiveKnowledgeList } from '../data/knowledgeStore.js'
import type { KnowledgeItem } from '../types/knowledge.js'

const suggestionsRoutes = new Hono()
const MAX_SUGGESTIONS = 8
const MAX_FALLBACK_SUGGESTIONS = 3
const OTHER_CATEGORY = 'other'
const FALLBACK_CATEGORY = '推荐'

const FALLBACK_SUGGESTIONS = [
  '今天有什么推荐？',
  '现在有什么吃的？',
  '支持什么支付方式？',
] as const

type SuggestionSourceType = 'knowledge' | 'fallback'

interface SuggestionItem {
  id: string
  question: string
  category: string
  sourceType: SuggestionSourceType
  priority: number
}

function getCategory(item: KnowledgeItem): string {
  return item.tags?.[0]?.trim() || OTHER_CATEGORY
}

function sortKnowledgeItems(items: KnowledgeItem[]): KnowledgeItem[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
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

function selectBalancedItems(items: KnowledgeItem[]): KnowledgeItem[] {
  const groups = groupByCategory(sortKnowledgeItems(items))
  const categories = [...groups.keys()]
  const selected: KnowledgeItem[] = []
  let round = 0

  while (selected.length < MAX_SUGGESTIONS) {
    let selectedInRound = false

    for (const category of categories) {
      const item = groups.get(category)?.[round]

      if (!item) {
        continue
      }

      selected.push(item)
      selectedInRound = true

      if (selected.length >= MAX_SUGGESTIONS) {
        break
      }
    }

    if (!selectedInRound) {
      break
    }

    round += 1
  }

  return selected
}

function buildKnowledgeSuggestion(
  item: KnowledgeItem,
  index: number,
): SuggestionItem {
  return {
    id: item.id,
    question: item.question,
    category: getCategory(item),
    sourceType: 'knowledge',
    priority: index + 1,
  }
}

function buildFallbackSuggestion(
  question: string,
  fallbackIndex: number,
  priority: number,
): SuggestionItem {
  return {
    id: `fallback-${String(fallbackIndex + 1).padStart(3, '0')}`,
    question,
    category: FALLBACK_CATEGORY,
    sourceType: 'fallback',
    priority,
  }
}

export function buildSuggestions(items: KnowledgeItem[]): SuggestionItem[] {
  const activeItems = items.filter((item) => item.status === 'active')
  const selectedItems = selectBalancedItems(activeItems)
  const suggestions = selectedItems.map(buildKnowledgeSuggestion)
  const fallbackSlots = Math.min(
    MAX_SUGGESTIONS - suggestions.length,
    MAX_FALLBACK_SUGGESTIONS,
  )
  const fallbackSuggestions = FALLBACK_SUGGESTIONS.slice(0, fallbackSlots).map(
    (question, index) =>
      buildFallbackSuggestion(question, index, suggestions.length + index + 1),
  )

  return [...suggestions, ...fallbackSuggestions]
}

suggestionsRoutes.use('/api/suggestions', authMiddleware)

suggestionsRoutes.get('/api/suggestions', async (c) => {
  try {
    const items = await readActiveKnowledgeList()
    const suggestions = buildSuggestions(items)

    return c.json({ suggestions })
  } catch (error) {
    console.error('Failed to fetch suggestions:', error)

    return c.json({ message: 'Internal server error' }, 500)
  }
})

export default suggestionsRoutes
