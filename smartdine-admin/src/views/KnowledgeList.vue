<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { message } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import { useKnowledgeStore } from '../stores/knowledgeStore'
import { useLogStore } from '../stores/logStore'

const route = useRoute()
const router = useRouter()
const knowledgeStore = useKnowledgeStore()
const logStore = useLogStore()
const { list, total, loading, filters, currentPage, pageSize } = storeToRefs(knowledgeStore)

const pageError = ref('')
const formRef = ref()
const modalOpen = ref(false)
const submitLoading = ref(false)
const submittingMode = ref('create')
const editingId = ref('')
const deletingId = ref('')
const statusLoadingId = ref('')
const sourceMissedId = ref('')
const activeCreateRouteKey = ref('')
const formModel = reactive({
  title: '',
  question: '',
  answer: '',
  aliases: [],
  tags: [],
  status: 'active',
})

const columns = [
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
    width: 180,
  },
  {
    title: '标准问法',
    dataIndex: 'question',
    key: 'question',
    width: 260,
  },
  {
    title: '分类标签',
    dataIndex: 'tags',
    key: 'tags',
    width: 180,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 110,
  },
  {
    title: '更新时间',
    dataIndex: 'updatedAt',
    key: 'updatedAt',
    width: 180,
  },
  {
    title: '操作',
    key: 'actions',
    width: 220,
    fixed: 'right',
  },
]

const rules = {
  title: [
    { required: true, whitespace: true, message: '请输入标题' },
    { max: 50, message: '标题最长 50 个字符' },
  ],
  question: [
    { required: true, whitespace: true, message: '请输入标准问法' },
    { max: 100, message: '标准问法最长 100 个字符' },
  ],
  answer: [
    { required: true, whitespace: true, message: '请输入标准答案' },
    { max: 500, message: '标准答案最长 500 个字符' },
  ],
  aliases: [
    {
      validator: async (_, value) => {
        if (!Array.isArray(value)) {
          return
        }

        const invalidItem = value.find((item) => typeof item === 'string' && item.trim().length > 50)

        if (invalidItem) {
          throw new Error('单条同义问法最长 50 个字符')
        }
      },
    },
  ],
}

const modalTitle = computed(() => {
  return submittingMode.value === 'create' ? '新增知识条目' : '编辑知识条目'
})

const pagedList = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value

  return list.value.slice(startIndex, endIndex)
})

const resetForm = () => {
  formModel.title = ''
  formModel.question = ''
  formModel.answer = ''
  formModel.aliases = []
  formModel.tags = []
  formModel.status = 'active'
  editingId.value = ''
}

const normalizeRouteQueryValue = (value) => {
  return typeof value === 'string' ? value.trim() : ''
}

const truncateText = (value, maxLength = 30) => {
  if (typeof value !== 'string') {
    return ''
  }

  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
}

const formatDateTime = (value) => {
  const timestamp = Date.parse(value)

  if (Number.isNaN(timestamp)) {
    return '-'
  }

  return new Date(timestamp).toLocaleString('zh-CN', {
    hour12: false,
  })
}

const loadKnowledgeList = async () => {
  pageError.value = ''

  try {
    await knowledgeStore.fetchList()
  } catch (error) {
    pageError.value =
      error instanceof Error && error.message
        ? error.message
        : '知识条目列表加载失败，请稍后重试。'
    message.error(pageError.value)
  }
}

onMounted(() => {
  loadKnowledgeList()
})

const syncCreateIntentFromRoute = () => {
  if (route.name !== 'knowledge-create') {
    return
  }

  const question = normalizeRouteQueryValue(route.query.question)
  const missedId = normalizeRouteQueryValue(route.query.missedId)
  const routeKey = `${route.name}:${question}:${missedId}`

  if (activeCreateRouteKey.value === routeKey && modalOpen.value) {
    return
  }

  activeCreateRouteKey.value = routeKey
  submittingMode.value = 'create'
  resetForm()
  formModel.question = question
  sourceMissedId.value = missedId
  modalOpen.value = true
}

watch(
  () => [route.name, route.query.question, route.query.missedId],
  () => {
    syncCreateIntentFromRoute()
  },
  { immediate: true },
)

const handleSearch = async () => {
  knowledgeStore.currentPage = 1
  await loadKnowledgeList()
}

const handleResetFilters = async () => {
  knowledgeStore.filters.keyword = ''
  knowledgeStore.filters.status = 'all'
  knowledgeStore.filters.tag = ''
  knowledgeStore.currentPage = 1
  await loadKnowledgeList()
}

