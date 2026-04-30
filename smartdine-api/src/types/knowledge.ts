export type KnowledgeStatus = 'active' | 'inactive'

export interface KnowledgeItem {
  id: string
  title: string
  question: string
  answer: string
  aliases: string[]
  tags: string[]
  priority?: number | null
  popularity?: number | null
  status: KnowledgeStatus
  createdAt: string
  updatedAt: string
}

export interface LegacyFaqItem {
  id: string
  question: string
  answer: string
  tags?: string[]
}
