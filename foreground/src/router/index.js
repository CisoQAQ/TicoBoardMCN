import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/home.vue'),
    meta: { requiresAuth: true } // 需要登录才能访问
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login.vue'),
    meta: { requiresAuth: false } // 不需要登录
  },
    {
    path: '/userInfoEdit',
    name: 'UserInfoEdit',
    component: () => import('../views/userInfoEdit.vue'),
    meta: { requiresAuth: true } // 需要登录
  },

     {
    path: '/workCanvas',
    name: 'WorkCanvas',
    component: () => import('../views/workCanvas.vue'),
    meta: { requiresAuth: true,hiddenHeader:true, } // 需要登录
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/notFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 检查用户是否已登录
  const isAuthenticated = localStorage.getItem('token') // 假设使用token验证
  
  // 如果路由需要登录但用户未登录，重定向到登录页
  if (to.meta.requiresAuth !== false && !isAuthenticated) {
    next({ name: 'Login' })
  } else {
    next() // 正常访问
  }
})

export default router