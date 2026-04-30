<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Modal, message } from 'ant-design-vue'
import { getAiConfig, resetAiConfig, updateAiConfig } from '../api/aiConfig'

const loading = ref(false)
const saving = ref(false)
const resetting = ref(false)
const pageError = ref('')

const status = reactive({
  apiKeyConfigured: false,
  baseUrl: null,
  provider: null,
})

const formState = reactive({
  systemPrompt: '',
  fallbackMessages: {
    low: '',
    ambiguous: '',
    unknown_entity: '',
  },
  modelName: '',
  temperature: 0.7,
})

const apiKeyStatusText = computed(() =>
  status.apiKeyConfigured ? '已配置' : '未配置',
)

const normalizeTemperature = (value) => {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return 0.7
  }

  return Math.min(Math.max(Number(numericValue.toFixed(1)), 0), 1)
}

const applyAiConfig = (data) => {
  status.apiKeyConfigured = Boolean(data?.apiKeyConfigured)
  status.baseUrl = data?.baseUrl || null
  status.provider = data?.provider || null
  formState.systemPrompt = data?.systemPrompt || ''
  formState.fallbackMessages.low = data?.fallbackMessages?.low || ''
  formState.fallbackMessages.ambiguous =
    data?.fallbackMessages?.ambiguous || ''
  formState.fallbackMessages.unknown_entity =
    data?.fallbackMessages?.unknown_entity || ''
  formState.modelName = data?.modelName || ''
  formState.temperature = normalizeTemperature(data?.temperature)
}

const buildPayload = () => ({
  systemPrompt: formState.systemPrompt,
  fallbackMessages: {
    low: formState.fallbackMessages.low,
    ambiguous: formState.fallbackMessages.ambiguous,
    unknown_entity: formState.fallbackMessages.unknown_entity,
  },
  modelName: formState.modelName,
  temperature: normalizeTemperature(formState.temperature),
})

const validateText = (label, value, maxLength, requiredToken) => {
  const normalizedValue = typeof value === 'string' ? value.trim() : ''

  if (!normalizedValue) {
    return `${label}不能为空。`
  }

  if (normalizedValue.length > maxLength) {
    return `${label}不能超过 ${maxLength} 个字符。`
  }

  if (requiredToken && !normalizedValue.includes(requiredToken)) {
    return `${label}必须保留 ${requiredToken}。`
  }

  return ''
}

const validateForm = () => {
  const validations = [
    validateText('系统提示词', formState.systemPrompt, 4000),
    validateText('low 兜底话术', formState.fallbackMessages.low, 500, '{topic}'),
    validateText('ambiguous 兜底话术', formState.fallbackMessages.ambiguous, 200),
    validateText(
      'unknown_entity 兜底话术',
      formState.fallbackMessages.unknown_entity,
      500,
      '{tokens}',
    ),
    validateText('模型名', formState.modelName, 100),
  ].filter(Boolean)

  const temperature = Number(formState.temperature)

  if (!Number.isFinite(temperature) || temperature < 0 || temperature > 1) {
    validations.push('温度必须在 0 到 1 之间。')
  }

  return validations[0] || ''
}

