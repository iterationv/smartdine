<script setup>
import { computed, onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { RouterLink } from 'vue-router'
import { deleteFaq, getFaqList } from '../../api/faq'

const faqs = ref([])
const isLoading = ref(true)
const deletingId = ref('')
const errorMessage = ref('')
const searchKeyword = ref('')

const normalizeSearchText = (value) => {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

const filteredFaqs = computed(() => {
  const keyword = normalizeSearchText(searchKeyword.value)

  if (!keyword) {
    return faqs.value
  }

  return faqs.value.filter((item) => {
    const question = normalizeSearchText(item.question)
    const answer = normalizeSearchText(item.answer)
    const tags = Array.isArray(item.tags)
      ? item.tags.map((tag) => normalizeSearchText(tag)).filter(Boolean)
      : []

    return (
      question.includes(keyword) ||
      answer.includes(keyword) ||
      tags.some((tag) => tag.includes(keyword))
    )
  })
})

const hasFaqs = computed(() => filteredFaqs.value.length > 0)
const emptyDescription = computed(() => {
  const keyword = searchKeyword.value.trim()

  return keyword ? `没有找到包含“${keyword}”的 FAQ` : '当前没有 FAQ 数据'
})

const loadFaqs = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    faqs.value = await getFaqList()
  } catch (error) {
    faqs.value = []
    errorMessage.value =
      error instanceof Error && error.message
        ? error.message
        : 'FAQ 列表加载失败，请稍后重试。'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadFaqs()
})

const clearSearch = () => {
  searchKeyword.value = ''
}

const handleDelete = async (item) => {
  const targetId = typeof item?.id === 'string' ? item.id.trim() : ''

  if (!targetId || deletingId.value) {
    return
  }

  deletingId.value = targetId
  errorMessage.value = ''

  try {
    await deleteFaq(targetId)
    faqs.value = faqs.value.filter((faq) => faq.id !== targetId)
    message.success('FAQ 删除成功')
  } catch (error) {
    const nextMessage =
      error instanceof Error && error.message
        ? error.message
        : 'FAQ 删除失败，请稍后重试。'

    errorMessage.value = nextMessage
    message.error(nextMessage)
  } finally {
    deletingId.value = ''
  }
}
</script>

<template>
  <a-card class="page-card" title="FAQ 列表">
    <a-space class="page-actions page-actions--top" wrap>
      <RouterLink to="/faq/new">
        <a-button type="primary">新增 FAQ</a-button>
      </RouterLink>
      <a-input
        v-model:value="searchKeyword"
        style="width: 280px"
        placeholder="搜索问题 / 答案 / 标签"
        allow-clear
      />
      <a-button :disabled="!searchKeyword" @click="clearSearch">清空搜索</a-button>
      <a-button :loading="isLoading" @click="loadFaqs">刷新列表</a-button>
    </a-space>

    <a-alert
      v-if="errorMessage"
      class="faq-feedback"
      type="error"
      show-icon
      :message="errorMessage"
    />

    <div v-if="isLoading" class="faq-loading">
      <a-spin tip="正在加载 FAQ 列表..." />
    </div>

    <a-empty
      v-else-if="!hasFaqs"
      class="faq-empty"
      :description="emptyDescription"
    />

    <a-list v-else item-layout="vertical" :data-source="filteredFaqs">
      <template #renderItem="{ item }">
        <a-list-item class="faq-list-item">
          <a-space direction="vertical" size="small" style="width: 100%">
            <div>
              <a-typography-text type="secondary">问题</a-typography-text>
              <a-typography-paragraph class="faq-paragraph">
                {{ item.question || '暂无问题内容' }}
              </a-typography-paragraph>
            </div>

            <div>
              <a-typography-text type="secondary">答案</a-typography-text>
              <a-typography-paragraph class="faq-paragraph">
                {{ item.answer || '暂无答案内容' }}
              </a-typography-paragraph>
            </div>

            <div>
              <a-typography-text type="secondary">标签</a-typography-text>
              <div class="faq-tags">
                <a-tag v-for="tag in item.tags" :key="`${item.id}-${tag}`">
                  {{ tag }}
                </a-tag>
                <a-typography-text v-if="item.tags.length === 0" type="secondary">
                  无标签
                </a-typography-text>
              </div>
            </div>

            <a-space>
              <RouterLink :to="`/faq/edit/${item.id}`">
                <a-button size="small">编辑</a-button>
              </RouterLink>
              <a-popconfirm
                :title="`确认删除 FAQ「${item.question || item.id}」吗？`"
                ok-text="确认删除"
                cancel-text="取消"
                @confirm="handleDelete(item)"
              >
                <a-button
                  size="small"
                  danger
                  :loading="deletingId === item.id"
                  :disabled="isLoading || (!!deletingId && deletingId !== item.id)"
                >
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </a-space>
        </a-list-item>
      </template>
    </a-list>
  </a-card>
</template>
