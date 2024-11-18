<script setup lang="ts">
// Import necessary components and composables
import { ref } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Textarea from 'primevue/textarea'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import FileUpload from 'primevue/fileupload'

// Define reactive variables for case details
const caseNumber = ref('12345')
const breadcrumb = ref('Cases / Servicecase / Overview')

// Define the structure and initial values for case details
const caseDetails = ref({
  type: 'Servicecase',
  createdBy: 'Jason Nicholas Arifin',
  createdOn: new Date('2024-10-25T10:28:00'),
  updatedOn: new Date('2024-10-25T10:28:00'),
  reference: '1234',
  description: '',
  solution: '',
})

// Define priority options with associated colors
const priorities = [
  { name: 'P0', code: 'p0', color: '#ef4444' },
  { name: 'P1', code: 'p1', color: '#f97316' },
  { name: 'P2', code: 'p2', color: '#eab308' },
  { name: 'P3', code: 'p3', color: '#22c55e' },
]

// Define status options with associated colors and text colors
const statuses = [
  { name: 'Offen', code: 'open', color: '#e6f4ff', textColor: '#0284c7' },
  { name: 'In Bearbeitung', code: 'in-progress', color: '#fff7ed', textColor: '#ea580c' },
  { name: 'Abgeschlossen', code: 'completed', color: '#f0fdf4', textColor: '#16a34a' },
]

// Define user options for assignee selection
const users = [
  { id: 1, name: 'Dragnee1Natsu', image: '/placeholder.svg?height=32&width=32' },
  { id: 2, name: 'Simon Conrad', image: '/placeholder.svg?height=32&width=32' },
  { id: 3, name: 'emre440', image: '/placeholder.svg?height=32&width=32' },
  { id: 4, name: 'AdminUser', image: '/placeholder.svg?height=32&width=32' },
  { id: 5, name: 'TestUser', image: '/placeholder.svg?height=32&width=32' },
]

// Initialize selected values
const selectedPriority = ref(priorities[0])
const selectedStatus = ref(statuses[0])
const selectedAssignee = ref(null)

