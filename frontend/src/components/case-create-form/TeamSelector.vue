<script setup lang="ts">
import { ref } from 'vue'
import CascadeSelect from 'primevue/cascadeselect'

export type Team = {
  id: number
  name: string
}

const props = defineProps<{
  selectedTeam?: Team
  invalid?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:selectedTeam', value: Team): void
}>()

const teamOptions = ref([
  {
    label: 'Marketing',
    teams: [
      { id: 1, name: 'Marketing Team 1' },
      { id: 2, name: 'Marketing Team 2' },
      { id: 3, name: 'Marketing Team 3' },
    ],
  },
  {
    label: 'Sales',
    teams: [
      { id: 4, name: 'Sales Team 1' },
      { id: 5, name: 'Sales Team 2' },
      { id: 6, name: 'Sales Team 3' },
    ],
  },
  {
    label: 'Development',
    teams: [
      { id: 7, name: 'Development Team 1' },
      { id: 8, name: 'Development Team 2' },
      { id: 9, name: 'Development Team 3' },
    ],
  },
])
</script>

<template>
  <CascadeSelect
    :model-value="props.selectedTeam"
    @update:model-value="emit('update:selectedTeam', $event)"
    :options="teamOptions"
    optionGroupLabel="label"
    :optionGroupChildren="['teams']"
    optionLabel="name"
    placeholder="Select a Team"
    dropdown-icon="pi pi-users"
    :invalid="props.invalid"
  >
  </CascadeSelect>
</template>

<style scoped></style>
