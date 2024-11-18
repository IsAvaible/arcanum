import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CreateCaseView from '../views/CaseCreateView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/case-create',
      name: 'case-create',
      component: CreateCaseView,
    },
    {
      path: '/case-delete',
      name: 'case-delete',
      component: () => import('../views/CaseDeleteView.vue'),
    },
  ],
})

export default router
