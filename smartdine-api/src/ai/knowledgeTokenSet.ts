import type { KnowledgeItem } from '../types/knowledge.js'
import { readActiveKnowledgeList } from '../data/knowledgeStore.js'
import { tokenizeSearchText, uniqueSearchTerms } from './searchText.js'

const CONTENT_STOP_TERMS = new Set([
  '的',
  '了',
  '吗',
  '呢',
  '啊',
  '是',
  '有',
  '在',
  '和',
  '什么',
  '怎么',
  '多少',
  '哪些',
  '请问',
  '你们',
])
const CONTENT_STOP_CHARS = new Set([
  '的',
  '了',
  '吗',
  '呢',
  '啊',
  '吧',
  '嘛',
  '呀',
  '是',
  '有',
  '在',
  '和',
  '不',
  '能',
  '可',
  '几',
  '怎',
  '什',
  '么',
  '哪',
  '这',
  '那',
  '你',
  '我',
  '他',
  '她',
  '它',
  '们',
  '都',
  '还',
  '或',
  '想',
  '给',
  '帮',
  '看',
  '说',
  '问',
  '到',
  '来',
  '去',
  '个',
  '一',
])

let cachedKnowledgeTokenSet: Set<string> | null = null

function isChineseToken(token: string): boolean {
  return /^[\u4e00-\u9fff]+$/u.test(token)
}

function containsStopChar(token: string): boolean {
  return Array.from(token).some((char) => CONTENT_STOP_CHARS.has(char))
}

export function isKnowledgeContentToken(token: string): boolean {
  if (token.length <= 1 || CONTENT_STOP_TERMS.has(token)) {
    return false
  }

  if (/^[a-z0-9]+$/u.test(token)) {
    return token.length > 1
  }

  if (!isChineseToken(token)) {
    return false
  }

  return token.length === 2 && !containsStopChar(token)
}

export function extractKnowledgeContentTokens(text: string): string[] {
  return uniqueSearchTerms(tokenizeSearchText(text)).filter(isKnowledgeContentToken)
}

function addKnowledgeItemTokens(tokenSet: Set<string>, item: KnowledgeItem): void {
  const fields = [
    item.title,
    item.question,
    item.answer,
    ...item.aliases,
    ...item.tags,
  ]

  for (const field of fields) {
    for (const token of extractKnowledgeContentTokens(field)) {
      tokenSet.add(token)
    }
  }
}

export async function getKnowledgeTokenSet(): Promise<Set<string>> {
  if (cachedKnowledgeTokenSet) {
    return cachedKnowledgeTokenSet
  }

  const tokenSet = new Set<string>()
  const items = await readActiveKnowledgeList()

  for (const item of items) {
    addKnowledgeItemTokens(tokenSet, item)
  }

  cachedKnowledgeTokenSet = tokenSet

  return tokenSet
}

export function invalidateKnowledgeTokenSet(): void {
  cachedKnowledgeTokenSet = null
}
