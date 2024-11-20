<script setup lang="ts">
// Import necessary Vue composition API functions and PrimeVue components
import { defineProps, defineEmits } from 'vue'
import Card from 'primevue/card'
import Textarea from 'primevue/textarea'

// Define props for the component
const props = defineProps<{
  modelValue: string  // The solution text
}>()

// Define emits for the component
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <Card class="mb-6">
    <template #title>
      <!-- Card title -->
      <h2 class="text-xl font-semibold mb-4">Solution</h2>
    </template>
    <template #content>
      <!-- Textarea for solution input -->
      <Textarea
        :modelValue="modelValue"
        @update:modelValue="emit('update:modelValue', $event)"
        rows="4"
        class="w-full"
      />
    </template>
  </Card>
</template>
