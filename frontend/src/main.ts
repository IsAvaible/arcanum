import './app.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import { ApiClientPlugin } from '@/plugins/ApiClientPlugin'

import PrimeVue from 'primevue/config'
import { Tooltip } from 'primevue'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ApiClientPlugin)
app.use(PrimeVue, {
  theme: 'none',
})
app.use(ToastService)
app.use(ConfirmationService)
app.directive('tooltip', Tooltip)

app.mount('#app')
