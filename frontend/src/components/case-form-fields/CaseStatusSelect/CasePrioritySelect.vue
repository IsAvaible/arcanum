<script setup lang="ts">
import Select, { type SelectProps } from 'primevue/select'
import { useVModel } from '@vueuse/core'

const props = defineProps<SelectProps & { modelValue: string }>()
const emit = defineEmits(['update:modelValue'])

const priority = useVModel(props, 'modelValue', emit)

interface Priority {
  name: string
  color: string
}

const priorities: Priority[] = [
  { name: 'High', color: '#ef4444' },
  { name: 'Medium', color: '#eab308' },
  { name: 'Low', color: '#22c55e' },
]
</script>

<template>
  <Select
    v-bind="props"
    :options="priorities"
    :model-value="priorities.find((p) => p.name === priority)"
    @update:model-value="priority = $event.name"
    option-label="name"
  >
    <template #value="slotProps">
      <div class="flex items-center gap-2" v-if="slotProps.value">
        <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: slotProps.value.color }"></div>
        <span>{{ slotProps.value.name }}</span>
      </div>
    </template>
    <template #option="slotProps">
      <div class="flex items-center gap-2">
        <div
          class="w-3 h-3 rounded-full"
          :style="{ backgroundColor: slotProps.option.color }"
        ></div>
        <span>{{ slotProps.option.name }}</span>
      </div>
    </template>
  </Select>
</template>

<style scoped></style>
