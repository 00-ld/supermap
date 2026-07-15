import { createRouter, createWebHashHistory } from 'vue-router'
import { constantRoute, anyRoute } from './routes'
import { GET_TOKEN } from '@/utils/token'

const router = createRouter({
  history: createWebHashHistory(),
  // anyRoute 作为 catch-all 兜底，未知路径统一重定向到 /404。
  routes: [...constantRoute, anyRoute],
  scrollBehavior() {
    return { left: 0, top: 0 }
  },
})

// 路由守卫：未登录时强制跳转到登录页。
const whiteList = ['/login', '/register', '/404', '/screen', '/smart-map']
router.beforeEach((to, _from, next) => {
  // 统一从 token 工具读取，和 store / 请求拦截器保持同一数据源。
  const token = GET_TOKEN()
  if (token) {
    next()
  } else if (whiteList.includes(to.path)) {
    next()
  } else {
    // 记录目标地址，登录后回到原访问页面。
    next({ path: '/login', query: { redirect: to.fullPath } })
  }
})

export default router
