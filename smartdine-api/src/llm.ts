import OpenAI, { type ClientOptions } from 'openai'
import type {
  ChatCompletion,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions'
import { aiConfig } from './config.js'

export interface FaqContext {
  question: string
  answer: string
}

export interface AskLlmInput {
  userQuestion: string
  matchedFaq?: FaqContext | null
}

let client: OpenAI | null = null

const normalizeProvider = (provider: string): string => {
  return provider.trim().toLowerCase()
}

const getClientOptions = (): ClientOptions => {
  const provider = normalizeProvider(aiConfig.provider)

  switch (provider) {
    case '':
    case 'kimi':
    default:
      return {
        apiKey: aiConfig.apiKey,
        baseURL: aiConfig.baseUrl || undefined,
      }
  }
}

const getClient = (): OpenAI => {
  if (!aiConfig.apiKey.trim()) {
    throw new Error('AI_API_KEY is required to call LLM')
  }

  if (!aiConfig.model.trim()) {
    throw new Error('AI_MODEL is required to call LLM')
  }

  if (!client) {
    client = new OpenAI(getClientOptions())
  }

  return client
}

const buildFaqPolishMessages = (
  input: AskLlmInput,
): ChatCompletionMessageParam[] => {
  if (!input.matchedFaq) {
    throw new Error('matchedFaq is required for FAQ polish messages')
  }

  return [
    {
      role: 'system',
      content:
        '你是餐饮场景的 AI 客服助手。现在已经有一条标准 FAQ 答案，你的任务是把它说得更自然、更口语化。不要改写事实，不要补充 FAQ 里没有的信息。请用中文回答，控制在 1 到 3 句话，不要使用技术术语，也不要说“根据 FAQ”之类的系统措辞。',
    },
    {
      role: 'user',
      content: [
        `用户问题：${input.userQuestion.trim()}`,
        `FAQ 问题：${input.matchedFaq.question.trim()}`,
        `FAQ 标准答案：${input.matchedFaq.answer.trim()}`,
      ].join('\n'),
    },
  ]
}

const buildFallbackMessages = (
  input: AskLlmInput,
): ChatCompletionMessageParam[] => {
  return [
    {
      role: 'system',
      content:
        '你是餐饮场景的 AI 客服助手。当前没有命中的 FAQ，你只能回答餐厅服务相关、用户帮助相关的内容。不要编造未知信息，应优先给出保守、安全、可执行的引导。你可以建议用户查看首页、健康页面、记录页面，或联系人工客服。请用中文回答，控制在 1 到 3 句话，不要假装知道具体入口名称、页面细节或未确认的规则。',
    },
    {
      role: 'user',
      content: `用户问题：${input.userQuestion.trim()}`,
    },
  ]
}

const extractTextFromResponse = (response: ChatCompletion): string => {
  for (const choice of response.choices) {
    const content = choice.message?.content

    if (typeof content === 'string') {
      const text = content.trim()

      if (text) {
        return text
      }
    }

    if (Array.isArray(content)) {
      const text = content
        .map((part) => {
          if (
            part &&
            typeof part === 'object' &&
            'text' in part &&
            typeof part.text === 'string'
          ) {
            return part.text.trim()
          }

          return ''
        })
        .filter(Boolean)
        .join('\n')

      if (text) {
        return text
      }
    }
  }

  throw new Error('LLM returned an empty response')
}

export const askLLM = async (input: AskLlmInput): Promise<string> => {
  const llmClient = getClient()
  const messages = input.matchedFaq
    ? buildFaqPolishMessages(input)
    : buildFallbackMessages(input)

  let response: ChatCompletion

  try {
    response = await llmClient.chat.completions.create({
      model: aiConfig.model,
      messages,
      temperature: 0.2,
    })
  } catch (error) {
    throw new Error(
      `Failed to call LLM: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  return extractTextFromResponse(response)
}
