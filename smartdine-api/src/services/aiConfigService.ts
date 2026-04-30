import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { aiConfig } from '../config.js'

export interface AiFallbackMessages {
  low: string
  ambiguous: string
  unknown_entity: string
}

export interface AiRuntimeConfig {
  systemPrompt: string
  fallbackMessages: AiFallbackMessages
  modelName: string
  temperature: number
}

export interface AiConfigView extends AiRuntimeConfig {
  apiKeyConfigured: boolean
  baseUrl: string | null
  provider: string | null
}

export interface AiConfigDiffItem {
  from: string | number
  to: string | number
}

export type AiConfigDiff = Record<string, AiConfigDiffItem>

export class AiConfigValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AiConfigValidationError'
  }
}

export const AI_CONFIG_FILE_PATH = path.resolve(
  process.cwd(),
  'data',
  'ai-config.json',
)

const AI_CONFIG_DIR = path.dirname(AI_CONFIG_FILE_PATH)
const DEFAULT_MODEL_NAME = aiConfig.model.trim() || 'moonshot-v1-8k'
const TEMP_FILE_SUFFIX = '.tmp'

export const DEFAULT_AI_CONFIG: AiRuntimeConfig = {
  systemPrompt: '你是 SmartDine 的智能助手，请优先基于知识库回答用户问题。',
  fallbackMessages: {
    low: '我不太确定你问的是不是「{topic}」。你可以换一种问法，或者点击下面的推荐问题。',
    ambiguous: '你可能想问：',
    unknown_entity: '目前知识库中没有找到「{tokens}」的相关说明。',
  },
  modelName: DEFAULT_MODEL_NAME,
  temperature: 0.7,
}

let cachedAiConfig: AiRuntimeConfig = DEFAULT_AI_CONFIG

const isObject = (value: unknown): value is Record<string, unknown> => {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

const readRequiredString = (
  value: unknown,
  fieldName: string,
  maxLength: number,
  requiredToken?: string,
): string => {
  if (typeof value !== 'string') {
    throw new AiConfigValidationError(`${fieldName} must be a string.`)
  }

  const normalizedValue = value.trim()

  if (!normalizedValue) {
    throw new AiConfigValidationError(`${fieldName} is required.`)
  }

  if (normalizedValue.length > maxLength) {
    throw new AiConfigValidationError(
      `${fieldName} must be no longer than ${maxLength} characters.`,
    )
  }

  if (requiredToken && !normalizedValue.includes(requiredToken)) {
    throw new AiConfigValidationError(`${fieldName} must include ${requiredToken}.`)
  }

  return normalizedValue
}

function readTemperature(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new AiConfigValidationError('temperature must be a number.')
  }

  if (value < 0 || value > 1) {
    throw new AiConfigValidationError('temperature must be between 0 and 1.')
  }

  return Number(value.toFixed(2))
}

function mergeWithDefaultConfig(value: unknown): Record<string, unknown> {
  if (!isObject(value)) {
    throw new AiConfigValidationError('AI config must be an object.')
  }

  const fallbackMessages = isObject(value.fallbackMessages)
    ? value.fallbackMessages
    : {}

  return {
    ...DEFAULT_AI_CONFIG,
    ...value,
    fallbackMessages: {
      ...DEFAULT_AI_CONFIG.fallbackMessages,
      ...fallbackMessages,
    },
  }
}

export function validateAiRuntimeConfig(value: unknown): AiRuntimeConfig {
  if (!isObject(value)) {
    throw new AiConfigValidationError('AI config must be an object.')
  }

  if (!isObject(value.fallbackMessages)) {
    throw new AiConfigValidationError('fallbackMessages must be an object.')
  }

  return {
    systemPrompt: readRequiredString(value.systemPrompt, 'systemPrompt', 4000),
    fallbackMessages: {
      low: readRequiredString(
        value.fallbackMessages.low,
        'fallbackMessages.low',
        500,
        '{topic}',
      ),
      ambiguous: readRequiredString(
        value.fallbackMessages.ambiguous,
        'fallbackMessages.ambiguous',
        200,
      ),
      unknown_entity: readRequiredString(
        value.fallbackMessages.unknown_entity,
        'fallbackMessages.unknown_entity',
        500,
        '{tokens}',
      ),
    },
    modelName: readRequiredString(value.modelName, 'modelName', 100),
    temperature: readTemperature(value.temperature),
  }
}

