<script setup lang="ts">
import Select, { type SelectProps } from 'primevue/select'
import Tag from 'primevue/tag'
import { useVModel } from '@vueuse/core'

const props = defineProps<SelectProps & { modelValue: string }>()
const emit = defineEmits(['update:modelValue'])

const status = useVModel(props, 'modelValue', emit)

interface Status {
  name: string
  severity: string
}

const statuses: Status[] = [
  { name: 'Open', severity: 'info' },
  { name: 'In Progress', severity: 'warn' },
  { name: 'Solved', severity: 'success' },
  { name: 'Closed', severity: 'success' },
]
</script>

<template>
  <Select
    v-bind="props"
    :options="statuses"
    :model-value="statuses.find((s) => s.name === status)"
    @update:model-value="status = $event.name"
    option-label="name"
  >
    <template #value="slotProps">
      <Tag
        v-if="slotProps.value"
        :value="slotProps.value.name"
        :severity="slotProps.value.severity"
      />
    </template>
    <template #option="slotProps">
      <Tag :value="slotProps.option.name" :severity="slotProps.option.severity" />
    </template>
  </Select>
</template>

<style scoped></style>
