import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { KnowledgeItem } from '../types/knowledge.js'

const KNOWLEDGE_FILE_PATH = path.resolve(process.cwd(), 'src/data/knowledge.json')

export async function readKnowledgeList(): Promise<KnowledgeItem[]> {
  try {
    const content = await readFile(KNOWLEDGE_FILE_PATH, 'utf8')
    const parsed = JSON.parse(content) as unknown

    if (!Array.isArray(parsed)) {
      throw new Error('Knowledge data must be a JSON array.')
    }

    return parsed as KnowledgeItem[]
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }

    throw error
  }
}

export async function readActiveKnowledgeList(): Promise<KnowledgeItem[]> {
  const items = await readKnowledgeList()

  return items.filter((item) => item.status === 'active')
}

export async function writeKnowledgeList(items: KnowledgeItem[]): Promise<void> {
  const content = JSON.stringify(items, null, 2)

  await writeFile(KNOWLEDGE_FILE_PATH, `${content}\n`, 'utf8')
}
