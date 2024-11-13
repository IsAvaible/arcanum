import './assets/main.css'
import './app.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import PrimeVue from 'primevue/config'

import App from './App.vue'
import router from './router'
import { Tooltip } from 'primevue'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: 'none',
})
app.directive('tooltip', Tooltip)

app.mount('#app')
