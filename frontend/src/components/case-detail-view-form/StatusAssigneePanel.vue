<script setup lang="ts">
// Import necessary Vue composition API functions and PrimeVue components
import { defineProps, defineEmits } from 'vue'
import Card from 'primevue/card'
import Dropdown from 'primevue/dropdown'
import MultiSelect from 'primevue/multiselect'

// Define props for the component
const props = defineProps<{
  modelValue: {
    priority: any
    status: any
    assignee: any[]
  }
}>()

// Define emits for the component
const emit = defineEmits(['update:modelValue'])

// Function to update a specific field in the modelValue
const updateField = (field: string, value: any) => {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}

// Define priority options
const priorities = [
  { name: 'P0', code: 'p0', color: '#ef4444' },
  { name: 'P1', code: 'p1', color: '#f97316' },
  { name: 'P2', code: 'p2', color: '#eab308' },
  { name: 'P3', code: 'p3', color: '#22c55e' },
]

// Define status options
const statuses = [
  { name: 'Offen', code: 'open', color: '#e6f4ff', textColor: '#0284c7' },
  { name: 'In Bearbeitung', code: 'in-progress', color: '#fff7ed', textColor: '#ea580c' },
  { name: 'Abgeschlossen', code: 'completed', color: '#f0fdf4', textColor: '#16a34a' },
]

// Define user options for assignee
const users = [
  { id: 1, name: 'Dragnee1Natsu', image: '/placeholder.svg?height=32&width=32' },
  { id: 2, name: 'Simon Conrad', image: '/placeholder.svg?height=32&width=32' },
  { id: 3, name: 'emre440', image: '/placeholder.svg?height=32&width=32' },
  { id: 4, name: 'AdminUser', image: '/placeholder.svg?height=32&width=32' },
  { id: 5, name: 'TestUser', image: '/placeholder.svg?height=32&width=32' },
]
</script>

<template>
  <Card>
    <template #title>
      <!-- Card title -->
      <h2 class="text-xl font-semibold mb-4">Status & Assignee</h2>
    </template>
    <template #content>
      <div class="space-y-4">
        <!-- Priority dropdown -->
        <div class="field">
          <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <Dropdown
            :modelValue="modelValue.priority"
            @update:modelValue="updateField('priority', $event)"
            :options="priorities"
            optionLabel="name"
            class="w-full"
          >
            <!-- Custom template for selected value -->
            <template #value="slotProps">
              <div class="flex items-center gap-2" v-if="slotProps.value">
                <div
                  class="w-3 h-3 rounded-full"
                  :style="{ backgroundColor: slotProps.value.color }"
                ></div>
                <span>{{ slotProps.value.name }}</span>
              </div>
            </template>
            <!-- Custom template for option -->
            <template #option="slotProps">
              <div class="flex items-center gap-2">
                <div
                  class="w-3 h-3 rounded-full"
                  :style="{ backgroundColor: slotProps.option.color }"
                ></div>
                <span>{{ slotProps.option.name }}</span>
              </div>
            </template>
          </Dropdown>
        </div>

        <!-- Status dropdown -->
        <div class="field">
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <Dropdown
            :modelValue="modelValue.status"
            @update:modelValue="updateField('status', $event)"
            :options="statuses"
            optionLabel="name"
            class="w-full"
          >
            <!-- Custom template for selected value -->
            <template #value="slotProps">
              <div v-if="slotProps.value" class="flex items-center">
                <div
                  class="px-3 py-1 rounded-md text-sm"
                  :style="{
                    backgroundColor: slotProps.value.color,
                    color: slotProps.value.textColor,
                  }"
                >
                  {{ slotProps.value.name }}
                </div>
              </div>
            </template>
            <!-- Custom template for option -->
            <template #option="slotProps">
              <div class="flex items-center">
                <div
                  class="px-3 py-1 rounded-md text-sm"
                  :style="{
                    backgroundColor: slotProps.option.color,
                    color: slotProps.option.textColor,
                  }"
                >
                  {{ slotProps.option.name }}
                </div>
              </div>
            </template>
          </Dropdown>
        </div>

        <!-- Assignee MultiSelect -->
        <div class="field">
          <label class="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
          <MultiSelect
            :modelValue="modelValue.assignee"
            @update:modelValue="updateField('assignee', $event)"
            :options="users"
            optionLabel="name"
            placeholder="Select Assignees"
            display="chip"
            class="w-full"
          >
            <template #value="slotProps">
              <div class="flex flex-wrap gap-2">
                <div v-for="option in slotProps.value" :key="option.id" class="flex items-center gap-2">
                  <img
                    :src="option.image"
                    :alt="option.name"
                    class="w-6 h-6 rounded-full"
                  />
                  <span>{{ option.name }}</span>
                </div>
              </div>
            </template>
            <template #option="slotProps">
              <div class="flex items-center gap-2">
                <img
                  :src="slotProps.option.image"
                  :alt="slotProps.option.name"
                  class="w-6 h-6 rounded-full"
                />
                <span>{{ slotProps.option.name }}</span>
              </div>
            </template>
          </MultiSelect>
          <p class="mt-2 text-sm text-gray-500" v-if="!modelValue.assignee?.length">
            No assignees selected
          </p>
        </div>
      </div>
    </template>
  </Card>
</template>