const openCreateModal = () => {
  submittingMode.value = 'create'
  resetForm()
  sourceMissedId.value = ''
  modalOpen.value = true
}

const openEditModal = (record) => {
  submittingMode.value = 'edit'
  sourceMissedId.value = ''
  editingId.value = record.id
  formModel.title = record.title || ''
  formModel.question = record.question || ''
  formModel.answer = record.answer || ''
  formModel.aliases = Array.isArray(record.aliases) ? [...record.aliases] : []
  formModel.tags = Array.isArray(record.tags) ? [...record.tags] : []
  formModel.status = record.status === 'inactive' ? 'inactive' : 'active'
  modalOpen.value = true
}

const closeModal = async () => {
  modalOpen.value = false
  submitLoading.value = false
  resetForm()
  sourceMissedId.value = ''
  formRef.value?.clearValidate?.()

  if (route.name === 'knowledge-create') {
    await router.replace({ name: 'knowledge-list' })
  }

  activeCreateRouteKey.value = ''
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  submitLoading.value = true
  pageError.value = ''

  try {
    const payload = {
      title: formModel.title,
      question: formModel.question,
      answer: formModel.answer,
      aliases: formModel.aliases,
      tags: formModel.tags,
      status: formModel.status,
    }

    if (submittingMode.value === 'create') {
      await knowledgeStore.createItem(payload)
      let createSuccessMessage = '知识条目新增成功'

      if (sourceMissedId.value) {
        try {
          await logStore.updateMissedStatus(sourceMissedId.value, {
            convertedToKnowledge: true,
            handled: true,
          })
          createSuccessMessage = '知识条目新增成功，未命中问题已标记为已转化'
        } catch (statusError) {
          const nextMessage =
            statusError instanceof Error && statusError.message
              ? `知识条目新增成功，但未命中状态回写失败：${statusError.message}`
              : '知识条目新增成功，但未命中状态回写失败，请稍后在未命中列表重试。'

          await closeModal()
          message.warning(nextMessage)
          return
        }
      }

      message.success(createSuccessMessage)
    } else {
      await knowledgeStore.updateItem(editingId.value, payload)
      message.success('知识条目编辑成功')
    }

    await closeModal()
  } catch (error) {
    const nextMessage =
      error instanceof Error && error.message
        ? error.message
        : submittingMode.value === 'create'
          ? '知识条目新增失败，请稍后重试。'
          : '知识条目编辑失败，请稍后重试。'

    pageError.value = nextMessage
    message.error(nextMessage)
    submitLoading.value = false
  }
}

const handleToggleStatus = async (record) => {
  if (statusLoadingId.value || !record?.id) {
    return
  }

  statusLoadingId.value = record.id
  pageError.value = ''

  try {
    const nextStatus = record.status === 'active' ? 'inactive' : 'active'
    await knowledgeStore.toggleStatus(record.id, nextStatus)
    message.success(nextStatus === 'active' ? '知识条目已启用' : '知识条目已停用')
  } catch (error) {
    const nextMessage =
      error instanceof Error && error.message
        ? error.message
        : '知识条目状态切换失败，请稍后重试。'

    pageError.value = nextMessage
    message.error(nextMessage)
  } finally {
    statusLoadingId.value = ''
  }
}

const handleDelete = async (record) => {
  if (deletingId.value || !record?.id) {
    return
  }

  deletingId.value = record.id
  pageError.value = ''

  try {
    await knowledgeStore.deleteItem(record.id)
    message.success('知识条目删除成功')
  } catch (error) {
    const nextMessage =
      error instanceof Error && error.message
        ? error.message
        : '知识条目删除失败，请稍后重试。'

    pageError.value = nextMessage
    message.error(nextMessage)
  } finally {
    deletingId.value = ''
  }
}

const handlePageChange = (page) => {
  knowledgeStore.currentPage = page
}
</script>

