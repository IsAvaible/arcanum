<script setup lang="ts">
import { RouterView } from 'vue-router'
import Menubar from 'primevue/menubar'
import { ref } from 'vue'

const items = ref([
  {
    label: 'Home',
    icon: 'pi pi-home',
    to: '/',
  },
  {
    label: 'About',
    icon: 'pi pi-info-circle',
    to: '/about',
  },
  {
    label: 'Case',
    icon: 'pi pi-folder',
    items: [
      {
        label: 'Create New Case',
        icon: 'pi pi-plus',
        to: '/case-create',
      },
    ],
  },
])
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Menubar :model="items" class="border-none bg-transparent" />
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <RouterView />
    </main>
  </div>
</template>

<style>
@import url('primevue/resources/themes/lara-light-blue/theme.css');
@import url('primevue/resources/primevue.min.css');
@import url('primeicons/primeicons.css');

/* Custom styles for PrimeVue Menubar */
:deep(.p-menubar) {
  padding: 1rem 0;
}

:deep(.p-menubar-root-list) {
  gap: 0.5rem;
}

:deep(.p-menuitem-link) {
  padding: 0.5rem 1rem !important;
  border-radius: 0.375rem;
}

:deep(.p-menuitem-link:hover) {
  background-color: #f3f4f6 !important;
}

:deep(.p-menuitem-icon) {
  margin-right: 0.5rem;
}
</style>
