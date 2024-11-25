<script setup lang="ts">
import { ref } from 'vue'

const features = ref([
  {
    title: 'Case Management',
    description: 'Manage your cases with ease',
    icon: 'pi-briefcase',
    link: '/cases',
  },
  {
    title: 'Generative AI',
    description: 'Automate your case creation process',
    icon: 'pi-microchip-ai',
    link: '/chat',
  },
  {
    title: 'Settings',
    description: 'Customize the system to your liking',
    icon: 'pi-cog',
    link: '/settings',
  },
])
</script>

<template>
  <div class="flex h-screen">
    <div class="m-auto flex flex-col items-center py-8">
      <img alt="Logo" class="h-24 w-24" src="@/assets/logo/LogoGradient.png" />
      <h1 class="text-4xl font-bold text-primary-800">Welcome to Arcanum</h1>
      <p class="text-lg text-gray-600 mt-4">The ultimate case management system</p>

      <h3 class="text-2xl font-semibold text-primary-800 mt-8">Features</h3>
      <div class="grid md:grid-cols-2 mx-auto xl:grid-cols-3 justify-between gap-4 mt-4">
        <!--      Cards-->
        <router-link
          :to="feature.link"
          v-for="feature in features"
          :key="feature.title"
          class="flex flex-col items-center gap-4 mt-4 h-full bg-gray-50 hover:bg-gray-100 rounded-lg p-4"
        >
          <div class="p-4 bg-white rounded-lg flex items-center aspect-1">
            <i :class="feature.icon + ' pi text-2xl text-primary-800'"></i>
          </div>
          <h4 class="text-lg font-semibold text-primary-800">{{ feature.title }}</h4>
          <p class="text-sm text-gray-600 text-center">{{ feature.description }}</p>
        </router-link>
      </div>
    </div>
  </div>
</template>
