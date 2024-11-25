import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import CaseListView from '@/views/cases/CaseListView.vue'
import CaseDetail from '@/views/cases/CaseDetailView.vue'

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
      path: '/cases/:id(\\d+)/delete',
      name: 'case-delete',
      component: CaseListView,
    },
  ],
})

export default router
