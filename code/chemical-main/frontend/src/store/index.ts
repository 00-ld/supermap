import { createPinia } from 'pinia'
// 全局唯一的 Pinia 实例，main.ts 直接 app.use(pinia) 注册。
const pinia = createPinia()
export default pinia