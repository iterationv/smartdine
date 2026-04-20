import 'dotenv/config'

const getEnv = (key: string, defaultValue = ''): string => {
  return process.env[key] ?? defaultValue
}

const toPort = (value: string): number => {
  const port = Number.parseInt(value, 10)

  return Number.isNaN(port) ? 3000 : port
}

export const appConfig = {
  port: toPort(getEnv('PORT', '3000')),
  faqFilePath: getEnv('FAQ_FILE_PATH'),
  corsOrigins: getEnv('CORS_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
}

export const aiConfig = {
  provider: getEnv('AI_PROVIDER'),
  apiKey: getEnv('AI_API_KEY'),
  model: getEnv('AI_MODEL'),
  baseUrl: getEnv('AI_BASE_URL'),
}

export const securityConfig = {
  apiSecret: getEnv('API_SECRET'),
}
