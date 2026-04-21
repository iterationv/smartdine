<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

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
    key: '/missed',
    label: '未命中问题',
    to: '/missed',
  },
  {
    key: '/faq',
    label: 'FAQ 列表',
    to: '/faq',
  },
  {
    key: '/login',
    label: '登录页',
    to: '/login',
  },
]

const currentSection = computed(() => {
  const matchedItem = navItems.find((item) => route.path.startsWith(item.key))

  return matchedItem ? matchedItem.key : '/login'
})
</script>

<template>
  <a-layout class="app-shell">
    <a-layout-header class="app-header">
      <div class="app-brand">
        <span class="app-title">SmartDine Admin</span>
        <span class="app-subtitle">V1.1 P0 知识运营工作台</span>
      </div>

      <a-space wrap>
        <RouterLink
          v-for="item in navItems"
          :key="item.key"
          :to="item.to"
        >
          <a-button :type="currentSection === item.key ? 'primary' : 'default'">
            {{ item.label }}
          </a-button>
        </RouterLink>
      </a-space>
    </a-layout-header>

    <a-layout-content class="app-content">
      <RouterView />
    </a-layout-content>
  </a-layout>
</template>
