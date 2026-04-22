const MODAL_PARTICLE_REGEX = /[吗呢呀啊吧嘛]$/u
const SEARCH_STOP_TERMS = new Set([
  '什么',
  '是什',
  '有什',
  '没有',
  '有没',
  '请问',
  '你好',
  '您好',
  '这里',
  '这边',
  '你们',
  '一下',
])

function toHalfWidth(text: string): string {
  return Array.from(text, (char) => {
    const charCode = char.charCodeAt(0)

    if (charCode === 12288) {
      return ' '
    }

    if (charCode >= 65281 && charCode <= 65374) {
      return String.fromCharCode(charCode - 65248)
    }

    return char
  }).join('')
}

export function normalizeText(text: string): string {
  return toHalfWidth(text)
    .toLowerCase()
    .replace(/[“”"']/g, '')
    .replace(/[，。！？、；：,.!?;:()（）【】\[\]<>《》]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeQuestionText(text: string): string {
  return normalizeText(text).replace(MODAL_PARTICLE_REGEX, '').trim()
}

export function tokenizeSearchText(text: string): string[] {
  const normalizedText = normalizeQuestionText(text)

  if (!normalizedText) {
    return []
  }

  const sanitizedText = normalizedText
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ')
    .trim()

  if (!sanitizedText) {
    return []
  }

  const tokens: string[] = []
  const segments = sanitizedText.split(/\s+/)

  for (const segment of segments) {
    const parts = segment.match(/[a-z0-9]+|[\u4e00-\u9fff]+/g) ?? []

    for (const part of parts) {
      if (!part) {
        continue
      }

      if (/^[a-z0-9]+$/.test(part)) {
        tokens.push(part)
        continue
      }

      if (part.length === 1) {
        tokens.push(part)
        continue
      }

      tokens.push(part)

      for (let index = 0; index < part.length - 1; index += 1) {
        tokens.push(part.slice(index, index + 2))
      }
    }
  }

  return tokens
}

export function uniqueSearchTerms(tokens: string[]): string[] {
  return [...new Set(tokens)]
}

export function filterMeaningfulSearchTerms(tokens: string[]): string[] {
  return uniqueSearchTerms(tokens).filter((token) => !SEARCH_STOP_TERMS.has(token))
}

export function extractMeaningfulSearchTerms(text: string): string[] {
  return filterMeaningfulSearchTerms(tokenizeSearchText(text))
}

export function intersectSearchTerms(
  leftTokens: string[],
  rightTokens: string[],
): string[] {
  const rightTokenSet = new Set(rightTokens)

  return uniqueSearchTerms(leftTokens).filter((token) => rightTokenSet.has(token))
}

export function hasPhraseRelation(text: string, query: string): boolean {
  const normalizedText = normalizeQuestionText(text).replace(/\s+/g, '')
  const normalizedQuery = normalizeQuestionText(query).replace(/\s+/g, '')

  if (!normalizedText || !normalizedQuery) {
    return false
  }

  return (
    normalizedText.includes(normalizedQuery) ||
    normalizedQuery.includes(normalizedText)
  )
}
