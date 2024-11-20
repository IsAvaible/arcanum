<script setup lang="ts">
// Import necessary Vue composition API functions
import { defineProps } from 'vue'
// Import PrimeVue Button component
import Button from 'primevue/button'

// Define props for the component
const props = defineProps<{
  caseNumber: string  // The case number to display
  breadcrumb: string  // The breadcrumb path to display
}>()
</script>

<template>
  <div class="mb-8">
    <!-- Header container with case number and action buttons -->
    <div class="flex justify-between items-center mb-2">
      <!-- Display the case number -->
      <h1 class="text-2xl font-bold text-gray-900">Case #{{ caseNumber }}</h1>
      <!-- Action buttons for generating PDF and planning call -->
      <div class="flex gap-2">
        <Button label="Generate PDF" icon="pi pi-file-pdf" class="p-button-success" />
        <Button label="Plan Call" icon="pi pi-phone" class="p-button-success" />
      </div>
    </div>
    <!-- Display the breadcrumb path -->
    <p class="text-sm text-gray-500">{{ breadcrumb }}</p>
  </div>
</template>