const loadAiConfig = async () => {
  loading.value = true
  pageError.value = ''

  try {
    applyAiConfig(await getAiConfig())
  } catch (error) {
    const nextMessage =
      error instanceof Error && error.message
        ? error.message
        : 'AI 配置加载失败，请稍后重试。'

    pageError.value = nextMessage
    message.error(nextMessage)
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  const validationMessage = validateForm()

  if (validationMessage) {
    pageError.value = validationMessage
    message.error(validationMessage)
    return
  }

  saving.value = true
  pageError.value = ''

  try {
    applyAiConfig(await updateAiConfig(buildPayload()))
    message.success('保存成功，新配置已对下次提问生效')
  } catch (error) {
    const nextMessage =
      error instanceof Error && error.message
        ? error.message
        : 'AI 配置保存失败，请检查后重试。'

    pageError.value = nextMessage
    message.error(nextMessage)
  } finally {
    saving.value = false
  }
}

const handleReset = async () => {
  resetting.value = true
  pageError.value = ''

  try {
    applyAiConfig(await resetAiConfig())
    message.success('已恢复默认配置，新配置已对下次提问生效')
  } catch (error) {
    const nextMessage =
      error instanceof Error && error.message
        ? error.message
        : 'AI 配置恢复默认失败，请稍后重试。'

    pageError.value = nextMessage
    message.error(nextMessage)
  } finally {
    resetting.value = false
  }
}

const confirmReset = () => {
  Modal.confirm({
    title: '确认恢复默认配置？',
    content: '恢复默认只会重置 AI 可编辑配置，不会修改 API Key、Base URL 或 Provider。',
    okText: '恢复默认',
    cancelText: '取消',
    onOk: handleReset,
  })
}

onMounted(() => {
  loadAiConfig()
})
</script>

<template>
  <a-card class="page-card ai-config-card" title="AI 配置">
    <a-alert
      v-if="pageError"
      class="ai-config-feedback"
      type="error"
      show-icon
      :message="pageError"
    />

    <a-spin :spinning="loading">
      <a-descriptions
        class="ai-config-status"
        title="只读状态"
        bordered
        size="small"
        :column="1"
      >
        <a-descriptions-item label="API Key 状态">
          <a-tag :color="status.apiKeyConfigured ? 'green' : 'red'">
            {{ apiKeyStatusText }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="Base URL">
          {{ status.baseUrl || '未配置' }}
        </a-descriptions-item>
        <a-descriptions-item label="Provider">
          {{ status.provider || '未配置' }}
        </a-descriptions-item>
      </a-descriptions>

      <a-form class="ai-config-form" layout="vertical">
        <a-form-item label="系统提示词">
          <a-textarea
            v-model:value="formState.systemPrompt"
            :maxlength="4000"
            show-count
            :rows="5"
          />
        </a-form-item>

        <a-form-item label="low 兜底话术">
          <a-textarea
            v-model:value="formState.fallbackMessages.low"
            :maxlength="500"
            show-count
            :rows="3"
          />
          <a-typography-text type="secondary">
            必须保留占位符 {topic}
          </a-typography-text>
        </a-form-item>

        <a-form-item label="ambiguous 兜底话术">
          <a-input
            v-model:value="formState.fallbackMessages.ambiguous"
            :maxlength="200"
            show-count
          />
        </a-form-item>

        <a-form-item label="unknown_entity 兜底话术">
          <a-textarea
            v-model:value="formState.fallbackMessages.unknown_entity"
            :maxlength="500"
            show-count
            :rows="3"
          />
          <a-typography-text type="secondary">
            必须保留占位符 {tokens}
          </a-typography-text>
        </a-form-item>

        <a-form-item label="模型名">
          <a-input
            v-model:value="formState.modelName"
            :maxlength="100"
            show-count
          />
        </a-form-item>

        <a-form-item label="温度参数">
          <div class="ai-config-temperature">
            <a-slider
              v-model:value="formState.temperature"
              :min="0"
              :max="1"
              :step="0.1"
            />
            <a-input-number
              v-model:value="formState.temperature"
              :min="0"
              :max="1"
              :step="0.1"
            />
            <a-typography-text type="secondary">
              当前值：{{ normalizeTemperature(formState.temperature) }}
            </a-typography-text>
          </div>
        </a-form-item>

        <a-space class="page-actions" wrap>
          <a-button type="primary" :loading="saving" @click="handleSave">
            保存
          </a-button>
          <a-button danger :loading="resetting" @click="confirmReset">
            恢复默认
          </a-button>
          <a-button :loading="loading" @click="loadAiConfig">刷新</a-button>
        </a-space>
      </a-form>
    </a-spin>
  </a-card>
</template>

<style scoped>
.ai-config-card {
  max-width: 980px;
}

.ai-config-feedback,
.ai-config-status {
  margin-bottom: 16px;
}

.ai-config-form {
  margin-top: 18px;
}

.ai-config-temperature {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 120px auto;
  gap: 16px;
  align-items: center;
}

@media (max-width: 720px) {
  .ai-config-temperature {
    grid-template-columns: 1fr;
  }
}
</style>
