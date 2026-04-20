import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/Login.vue'
import FaqListView from '../views/Faq/List.vue'
import FaqEditView from '../views/Faq/Edit.vue'
import { isAdminAuthenticated } from '../utils/auth'

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/faq',
    name: 'faq-list',
    component: FaqListView,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/faq/new',
    name: 'faq-new',
    component: FaqEditView,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/faq/edit/:id',
    name: 'faq-edit',
    component: FaqEditView,
    meta: {
      requiresAuth: true,
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const isLoggedIn = isAdminAuthenticated()

  if (to.meta.requiresAuth && !isLoggedIn) {
    return '/login'
  }

  if (to.path === '/login' && isLoggedIn) {
    return '/faq'
  }

  return true
})

export default router
