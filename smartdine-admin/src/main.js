import { createApp } from 'vue'
import Antd from 'ant-design-vue'
import { createPinia } from 'pinia'
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from './api/request'
import { clearAdminSession } from './utils/auth'
import './style.css'

setUnauthorizedHandler(() => {
  clearAdminSession()

  if (router.currentRoute.value.path !== '/login') {
    void router.replace('/login')
  }
})

createApp(App).use(createPinia()).use(router).use(Antd).mount('#app')
