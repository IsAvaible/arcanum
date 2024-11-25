<script setup lang="ts">
import { RouterView } from 'vue-router'
import Toast from 'primevue/toast'
import Sidebar from '@/components/site-structure/Sidebar.vue'
</script>

<template>
  <Toast />
  <div class="flex flex-row">
    <Sidebar />
    <RouterView class="flex-1" />
  </div>
</template>
