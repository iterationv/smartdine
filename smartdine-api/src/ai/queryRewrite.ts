import type { QueryRewriteResult } from '../types/retrieval.js'
import { normalizeQuestionText } from './searchText.js'

type RewriteRule = {
  name: string
  pattern: RegExp
  replacement: string
}

const REWRITE_RULES: RewriteRule[] = [
  {
    name: 'trim-polite-prefix',
    pattern:
      /^(?:你好(?:呀|啊)?|您好|请问(?:一下)?|麻烦(?:问下|问一下)?|想问(?:一下)?|我想问(?:一下)?|请教(?:一下)?)[\s,，]*/u,
    replacement: '',
  },
  {
    name: 'trim-subject-prefix',
    pattern: /^(?:你们|这里|这边|这儿|食堂里|餐厅里|店里|本店|咱们|贵店)的?/u,
    replacement: '',
  },
  {
    name: 'trim-query-wrapper',
    pattern:
      /^(?:(?:这里|这边|这儿|店里|食堂里|餐厅里|本店)\s*)?(?:还有|都)?(?:有没有|有无|有什么|都有什么|能不能推荐一下|能推荐一下|可不可以推荐一下)/u,
    replacement: '',
  },
  {
    name: 'trim-leading-filler',
    pattern: /^(?:一下|下|目前|现在|这会儿)*/u,
    replacement: '',
  },
  {
    name: 'trim-leading-de',
    pattern: /^的+/u,
    replacement: '',
  },
  {
    name: 'trim-trailing-particle',
    pattern: /(?:吗|呢|呀|啊|吧|嘛)+$/u,
    replacement: '',
  },
]

function applyRewriteRules(question: string): QueryRewriteResult {
  const normalizedOriginalQuestion = normalizeQuestionText(question)
  let rewrittenQuestion = normalizedOriginalQuestion
  const appliedRules: string[] = []

  for (const rule of REWRITE_RULES) {
    const nextQuestion = rewrittenQuestion.replace(rule.pattern, rule.replacement)

    if (nextQuestion !== rewrittenQuestion) {
      rewrittenQuestion = nextQuestion.trim()
      appliedRules.push(rule.name)
    }
  }

  rewrittenQuestion = rewrittenQuestion
    .replace(/\s+/g, ' ')
    .replace(/^[的\s]+|[的\s]+$/g, '')
    .trim()

  return {
    originalQuestion: question,
    rewrittenQuestion:
      rewrittenQuestion && rewrittenQuestion !== normalizedOriginalQuestion
        ? rewrittenQuestion
        : null,
    appliedRules,
  }
}

export function rewriteQuery(question: string): QueryRewriteResult {
  if (!question.trim()) {
    return {
      originalQuestion: question,
      rewrittenQuestion: null,
      appliedRules: [],
    }
  }

  return applyRewriteRules(question)
}
