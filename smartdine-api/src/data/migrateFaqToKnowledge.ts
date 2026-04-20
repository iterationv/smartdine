import type {
  KnowledgeItem,
  LegacyFaqItem,
} from '../types/knowledge.js'

export function mapLegacyFaqToKnowledgeItem(
  faqItem: LegacyFaqItem,
  now: string,
): KnowledgeItem {
  return {
    id: faqItem.id,
    title: faqItem.question.slice(0, 20),
    question: faqItem.question,
    answer: faqItem.answer,
    aliases: [],
    tags: Array.isArray(faqItem.tags) ? faqItem.tags : [],
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }
}

export function migrateLegacyFaqList(
  faqList: LegacyFaqItem[],
  now: string,
): KnowledgeItem[] {
  return faqList.map((faqItem) => mapLegacyFaqToKnowledgeItem(faqItem, now))
}
