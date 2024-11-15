<template>
  <div class="description-panel p-4 border rounded-lg bg-gray-100">
    <h2 class="text-lg font-semibold mb-4">{{ props.title }}</h2>
    <Textarea :value="modelValue" @input="updateValue" rows="4" class="w-full" />
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import Textarea from 'primevue/textarea'

const props = defineProps({
  title: String,
  modelValue: String,
})

const emit = defineEmits(['update:modelValue'])

function updateValue(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<style scoped>
.description-panel {
  border: 1px solid #e5e7eb;
}
</style>
