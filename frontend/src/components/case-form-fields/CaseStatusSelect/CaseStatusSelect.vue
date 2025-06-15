<script setup lang="ts">
import Select, { type SelectProps } from 'primevue/select'
import MultiSelect from 'primevue/multiselect'
import Tag from 'primevue/tag'
import { useVModel } from '@vueuse/core'

const props = defineProps<SelectProps & { modelValue: string; multiSelect?: boolean }>()
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
  <component
    :is="multiSelect ? MultiSelect : Select"
    v-bind="props"
    :options="statuses"
    :model-value="statuses.find((s) => s.name === status)"
    @update:model-value="status = $event.name"
    option-label="name"
  >
    <template v-if="!multiSelect" #value="slotProps">
      <Tag
        v-if="slotProps.value"
        :value="slotProps.value.name"
        :severity="slotProps.value.severity"
      />
    </template>
    <template #option="slotProps">
      <Tag :value="slotProps.option.name" :severity="slotProps.option.severity" />
    </template>
  </component>
</template>

<style scoped></style>
