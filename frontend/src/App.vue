<script setup lang="ts">
import { RouterView } from 'vue-router'
import Toast from 'primevue/toast'
import Sidebar from '@/components/site-structure/Sidebar.vue'
</script>

<template>
  <Toast />
  <div class="flex flex-row min-h-screen">
    <Sidebar />
    <div class="flex-1 ml-20 lg:ml-64 min-h-screen flex">
      <div class="m-auto">
        <RouterView />
      </div>
    </div>
  </div>
</template>
