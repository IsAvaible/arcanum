<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ref } from 'vue'

// Components from PrimeVue
import Menubar from 'primevue/menubar'
import Select from 'primevue/select'
import Toast from 'primevue/toast'

// Custom components
import HelloWorld from './components/HelloWorld.vue'

// Menu items for Menubar
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
        to: '/case-detail',
      },
    ],
  },
])

// Select options for dropdown
const cities = [
  { name: 'New York', code: 'NY' },
  { name: 'London', code: 'LDN' },
  { name: 'Paris', code: 'PRS' },
  { name: 'Tokyo', code: 'TKY' },
]
const selectedCity = ref(null)
</script>

<template>
  <!-- Toast notification -->
  <Toast />

  <!-- Header -->
  <header class="bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />

      <div>
        <!-- Menubar -->
        <Menubar :model="items" class="border-none bg-transparent" />
      </div>
    </div>

    <div class="wrapper">
      <!-- HelloWorld Component -->
      <HelloWorld msg="You did it!" />

      <!-- Navigation Links -->
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
        <RouterLink to="/case-create">Case Create</RouterLink>
        <RouterLink to="/case-delete">Case Delete</RouterLink>
        <RouterLink to="/case-detail">Case Detail</RouterLink>
      </nav>

      <!-- Dropdown for Select -->
      <div class="card flex justify-center">
        <Select
          v-model="selectedCity"
          :options="cities"
          optionLabel="name"
          placeholder="Select a City"
          class="w-full md:w-56"
        />
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <RouterView />
  </main>
</template>

<style scoped>
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
