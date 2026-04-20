import type { KnowledgeItem, KnowledgeStatus } from '../types/knowledge.js'
import {
  readKnowledgeList,
  writeKnowledgeList,
} from '../data/knowledgeStore.js'

export interface KnowledgeListFilters {
  status?: KnowledgeStatus
  tag?: string
  keyword?: string
}

export interface CreateKnowledgeInput {
  title: string
  question: string
  answer: string
  aliases?: string[]
  tags?: string[]
  status?: KnowledgeStatus
}

export interface UpdateKnowledgeInput {
  title: string
  question: string
  answer: string
  aliases?: string[]
  tags?: string[]
  status?: KnowledgeStatus
}

const KNOWLEDGE_ID_PATTERN = /^k_(\d+)$/

function getNextKnowledgeId(items: KnowledgeItem[]): string {
  let maxIdNumber = 0

  for (const item of items) {
    const matched = item.id.match(KNOWLEDGE_ID_PATTERN)

    if (!matched) {
      continue
    }

    const currentIdNumber = Number.parseInt(matched[1], 10)

    if (currentIdNumber > maxIdNumber) {
      maxIdNumber = currentIdNumber
    }
  }

  return `k_${String(maxIdNumber + 1).padStart(3, '0')}`
}

function getKnowledgeIndexById(items: KnowledgeItem[], id: string): number {
  return items.findIndex((item) => item.id === id)
}

export async function listKnowledge(
  filters: KnowledgeListFilters = {},
): Promise<KnowledgeItem[]> {
  const items = await readKnowledgeList()

  return items.filter((item) => {
    if (filters.status !== undefined && item.status !== filters.status) {
      return false
    }

    if (filters.tag !== undefined && !item.tags.includes(filters.tag)) {
      return false
    }

    if (filters.keyword !== undefined) {
      const keyword = filters.keyword.toLowerCase()
      const matchedTitle = item.title.toLowerCase().includes(keyword)
      const matchedQuestion = item.question.toLowerCase().includes(keyword)

      if (!matchedTitle && !matchedQuestion) {
        return false
      }
    }

    return true
  })
}

export async function getKnowledgeById(
  id: string,
): Promise<KnowledgeItem | null> {
  const items = await readKnowledgeList()

  return items.find((item) => item.id === id) ?? null
}

export async function createKnowledge(
  input: CreateKnowledgeInput,
): Promise<KnowledgeItem> {
  const items = await readKnowledgeList()
  const currentTimestamp = new Date().toISOString()

  const newItem: KnowledgeItem = {
    id: getNextKnowledgeId(items),
    title: input.title,
    question: input.question,
    answer: input.answer,
    aliases: input.aliases ?? [],
    tags: input.tags ?? [],
    status: input.status ?? 'active',
    createdAt: currentTimestamp,
    updatedAt: currentTimestamp,
  }

  await writeKnowledgeList([...items, newItem])

  return newItem
}

export async function updateKnowledge(
  id: string,
  input: UpdateKnowledgeInput,
): Promise<KnowledgeItem> {
  const items = await readKnowledgeList()
  const targetIndex = getKnowledgeIndexById(items, id)

  if (targetIndex === -1) {
    throw new Error(`Knowledge item not found: ${id}`)
  }

  const existingItem = items[targetIndex]
  const updatedItem: KnowledgeItem = {
    id: existingItem.id,
    title: input.title,
    question: input.question,
    answer: input.answer,
    aliases: input.aliases ?? [],
    tags: input.tags ?? [],
    status: input.status ?? existingItem.status,
    createdAt: existingItem.createdAt,
    updatedAt: new Date().toISOString(),
  }

  items[targetIndex] = updatedItem
  await writeKnowledgeList(items)

  return updatedItem
}

export async function updateKnowledgeStatus(
  id: string,
  status: KnowledgeStatus,
): Promise<KnowledgeItem> {
  const items = await readKnowledgeList()
  const targetIndex = getKnowledgeIndexById(items, id)

  if (targetIndex === -1) {
    throw new Error(`Knowledge item not found: ${id}`)
  }

  const existingItem = items[targetIndex]
  const updatedItem: KnowledgeItem = {
    ...existingItem,
    status,
    updatedAt: new Date().toISOString(),
  }

  items[targetIndex] = updatedItem
  await writeKnowledgeList(items)

  return updatedItem
}

export async function deleteKnowledge(id: string): Promise<void> {
  const items = await readKnowledgeList()
  const targetIndex = getKnowledgeIndexById(items, id)

  if (targetIndex === -1) {
    throw new Error(`Knowledge item not found: ${id}`)
  }

  await writeKnowledgeList(items.filter((item) => item.id !== id))
}
