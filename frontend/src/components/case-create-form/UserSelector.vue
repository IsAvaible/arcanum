<script setup lang="ts">
import MultiSelect from 'primevue/multiselect'
import Button from 'primevue/button'

type Person = { label: string; value: string; image: string }

const props = defineProps<{
  assigneeLabel: string
  peopleOptions: Person[]
  selectedPeople: Person[]
}>()

const emit = defineEmits<{ (e: 'update:selectedPeople', v: Person[]): void }>()
</script>

<template>
  <MultiSelect
    class="w-full"
    id="assignees"
    :options="props.peopleOptions"
    option-label="label"
    :model-value="props.selectedPeople"
    @update:modelValue="emit('update:selectedPeople', $event)"
    :placeholder="`Select ${assigneeLabel}`"
    display="chip"
    filter
  >
    <template #option="slotProps">
      <div class="flex items-center gap-x-3 pl-2">
        <img
          :alt="`Profile image of ${slotProps.option.name}`"
          :src="slotProps.option.image"
          class="rounded-full size-5 ring-offset-2 ring-1 ring-slate-600"
        />
        <p class="text-base">{{ slotProps.option.label }}</p>
      </div>
    </template>

    <template #dropdownicon>
      <i class="pi pi-user" />
    </template>

    <template #header>
      <div class="font-medium px-3 py-2">Available {{ assigneeLabel }}</div>
    </template>

    <template #footer>
      <div class="p-3 flex justify-between">
        <Button label="Add New" severity="secondary" text size="small" icon="pi pi-plus" />
        <Button
          label="Remove All"
          severity="danger"
          text
          size="small"
          icon="pi pi-times"
          @click="selectedPeople = []"
        />
      </div>
    </template>
  </MultiSelect>
</template>

<style scoped></style>
