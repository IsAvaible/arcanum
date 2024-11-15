<script setup lang="ts">
import { ref } from 'vue'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import MultiSelect from 'primevue/multiselect'

const statuses = [
  { name: 'Offen', code: 'open', severity: 'info' },
  { name: 'In Bearbeitung', code: 'in-progress', severity: 'warning' },
  { name: 'Abgeschlossen', code: 'completed', severity: 'success' },
]

const selectedStatus = ref(statuses[0])

const users = [
  { id: 1, name: 'Dragnee1Natsu', image: '/placeholder.svg?height=32&width=32' },
  { id: 2, name: 'Simon Conrad', image: '/placeholder.svg?height=32&width=32' },
  { id: 3, name: 'emre440', image: '/placeholder.svg?height=32&width=32' },
  { id: 4, name: 'AdminUser', image: '/placeholder.svg?height=32&width=32' },
  { id: 5, name: 'TestUser', image: '/placeholder.svg?height=32&width=32' },
]

const selectedAssignee = ref(null)

const priorities = [
  { name: 'P0', code: 'p0', color: '#ef4444' }, // Red
  { name: 'P1', code: 'p1', color: '#f97316' }, // Orange
  { name: 'P2', code: 'p2', color: '#eab308' }, // Yellow
  { name: 'P3', code: 'p3', color: '#22c55e' }, // Green
]

const selectedPriority = ref(priorities[0])
</script>

<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-xl font-semibold mb-6">Status & Assignee</h2>

    <!-- Priority Section -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">Priority</label>
      <Dropdown v-model="selectedPriority" :options="priorities" optionLabel="name" class="w-full">
        <template #value="slotProps">
          <div class="flex items-center gap-2" v-if="slotProps.value">
            <div
              class="w-3 h-3 rounded-full"
              :style="{ backgroundColor: slotProps.value.color }"
            ></div>
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
      </Dropdown>
    </div>

    <!-- Status Section -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
      <Dropdown v-model="selectedStatus" :options="statuses" optionLabel="name" class="w-full">
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
      </Dropdown>
    </div>

    <!-- Assignee Section -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
      <MultiSelect
        v-model="selectedAssignee"
        :options="users"
        optionLabel="name"
        placeholder="Select Assignee"
        :maxSelectedLabels="3"
        class="w-full"
        display="chip"
      >
        <template #option="slotProps">
          <div class="flex items-center gap-2 p-2">
            <img
              :src="slotProps.option.image"
              :alt="slotProps.option.name"
              class="w-6 h-6 rounded-full"
            />
            <span>{{ slotProps.option.name }}</span>
          </div>
        </template>
        <template #chip="slotProps">
          <div class="flex items-center gap-2">
            <img
              :src="slotProps.value.image"
              :alt="slotProps.value.name"
              class="w-6 h-6 rounded-full"
            />
            <span>{{ slotProps.value.name }}</span>
          </div>
        </template>
      </MultiSelect>
    </div>

    <div class="text-gray-500 text-sm" v-if="!selectedAssignee">No assignee selected</div>
  </div>
</template>

<style scoped>
:deep(.p-dropdown) {
  width: 100%;
}

:deep(.p-multiselect) {
  width: 100%;
}

:deep(.p-tag) {
  width: 100%;
  justify-content: center;
}

:deep(.p-dropdown-label) {
  display: flex;
  align-items: center;
}
</style>
