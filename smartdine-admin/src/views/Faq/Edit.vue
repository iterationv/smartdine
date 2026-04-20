<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { createFaq, getFaqById, updateFaq } from '../../api/faq'

const route = useRoute()
const router = useRouter()

const isCreateMode = computed(() => route.path === '/faq/new')
const pageTitle = computed(() => (isCreateMode.value ? '新增 FAQ' : '编辑 FAQ'))
const formState = reactive({
  question: '',
  answer: '',
  tags: '',
})
const isSubmitting = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const tagsValidator = async (_, value) => {
  const tags = value
    .split(/[,\n，]/)
    .map((item) => item.trim())
    .filter(Boolean)

  if (tags.length === 0) {
    throw new Error('请至少填写一个标签')
  }
}

const rules = {
  question: [{ required: true, whitespace: true, message: '请输入问题' }],
  answer: [{ required: true, whitespace: true, message: '请输入答案' }],
  tags: [
    { required: true, whitespace: true, message: '请输入标签' },
    { validator: tagsValidator },
  ],
}

const buildFaqId = () => {
  return `faq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

const resetForm = () => {
  formState.question = ''
  formState.answer = ''
  formState.tags = ''
}

const fillForm = (item) => {
  formState.question = item.question || ''
  formState.answer = item.answer || ''
  formState.tags = Array.isArray(item.tags) ? item.tags.join(', ') : ''
}

const loadFaq = async (id) => {
  if (isCreateMode.value) {
    resetForm()
    errorMessage.value = ''
    isLoading.value = false
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const item = await getFaqById(id)
    fillForm(item)
  } catch (error) {
    resetForm()
    errorMessage.value =
      error instanceof Error && error.message
        ? error.message
        : 'FAQ 详情加载失败，请稍后重试。'
  } finally {
    isLoading.value = false
  }
}

watch(
  () => route.params.id,
  (id) => {
    loadFaq(typeof id === 'string' ? id : '')
  },
  { immediate: true },
)

const handleFinish = async () => {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    if (isCreateMode.value) {
      await createFaq({
        id: buildFaqId(),
        question: formState.question,
        answer: formState.answer,
        tags: formState.tags,
      })
      message.success('FAQ 新增成功')
    } else {
      await updateFaq(route.params.id, {
        question: formState.question,
        answer: formState.answer,
        tags: formState.tags,
      })
      message.success('FAQ 编辑成功')
    }

    await router.push('/faq')
  } catch (error) {
    errorMessage.value =
      error instanceof Error && error.message
        ? error.message
        : isCreateMode.value
          ? 'FAQ 新增失败，请稍后重试。'
          : 'FAQ 编辑失败，请稍后重试。'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <a-card class="page-card" :title="pageTitle">
    <a-alert
      v-if="errorMessage"
      class="faq-feedback"
      type="error"
      show-icon
      :message="errorMessage"
    />

    <div v-if="isLoading" class="faq-loading">
      <a-spin tip="正在加载 FAQ 详情..." />
    </div>

    <a-form
      v-else
      class="faq-form"
      layout="vertical"
      :model="formState"
      :rules="rules"
      @finish="handleFinish"
    >
      <a-form-item v-if="!isCreateMode" label="FAQ ID">
        <a-input :value="route.params.id" disabled />
      </a-form-item>

      <a-form-item label="问题" name="question">
        <a-input
          v-model:value="formState.question"
          size="large"
          placeholder="请输入 FAQ 问题"
        />
      </a-form-item>

      <a-form-item label="答案" name="answer">
        <a-textarea
          v-model:value="formState.answer"
          :rows="6"
          placeholder="请输入 FAQ 答案"
        />
      </a-form-item>

      <a-form-item label="标签" name="tags">
        <a-input
          v-model:value="formState.tags"
          size="large"
          placeholder="多个标签请用英文逗号、中文逗号或换行分隔"
        />
      </a-form-item>

      <a-typography-paragraph class="faq-form-hint" type="secondary">
        后端真实接口要求 tags 为字符串数组，提交时会按逗号或换行拆分后再发送。
      </a-typography-paragraph>

      <a-space class="page-actions" wrap>
        <a-button type="primary" html-type="submit" :loading="isSubmitting">
          保存 FAQ
        </a-button>
        <RouterLink to="/faq">
          <a-button>返回列表</a-button>
        </RouterLink>
      </a-space>
    </a-form>
  </a-card>
</template>
