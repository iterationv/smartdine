<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const currentSection = computed(() => {
  return route.path.startsWith('/faq') ? '/faq' : '/login'
})
</script>

<template>
  <a-layout class="app-shell">
    <a-layout-header class="app-header">
      <div class="app-brand">
        <span class="app-title">SmartDine Admin</span>
        <span class="app-subtitle">Phase 3 初始化占位工程</span>
      </div>

      <a-space wrap>
        <RouterLink to="/login">
          <a-button :type="currentSection === '/login' ? 'primary' : 'default'">
            登录页
          </a-button>
        </RouterLink>
        <RouterLink to="/faq">
          <a-button :type="currentSection === '/faq' ? 'primary' : 'default'">
            FAQ 列表
          </a-button>
        </RouterLink>
        <RouterLink to="/faq/new">
          <a-button>新建 FAQ</a-button>
        </RouterLink>
      </a-space>
    </a-layout-header>

    <a-layout-content class="app-content">
      <RouterView />
    </a-layout-content>
  </a-layout>
</template>