<template>
  <a-card class="page-card knowledge-page-card" title="知识条目管理">
    <a-space class="page-actions page-actions--top knowledge-toolbar" wrap>
      <a-input
        v-model:value="filters.keyword"
        style="width: 280px"
        placeholder="搜索标题或标准问法"
        allow-clear
        @pressEnter="handleSearch"
      />
      <a-select v-model:value="filters.status" style="width: 140px">
        <a-select-option value="all">全部状态</a-select-option>
        <a-select-option value="active">启用</a-select-option>
        <a-select-option value="inactive">停用</a-select-option>
      </a-select>
      <a-button type="primary" @click="handleSearch">查询</a-button>
      <a-button :disabled="loading" @click="handleResetFilters">重置</a-button>
      <a-button :loading="loading" @click="loadKnowledgeList">刷新</a-button>
      <a-button type="primary" ghost @click="openCreateModal">新增</a-button>
    </a-space>

    <a-alert
      v-if="pageError"
      class="knowledge-feedback"
      type="error"
      show-icon
      :message="pageError"
    />

    <a-table
      row-key="id"
      :columns="columns"
      :data-source="pagedList"
      :loading="loading"
      :pagination="false"
      :scroll="{ x: 1100 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'question'">
          <span :title="record.question">{{ truncateText(record.question, 30) || '-' }}</span>
        </template>

        <template v-else-if="column.key === 'tags'">
          <a-space wrap>
            <a-tag v-for="tag in record.tags" :key="`${record.id}-${tag}`">
              {{ tag }}
            </a-tag>
            <a-typography-text v-if="record.tags.length === 0" type="secondary">
              无标签
            </a-typography-text>
          </a-space>
        </template>

        <template v-else-if="column.key === 'status'">
          <a-tag :color="record.status === 'active' ? 'green' : 'default'">
            {{ record.status === 'active' ? '启用' : '停用' }}
          </a-tag>
        </template>

        <template v-else-if="column.key === 'updatedAt'">
          {{ formatDateTime(record.updatedAt) }}
        </template>

        <template v-else-if="column.key === 'actions'">
          <a-space wrap>
            <a-button size="small" @click="openEditModal(record)">编辑</a-button>
            <a-button
              size="small"
              :loading="statusLoadingId === record.id"
              :disabled="loading || (!!statusLoadingId && statusLoadingId !== record.id)"
              @click="handleToggleStatus(record)"
            >
              {{ record.status === 'active' ? '停用' : '启用' }}
            </a-button>
            <a-popconfirm
              :title="`确认删除知识条目「${record.title || record.id}」吗？`"
              ok-text="确认删除"
              cancel-text="取消"
              @confirm="handleDelete(record)"
            >
              <a-button
                size="small"
                danger
                :loading="deletingId === record.id"
                :disabled="loading || (!!deletingId && deletingId !== record.id)"
              >
                删除
              </a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <div v-if="total > 0" class="knowledge-pagination">
      <a-pagination
        :current="currentPage"
        :page-size="pageSize"
        :total="total"
        :show-size-changer="false"
        @change="handlePageChange"
      />
    </div>

    <a-modal
      :open="modalOpen"
      :title="modalTitle"
      :confirm-loading="submitLoading"
      ok-text="保存"
      cancel-text="取消"
      destroy-on-close
      @ok="handleSubmit"
      @cancel="closeModal"
    >
      <a-form
        ref="formRef"
        layout="vertical"
        :model="formModel"
        :rules="rules"
      >
        <a-form-item label="标题" name="title">
          <a-input
            v-model:value="formModel.title"
            maxlength="50"
            placeholder="请输入标题"
          />
        </a-form-item>

        <a-form-item label="标准问法" name="question">
          <a-input
            v-model:value="formModel.question"
            maxlength="100"
            placeholder="请输入标准问法"
          />
        </a-form-item>

        <a-form-item label="标准答案" name="answer">
          <a-textarea
            v-model:value="formModel.answer"
            :rows="5"
            maxlength="500"
            show-count
            placeholder="请输入标准答案"
          />
        </a-form-item>

        <a-form-item label="同义问法" name="aliases">
          <a-select
            v-model:value="formModel.aliases"
            mode="tags"
            :token-separators="[',', '，']"
            placeholder="输入后回车，可添加多条同义问法"
          />
        </a-form-item>

        <a-form-item label="分类标签" name="tags">
          <a-select
            v-model:value="formModel.tags"
            mode="tags"
            :token-separators="[',', '，']"
            placeholder="输入后回车，可添加多个分类标签"
          />
        </a-form-item>

        <a-form-item label="状态" name="status">
          <a-radio-group v-model:value="formModel.status">
            <a-radio value="active">启用</a-radio>
            <a-radio value="inactive">停用</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>

<style scoped>
.knowledge-page-card {
  max-width: 1180px;
}

.knowledge-toolbar {
  justify-content: space-between;
}

.knowledge-feedback {
  margin-bottom: 16px;
}

.knowledge-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
