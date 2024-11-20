<script setup lang="ts">
// Import necessary Vue composition API functions
import { ref } from 'vue'

// Import custom components
import CaseHeader from '@/components/case-detail-view-form/CaseHeader.vue'
import DetailsPanel from '@/components/case-detail-view-form/DetailsPanel.vue'
import StatusAssigneePanel from '@/components/case-detail-view-form/StatusAssigneePanel.vue'
import DescriptionPanel from '@/components/case-detail-view-form/DescriptionPanel.vue'
import SolutionPanel from '@/components/case-detail-view-form/SolutionPanel.vue'
import DataPanel from '@/components/case-detail-view-form/DataPanel.vue'

// Define reactive references for case data
const caseNumber = ref('12345')
const breadcrumb = ref('Cases / Servicecase / Overview')

// Define the structure of the case details
const caseDetails = ref({
  type: 'Servicecase',
  createdBy: 'Jason Nicholas Arifin',
  createdOn: new Date('2024-10-25T10:28:00'),
  updatedOn: new Date('2024-10-25T10:28:00'),
  reference: '1234',
  description: '',
  solution: '',
  priority: null,
  status: null,
  assignee: [],
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Case header component -->
    <CaseHeader :case-number="caseNumber" :breadcrumb="breadcrumb" />

    <!-- Grid layout for details and status panels -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Details panel component -->
      <DetailsPanel v-model="caseDetails" />
      <!-- Status and assignee panel component -->
      <StatusAssigneePanel v-model="caseDetails" />
    </div>

    <!-- Description panel component -->
    <DescriptionPanel v-model="caseDetails.description" />
    <!-- Solution panel component -->
    <SolutionPanel v-model="caseDetails.solution" />
    <!-- Data panel component -->
    <DataPanel />
  </div>
</template>

<style scoped>
/* Style overrides for PrimeVue components */
:deep(.p-card) {
  background-color: white;
  border-radius: 0.5rem;
}

:deep(.p-dropdown),
:deep(.p-calendar),
:deep(.p-inputtext),
:deep(.p-textarea) {
  width: 100%;
}

:deep(.p-fileupload-buttonbar) {
  background-color: transparent;
  border: none;
  justify-content: center;
}

:deep(.p-button.p-fileupload-choose) {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

:deep(.p-button.p-fileupload-choose:hover) {
  background-color: #2563eb;
  border-color: #2563eb;
}

:deep(.p-dropdown-item) {
  padding: 0.5rem !important;
}

:deep(.p-dropdown-label) {
  padding: 0.5rem !important;
}
</style>