// Function to handle file upload (placeholder for now)
const onUpload = (event: unknown) => {
  console.log('File uploaded:', event)
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header section with case number, actions, and breadcrumb -->
    <div class="mb-8">
      <div class="flex justify-between items-center mb-2">
        <h1 class="text-2xl font-bold text-gray-900">Case #{{ caseNumber }}</h1>
        <div class="flex gap-2">
          <Button label="Generate PDF" icon="pi pi-file-pdf" class="p-button-success" />
          <Button label="Plan Call" icon="pi pi-phone" class="p-button-success" />
        </div>
      </div>
      <p class="text-sm text-gray-500">{{ breadcrumb }}</p>
    </div>

    <!-- Main content grid with two columns for larger screens -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Details Card -->
      <Card>
        <template #title>
          <h2 class="text-xl font-semibold mb-4">Details</h2>
        </template>
        <template #content>
          <!-- Grid layout for case details -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Case Type field (read-only) -->
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Case Type</label>
              <InputText v-model="caseDetails.type" class="w-full" readonly />
            </div>
            <!-- Reference field (read-only) -->
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Reference</label>
              <InputText v-model="caseDetails.reference" class="w-full" readonly />
            </div>
            <!-- Created by field (read-only) -->
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Created by</label>
              <InputText v-model="caseDetails.createdBy" class="w-full" readonly />
            </div>
            <!-- Created on field (read-only) -->
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Created on</label>
              <Calendar
                v-model="caseDetails.createdOn"
                showTime
                hourFormat="24"
                class="w-full"
                readonly
              />
            </div>
            <!-- Updated on field (read-only) -->
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Updated on</label>
              <Calendar
                v-model="caseDetails.updatedOn"
                showTime
                hourFormat="24"
                class="w-full"
                readonly
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Status & Assignee Card -->
      <Card>
        <template #title>
          <h2 class="text-xl font-semibold mb-4">Status & Assignee</h2>
        </template>
        <template #content>
          <div class="space-y-4">
            <!-- Priority dropdown -->
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <Dropdown
                v-model="selectedPriority"
                :options="priorities"
                optionLabel="name"
                class="w-full"
                disabled
              >
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

            <!-- Status dropdown -->
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Dropdown
                v-model="selectedStatus"
                :options="statuses"
                optionLabel="name"
                class="w-full"
                disabled
              >
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

            <!-- Assignee dropdown -->
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
              <Dropdown
                v-model="selectedAssignee"
                :options="users"
                optionLabel="name"
                placeholder="Select Assignee"
                class="w-full"
              >
                <template #value="slotProps">
                  <div class="flex items-center gap-2" v-if="slotProps.value">
                    <img
                      :src="slotProps.value.image"
                      :alt="slotProps.value.name"
                      class="w-6 h-6 rounded-full"
                    />
                    <span>{{ slotProps.value.name }}</span>
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
              </Dropdown>
              <p class="mt-2 text-sm text-gray-500" v-if="!selectedAssignee">
                No assignee selected
              </p>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Description Card -->
    <Card class="mb-6">
      <template #title>
        <h2 class="text-xl font-semibold mb-4">Description</h2>
      </template>
      <template #content>
        <Textarea v-model="caseDetails.description" rows="4" class="w-full" />
      </template>
    </Card>

    <!-- Solution Card -->
    <Card class="mb-6">
      <template #title>
        <h2 class="text-xl font-semibold mb-4">Solution</h2>
      </template>
      <template #content>
        <Textarea v-model="caseDetails.solution" rows="4" class="w-full" />
      </template>
    </Card>

    <!-- Data Card with TabView for different data types -->
    <Card>
      <template #title>
        <h2 class="text-xl font-semibold mb-4">Data</h2>
      </template>
      <template #content>
        <TabView>
          <!-- Text data tab -->
          <TabPanel header="Text" :value="'text'">
            <Textarea rows="4" class="w-full" />
          </TabPanel>
          <!-- XML data tab -->
          <TabPanel header="XML" :value="'xml'">
            <Textarea rows="4" class="w-full" />
          </TabPanel>
          <!-- JSON data tab -->
          <TabPanel header="JSON" :value="'json'">
            <Textarea rows="4" class="w-full" />
          </TabPanel>
          <!-- Image upload tab -->
          <TabPanel header="Image" :value="'image'">
            <FileUpload
              mode="basic"
              accept="image/*"
              :maxFileSize="1000000"
              @upload="onUpload"
              :auto="true"
              chooseLabel="Choose Image"
            />
          </TabPanel>
          <!-- Audio upload tab -->
          <TabPanel header="Audio" :value="'audio'">
            <FileUpload
              mode="basic"
              accept="audio/*"
              :maxFileSize="1000000"
              @upload="onUpload"
              :auto="true"
              chooseLabel="Choose Audio"
            />
          </TabPanel>
          <!-- Video upload tab -->
          <TabPanel header="Video" :value="'video'">
            <FileUpload
              mode="basic"
              accept="video/*"
              :maxFileSize="10000000"
              @upload="onUpload"
              :auto="true"
              chooseLabel="Choose Video"
            />
          </TabPanel>
        </TabView>
      </template>
    </Card>
  </div>
</template>

<style scoped>
/* Card styling */
:deep(.p-card) {
  background-color: white;
  border-radius: 0.5rem;
}

/* Input field styling */
:deep(.p-dropdown),
:deep(.p-calendar),
:deep(.p-inputtext),
:deep(.p-textarea) {
  width: 100%;
}

/* Tab styling */
:deep(.p-tabview-nav-link) {
  padding: 1rem !important;
}

/* File upload styling */
:deep(.p-fileupload-buttonbar) {
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 0.5rem;
}

/* File upload button styling */
:deep(.p-button.p-fileupload-choose) {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

:deep(.p-button.p-fileupload-choose:hover) {
  background-color: #16a34a;
  border-color: #16a34a;
}

/* Dropdown item styling */
:deep(.p-dropdown-item) {
  padding: 0.5rem !important;
}

/* Dropdown label styling */
:deep(.p-dropdown-label) {
  padding: 0.5rem !important;
}

/* Styling for disabled dropdowns */
:deep(.p-dropdown.p-disabled) {
  opacity: 1;
  background-color: #f3f4f6;
}

:deep(.p-dropdown.p-disabled .p-dropdown-label) {
  color: #374151;
}

/* Styling for read-only input fields */
:deep(.p-inputtext[readonly]) {
  background-color: #f3f4f6;
  cursor: default;
}
</style>
