<script setup lang="ts">
import { RouterView } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import Sidebar from '@/components/site-structure/Sidebar.vue'
</script>

<template>
  <Toast />
  <ConfirmDialog></ConfirmDialog>
  <div class="flex flex-row min-h-screen w-screen">
    <Sidebar />
    <div class="flex-1 ml-20 lg:ml-64 min-h-screen flex max-w-full overflow-x-auto">
      <div class="m-auto w-full">
        <RouterView />
      </div>
    </div>
  </div>
</template>
