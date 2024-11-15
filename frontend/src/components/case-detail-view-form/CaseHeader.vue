<script setup lang="ts">
import Button from 'primevue/button'

defineProps<{
  caseNumber: string
}>()
</script>

<template>
  <div class="flex justify-between items-center mb-6 p-4">
    <h1 class="text-2xl font-bold text-green-700">Case #{{ caseNumber }}</h1>
    <div class="flex gap-4">
      <Button class="p-button-success" icon="pi pi-file-pdf" label="Generate PDF" />
      <Button class="p-button-success" icon="pi pi-phone" label="Plan Call" />
    </div>
  </div>
</template>
