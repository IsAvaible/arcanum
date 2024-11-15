<script setup lang="ts">
import { ref } from 'vue'
import InputText from 'primevue/inputtext'
import Calendar from 'primevue/calendar'

interface CaseDetails {
  type: string
  createdBy: string
  createdOn: Date
  updatedOn: Date
  priority: string
}

const details = ref<CaseDetails>({
  type: 'Servicecase',
  createdBy: 'Jason Nicholas Arifin',
  createdOn: new Date('2024-10-25T10:28:00'),
  updatedOn: new Date('2024-10-25T10:28:00'),
  priority: 'High',
})
</script>

<template>
  <div class="bg-white rounded-lg shadow p-6 mb-6">
    <h2 class="text-xl font-semibold mb-6">Details</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="field">
        <label class="block text-sm font-medium text-gray-700 mb-1">Case Type</label>
        <InputText v-model="details.type" class="w-full" />
      </div>
      <div class="field">
        <label class="block text-sm font-medium text-gray-700 mb-1">Created by</label>
        <InputText v-model="details.createdBy" class="w-full" />
      </div>
      <div class="field">
        <label class="block text-sm font-medium text-gray-700 mb-1">Created on</label>
        <Calendar v-model="details.createdOn" showTime hourFormat="24" class="w-full" />
      </div>
      <div class="field">
        <label class="block text-sm font-medium text-gray-700 mb-1">Updated on</label>
        <Calendar v-model="details.updatedOn" showTime hourFormat="24" class="w-full" />
      </div>
      <div class="field">
        <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
        <InputText v-model="details.priority" class="w-full" />
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-inputtext) {
  width: 100%;
}

:deep(.p-calendar) {
  width: 100%;
}
</style>
