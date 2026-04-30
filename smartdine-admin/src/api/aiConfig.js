import { requestAdminJson } from './request'

const AI_CONFIG_PATH = '/api/admin/ai-config'

export const getAiConfig = async () => {
  return requestAdminJson({
    path: AI_CONFIG_PATH,
    fallbackMessage: 'AI 配置加载失败，请稍后重试。',
  })
}

export const updateAiConfig = async (payload) => {
  return requestAdminJson({
    path: AI_CONFIG_PATH,
    method: 'PUT',
    body: payload,
    fallbackMessage: 'AI 配置保存失败，请检查后重试。',
  })
}

export const resetAiConfig = async () => {
  return requestAdminJson({
    path: `${AI_CONFIG_PATH}/reset`,
    method: 'POST',
    fallbackMessage: 'AI 配置恢复默认失败，请稍后重试。',
  })
}