export function getAiRuntimeConfig(): AiRuntimeConfig {
  return cachedAiConfig
}

export function getAiConfigView(): AiConfigView {
  return {
    ...cachedAiConfig,
    fallbackMessages: {
      ...cachedAiConfig.fallbackMessages,
    },
    apiKeyConfigured: Boolean(aiConfig.apiKey.trim()),
    baseUrl: aiConfig.baseUrl.trim() || null,
    provider: aiConfig.provider.trim() || null,
  }
}

export async function loadAiRuntimeConfig(): Promise<AiRuntimeConfig> {
  try {
    const content = await readFile(AI_CONFIG_FILE_PATH, 'utf8')
    const parsedValue = JSON.parse(content) as unknown
    cachedAiConfig = validateAiRuntimeConfig(mergeWithDefaultConfig(parsedValue))
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      cachedAiConfig = DEFAULT_AI_CONFIG
      return cachedAiConfig
    }

    console.error('Failed to load AI config, using defaults:', error)
    cachedAiConfig = DEFAULT_AI_CONFIG
  }

  return cachedAiConfig
}

function buildAiConfigDiff(
  previousConfig: AiRuntimeConfig,
  nextConfig: AiRuntimeConfig,
): AiConfigDiff {
  const diff: AiConfigDiff = {}

  const compareField = (
    fieldName: string,
    previousValue: string | number,
    nextValue: string | number,
  ) => {
    if (previousValue !== nextValue) {
      diff[fieldName] = {
        from: previousValue,
        to: nextValue,
      }
    }
  }

  compareField('systemPrompt', previousConfig.systemPrompt, nextConfig.systemPrompt)
  compareField(
    'fallbackMessages.low',
    previousConfig.fallbackMessages.low,
    nextConfig.fallbackMessages.low,
  )
  compareField(
    'fallbackMessages.ambiguous',
    previousConfig.fallbackMessages.ambiguous,
    nextConfig.fallbackMessages.ambiguous,
  )
  compareField(
    'fallbackMessages.unknown_entity',
    previousConfig.fallbackMessages.unknown_entity,
    nextConfig.fallbackMessages.unknown_entity,
  )
  compareField('modelName', previousConfig.modelName, nextConfig.modelName)
  compareField('temperature', previousConfig.temperature, nextConfig.temperature)

  return diff
}

async function persistAiRuntimeConfig(config: AiRuntimeConfig): Promise<void> {
  await mkdir(AI_CONFIG_DIR, { recursive: true })

  const tempFilePath = `${AI_CONFIG_FILE_PATH}${TEMP_FILE_SUFFIX}`

  await writeFile(
    tempFilePath,
    `${JSON.stringify(config, null, 2)}\n`,
    'utf8',
  )
  await rename(tempFilePath, AI_CONFIG_FILE_PATH)
}

export async function updateAiRuntimeConfig(
  value: unknown,
): Promise<{ config: AiRuntimeConfig; diff: AiConfigDiff }> {
  const nextConfig = validateAiRuntimeConfig(value)
  const previousConfig = cachedAiConfig
  const diff = buildAiConfigDiff(previousConfig, nextConfig)

  await persistAiRuntimeConfig(nextConfig)
  cachedAiConfig = nextConfig

  return {
    config: nextConfig,
    diff,
  }
}

export async function resetAiRuntimeConfig(): Promise<{
  config: AiRuntimeConfig
  diff: AiConfigDiff
}> {
  const previousConfig = cachedAiConfig
  const nextConfig = DEFAULT_AI_CONFIG
  const diff = buildAiConfigDiff(previousConfig, nextConfig)

  await persistAiRuntimeConfig(nextConfig)
  cachedAiConfig = nextConfig

  return {
    config: nextConfig,
    diff,
  }
}
