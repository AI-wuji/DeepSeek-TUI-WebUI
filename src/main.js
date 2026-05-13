import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import naive from 'naive-ui'
import App from './App.vue'
import ChatView from './views/ChatView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: ChatView },
  ]
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(naive)

app.mount('#app')

import './styles/theme.css'
