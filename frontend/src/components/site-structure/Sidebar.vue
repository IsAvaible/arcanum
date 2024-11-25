<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Sidebar state
const isCollapsed = ref(window.innerWidth < 1024)

// Watch for window resize
window.addEventListener('resize', () => {
  isCollapsed.value = window.innerWidth < 768
})

// Menu items
type MenuItem = {
  path: string
  label: string
  icon: string
}
const menuItems: { label: string; items: MenuItem[] }[] = [
  {
    label: '',
    items: [
      { path: '/', label: 'Home', icon: 'pi pi-home' },
      { path: '/chat', label: 'Chat', icon: 'pi pi-comments' },
      { path: '/notifications', label: 'Notifications', icon: 'pi pi-bell' },
      { path: '/cases', label: 'Cases', icon: 'pi pi-briefcase' },
    ],
  },
  {
    label: 'Personal',
    items: [
      { path: '/profile', label: 'Profile', icon: 'pi pi-user' },
      { path: '/settings', label: 'Settings', icon: 'pi pi-cog' },
    ],
  },
]

// Active route check
const isActive = (path: string) => route.path === path
</script>

<template>
  <div class="h-screen bg-gray-100 flex flex-col justify-between fixed top-0 left-0 w-20 lg:w-64">
    <!-- Logo -->
    <div class="pt-6 pb-4">
      <router-link to="/" class="flex items-center justify-center gap-x-3">
        <img src="@/assets/logo/LogoGradient.png" alt="Logo" class="h-10" />
        <span class="text-xl font-medium text-primary-800 max-lg:hidden">ARCANUM</span>
      </router-link>
    </div>

    <!-- Navigation Items -->
    <nav class="flex-1">
      <ul class="flex flex-col h-full space-y-2 p-4">
        <template v-for="group in menuItems">
          <p class="text-gray-800 text-sm max-lg:hidden pt-4 px-2" v-if="group.label">
            {{ group.label }}
          </p>
          <li
            v-for="item in group.items"
            :key="item.path"
            class="rounded-md"
            :class="{
              'bg-primary-600 text-white': isActive(item.path),
              'text-gray-700 hover:bg-gray-200': !isActive(item.path),
            }"
            v-tooltip="isCollapsed ? item.label : ''"
          >
            <router-link
              :to="item.path"
              class="flex items-center gap-3 px-4 py-2 rounded-md max-lg:aspect-square max-lg:justify-center"
            >
              <i :class="item.icon" class="text-xl"></i>
              <span class="text-sm font-medium max-lg:hidden">
                {{ item.label }}
              </span>
            </router-link>
          </li>
        </template>

        <li class="!mt-auto text-gray-700 hover:text-gray-900">
          <router-link
            to="/login"
            class="flex items-center gap-3 py-2 rounded-md max-lg:aspect-square justify-center"
          >
            <i class="text-xl pi pi-sign-out"></i>
            <span class="text-sm font-medium max-lg:hidden"> Logout </span>
          </router-link>
        </li>
      </ul>
    </nav>
  </div>
</template>

<style scoped></style>
