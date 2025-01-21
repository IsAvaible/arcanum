import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'
import CaseListView from '@/views/cases/CaseListView.vue'
import CaseDetail from '@/views/cases/CaseDetailView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import ChatWindow from '@/components/ChatWindow.vue'
import AIChatWindow from '@/components/AIChatWindow.vue'
import Glossary from '@/views/glossar/Glossary.vue'

import { useApi } from '@/composables/useApi'
import { ref } from 'vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/cases',
      name: 'cases',
      component: CaseListView,
    },
    {
      path: '/cases/:id(\\d+)',
      name: 'case-detail',
      component: CaseDetail,
    },
    {
      path: '/cases/create',
      name: 'case-create',
      component: CaseListView,
    },
    {
      path: '/cases/create/manual',
      name: 'case-create-manual',
      component: CaseListView,
    },
    {
      path: '/cases/:id(\\d+)/delete',
      name: 'case-delete',
      component: CaseListView,
    },
    {
      path: '/cases/delete',
      name: 'case-delete-all',
      component: CaseListView,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
    },
    {
      path: '/chat',
      name: 'Chat',
      component: ChatWindow,
    },
    {
      path: '/ai',
      name: 'AI',
      component: AIChatWindow,
      children: [
        {
          path: ':chatId',
          component: AIChatWindow,
        },
      ],
    },
    { path: '/glossary', name: 'Glossary', component: Glossary },
  ],
})

const authenticatedUntil = ref<number>(-1)
// Router-Guard, which sets a cookie when route '/' is accessed
router.beforeEach(async (_to, _from) => {
  // If the user is not authenticated (anymore), authenticate the user
  if (authenticatedUntil.value < Date.now()) {
    try {
      // Authenticate the client (get JWT)
      await useApi().generateJWTGet()
      // Set the expiration date of the JWT
      authenticatedUntil.value = Date.now() + 1000 * 60 * 60
    } catch (error) {
      console.log(error)
    }
  }
})

export default router
