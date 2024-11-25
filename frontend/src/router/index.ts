import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import CaseListView from '@/views/cases/CaseListView.vue'
import CaseDetail from '@/views/cases/CaseDetailView.vue'
import CreateCaseView from '@/views/cases/CaseCreateView.vue'

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
      path: '/case-detail',
      name: 'case-detail',
      component: CaseDetail,
    },
    {
      path: '/case-create',
      name: 'case-create',
      component: CreateCaseView,
    },
    {
      path: '/case-delete',
      name: 'case-delete',
      component: () => import('../views/cases/CaseDeleteView.vue'),
    },
  ],
})

export default router
