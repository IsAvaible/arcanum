<script setup lang="ts">
// Import necessary Vue composition API functions and PrimeVue components
import { defineProps, defineEmits } from 'vue'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Calendar from 'primevue/calendar'

// Define props for the component
const props = defineProps<{
  modelValue: {
    type: string
    reference: string
    createdBy: string
    createdOn: Date
    updatedOn: Date
  }
}>()

// Define emits for the component
const emit = defineEmits(['update:modelValue'])

// Function to update a specific field in the modelValue
const updateField = (field: keyof typeof props.modelValue, value: any) => {
  if (value instanceof Event && value.target instanceof HTMLInputElement) {
    value = value.target.value // Typisieren von `value.target`
  }
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}
</script>

<template>
  <Card>
    <template #title>
      <!-- Card title -->
      <h2 class="text-xl font-semibold mb-4">Details</h2>
    </template>
    <template #content>
      <!-- Grid layout for form fields -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Case Type field -->
        <div class="field">
          <label class="block text-sm font-medium text-gray-700 mb-1">Case Type</label>
          <InputText
            :value="modelValue.type"
            @input="updateField('type', $event)"
            class="w-full"
          />
        </div>

        <!-- Reference field -->
        <div class="field">
          <label class="block text-sm font-medium text-gray-700 mb-1">Reference</label>
          <InputText
            :value="modelValue.reference"
            @input="updateField('reference', $event)"
            class="w-full"
          />
        </div>

        <!-- Created by field (read-only) -->
        <div class="field">
          <label class="block text-sm font-medium text-gray-700 mb-1">Created by</label>
          <InputText :value="modelValue.createdBy" class="w-full" readonly />
        </div>

        <!-- Created on field -->
        <div class="field">
          <label class="block text-sm font-medium text-gray-700 mb-1">Created on</label>
          <Calendar
            :modelValue="modelValue.createdOn"
            @update:modelValue="updateField('createdOn', $event)"
            showTime
            hourFormat="24"
            class="w-full"
          />
        </div>

        <!-- Updated on field -->
        <div class="field">
          <label class="block text-sm font-medium text-gray-700 mb-1">Updated on</label>
          <Calendar
            :modelValue="modelValue.updatedOn"
            @update:modelValue="updateField('updatedOn', $event)"
            showTime
            hourFormat="24"
            class="w-full"
          />
        </div>
      </div>
    </template>
  </Card>
</template>
