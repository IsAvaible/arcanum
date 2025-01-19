import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'
import CaseListView from '@/views/cases/CaseListView.vue'
import CaseDetail from '@/views/cases/CaseDetailView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import ChatWindow from '@/components/ChatWindow.vue'
import AIChatWindow from '@/components/AIChatWindow.vue'
import Glossary from '@/views/glossar/Glossary.vue'

import Cookies from 'js-cookie'
import { useApi } from '@/composables/useApi'

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

// Router-Guard, which sets a cookie when route '/' is accessed
router.beforeEach(async (_to, _from) => {
  // If the user is not authenticated, redirect to the login page
  if (!Cookies.get('x-auth-token')) {
    try {
      // Authenticate the client (get JWT)
      await useApi().generateJWTGet()
    } catch (error) {
      console.log(error)
    }
  }
})

export default router
