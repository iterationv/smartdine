<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { logoutAdmin } from './utils/auth'

const route = useRoute()
const router = useRouter()

const navItems = [
  {
    key: '/dashboard',
    label: '统计看板',
    to: '/dashboard',
  },
  {
    key: '/knowledge',
    label: '知识管理',
    to: '/knowledge',
  },
  {
    key: '/qa-events',
    label: '问答日志',
    to: '/qa-events',
  },
  {
    key: '/missed',
    label: '未命中问题',
    to: '/missed',
  },
  {
    key: '/faq',
    label: 'FAQ 列表',
    to: '/faq',
  },
]

const currentSection = computed(() => {
  const matchedItem = navItems.find((item) => route.path.startsWith(item.key))

  return matchedItem ? matchedItem.key : '/login'
})

const isLoginRoute = computed(() => route.path === '/login')

const handleLogout = async () => {
  await logoutAdmin()
  await router.replace('/login')
}
</script>

<template>
  <a-layout class="app-shell">
    <a-layout-header class="app-header">
      <div class="app-brand">
        <span class="app-title">SmartDine Admin</span>
        <span class="app-subtitle">V1.1 P0 知识运营工作台</span>
      </div>

      <a-space v-if="!isLoginRoute" wrap>
        <RouterLink
          v-for="item in navItems"
          :key="item.key"
          :to="item.to"
        >
          <a-button :type="currentSection === item.key ? 'primary' : 'default'">
            {{ item.label }}
          </a-button>
        </RouterLink>
        <a-button @click="handleLogout">退出登录</a-button>
      </a-space>
    </a-layout-header>

    <a-layout-content class="app-content">
      <RouterView />
    </a-layout-content>
  </a-layout>
</template>
