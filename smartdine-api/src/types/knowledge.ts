export type KnowledgeStatus = 'active' | 'inactive'

export interface KnowledgeItem {
  id: string
  title: string
  question: string
  answer: string
  aliases: string[]
  tags: string[]
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
