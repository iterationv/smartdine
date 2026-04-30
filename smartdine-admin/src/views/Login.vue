<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginAdmin } from '../utils/auth'

const router = useRouter()

const formState = reactive({
  username: '',
  password: '',
})

const isSubmitting = ref(false)
const errorMessage = ref('')

const rules = {
  username: [
    {
      required: true,
      message: '请输入用户名',
    },
  ],
  password: [
    {
      required: true,
      message: '请输入密码',
    },
  ],
}

const handleFinish = async (values) => {
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await loginAdmin({
      username: values.username,
      password: values.password,
    })

    await router.replace('/knowledge')
  } catch (error) {
    errorMessage.value =
      error instanceof Error && error.message
        ? error.message
        : '用户名或密码错误'
  } finally {
    isSubmitting.value = false
  }
}

const handleFinishFailed = () => {
  errorMessage.value = ''
}
</script>

<template>
  <a-row justify="center">
    <a-col :xs="24" :sm="18" :md="14" :lg="10" :xl="8">
      <a-card class="page-card" title="管理员登录">
        <a-alert
          v-if="errorMessage"
          class="login-alert"
          type="error"
          show-icon
          :message="errorMessage"
        />

        <a-form
          layout="vertical"
          :model="formState"
          :rules="rules"
          @finish="handleFinish"
          @finishFailed="handleFinishFailed"
        >
          <a-form-item label="用户名" name="username">
            <a-input
              v-model:value="formState.username"
              placeholder="请输入用户名"
              autocomplete="username"
            />
          </a-form-item>

          <a-form-item label="密码" name="password">
            <a-input-password
              v-model:value="formState.password"
              placeholder="请输入密码"
              autocomplete="current-password"
            />
          </a-form-item>

          <a-form-item class="login-submit">
            <a-button type="primary" html-type="submit" block :loading="isSubmitting">
              登录
            </a-button>
          </a-form-item>
        </a-form>
      </a-card>
    </a-col>
  </a-row>
</template>
