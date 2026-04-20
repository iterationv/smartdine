import { access, readFile, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { appConfig } from './config.js'

export interface FaqItem {
  id: string
  question: string
  answer: string
  tags: string[]
}

export interface CreateFaqInput {
  id: string
  question: string
  answer: string
  tags: string[]
}

export interface UpdateFaqInput {
  question?: string
  answer?: string
  tags?: string[]
}

const moduleDir = dirname(fileURLToPath(import.meta.url))
const resolveConfiguredFaqPath = (value: string): string => {
  if (!value.trim()) {
    return ''
  }

  return isAbsolute(value) ? value : resolve(moduleDir, '..', value)
}

const faqFileCandidates = [
  ...(appConfig.faqFilePath
    ? [resolveConfiguredFaqPath(appConfig.faqFilePath)]
    : []),
  resolve(moduleDir, 'data', 'faq.json'),
  resolve(moduleDir, '..', 'src', 'data', 'faq.json'),
]

let faqCache: FaqItem[] = []
let hasLoadedFaqCache = false
let faqFilePath: string | null = null

const cloneFaqItem = (item: FaqItem): FaqItem => ({
  ...item,
  tags: [...item.tags],
})

const cloneFaqList = (list: FaqItem[]): FaqItem[] => {
  return list.map(cloneFaqItem)
}

const isFaqItem = (value: unknown): value is FaqItem => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const item = value as Record<string, unknown>

  return (
    typeof item.id === 'string' &&
    typeof item.question === 'string' &&
    typeof item.answer === 'string' &&
    Array.isArray(item.tags) &&
    item.tags.every((tag) => typeof tag === 'string')
  )
}

const normalizeFaqList = (value: unknown): FaqItem[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isFaqItem).map(cloneFaqItem)
}

const getFaqFilePath = async (): Promise<string> => {
  if (faqFilePath) {
    return faqFilePath
  }

  for (const candidate of faqFileCandidates) {
    try {
      await access(candidate)
      faqFilePath = candidate
      return faqFilePath
    } catch {
      continue
    }
  }

  faqFilePath = faqFileCandidates[0]
  return faqFilePath
}

const normalizeSearchText = (value: string): string => {
  return value.trim().toLowerCase()
}

export const loadFaqFromFile = async (): Promise<FaqItem[]> => {
  try {
    const filePath = await getFaqFilePath()
    const content = await readFile(filePath, 'utf8')

    if (!content.trim()) {
      return []
    }

    return normalizeFaqList(JSON.parse(content))
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.warn('Failed to parse FAQ JSON, using an empty FAQ list.')
      return []
    }

    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }

    throw error
  }
}

const saveFaqToFile = async (list: FaqItem[]): Promise<void> => {
  const filePath = await getFaqFilePath()
  const content = JSON.stringify(cloneFaqList(list), null, 2)

  await writeFile(filePath, `${content}\n`, 'utf8')
}

export const reloadFaqCache = async (): Promise<FaqItem[]> => {
  faqCache = await loadFaqFromFile()
  hasLoadedFaqCache = true

  return cloneFaqList(faqCache)
}

export const ensureFaqCache = async (): Promise<FaqItem[]> => {
  if (!hasLoadedFaqCache) {
    return reloadFaqCache()
  }

  return cloneFaqList(faqCache)
}

export const getFaqList = async (): Promise<FaqItem[]> => {
  return ensureFaqCache()
}

export const addFaq = async (input: CreateFaqInput): Promise<FaqItem> => {
  const list = await ensureFaqCache()

  if (list.some((item) => item.id === input.id)) {
    throw new Error(`FAQ with id "${input.id}" already exists.`)
  }

  const newItem: FaqItem = {
    id: input.id,
    question: input.question,
    answer: input.answer,
    tags: [...input.tags],
  }

  list.push(newItem)
  await saveFaqToFile(list)
  await reloadFaqCache()

  return cloneFaqItem(newItem)
}

export const updateFaq = async (
  id: string,
  input: UpdateFaqInput,
): Promise<FaqItem> => {
  const list = await ensureFaqCache()
  const index = list.findIndex((item) => item.id === id)

  if (index === -1) {
    throw new Error(`FAQ with id "${id}" does not exist.`)
  }

  const updatedItem: FaqItem = {
    ...list[index],
    ...(input.question !== undefined ? { question: input.question } : {}),
    ...(input.answer !== undefined ? { answer: input.answer } : {}),
    ...(input.tags !== undefined ? { tags: [...input.tags] } : {}),
  }

  list[index] = updatedItem
  await saveFaqToFile(list)
  await reloadFaqCache()

  return cloneFaqItem(updatedItem)
}

export const deleteFaq = async (id: string): Promise<void> => {
  const list = await ensureFaqCache()
  const index = list.findIndex((item) => item.id === id)

  if (index === -1) {
    throw new Error(`FAQ with id "${id}" does not exist.`)
  }

  list.splice(index, 1)
  await saveFaqToFile(list)
  await reloadFaqCache()
}

export const getMatchedFaq = async (
  question: string,
): Promise<FaqItem | null> => {
  const normalizedQuestion = normalizeSearchText(question)

  if (!normalizedQuestion) {
    return null
  }

  const list = await ensureFaqCache()

  for (const item of list) {
    const normalizedFaqQuestion = normalizeSearchText(item.question)

    if (
      normalizedFaqQuestion &&
      (normalizedQuestion.includes(normalizedFaqQuestion) ||
        normalizedFaqQuestion.includes(normalizedQuestion))
    ) {
      return cloneFaqItem(item)
    }

    const matchedTag = item.tags.some((tag) => {
      const normalizedTag = normalizeSearchText(tag)

      return normalizedTag ? normalizedQuestion.includes(normalizedTag) : false
    })

    if (matchedTag) {
      return cloneFaqItem(item)
    }
  }

  return null
}
