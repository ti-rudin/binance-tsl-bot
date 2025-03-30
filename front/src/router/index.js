import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'



const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/Home.vue'),
  
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/About.vue')
  },

  {
    path: '/newbot',
    name: 'newbot',
    component: () => import('../views/NewBot.vue'),

  },

  {
    path: '/botstatuspage',
    name: 'botstatuspage',
    component: () => import('../views/BotStatus.vue'),

  },
  
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isGuestRoute = to.matched.some(record => record.meta.guest)
  const isAuthenticated = authStore.isAuthenticated

  if (requiresAuth && !isAuthenticated) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else if (isGuestRoute && isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
