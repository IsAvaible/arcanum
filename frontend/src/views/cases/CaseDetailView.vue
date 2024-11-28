<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Textarea from 'primevue/textarea'
import Drawer from 'primevue/drawer' // Import the Drawer component
import { useRouter } from 'vue-router'

const caseNumber = ref('12345')
const breadcrumb = ref('Cases / Servicecase / Overview')

const router = useRouter()

const caseDetails = ref({
  type: 'Servicecase',
  createdBy: 'Jason Nicholas Arifin',
  createdOn: new Date('2024-10-25T10:28:00'),
  updatedOn: new Date('2024-10-25T10:28:00'),
  reference: '1234',
  description: '',
  solution: '',
})

const priorities = [
  { name: 'P0', code: 'p0', color: '#ef4444' },
  { name: 'P1', code: 'p1', color: '#f97316' },
  { name: 'P2', code: 'p2', color: '#eab308' },
  { name: 'P3', code: 'p3', color: '#22c55e' },
]

const statuses = [
  { name: 'Offen', code: 'open', color: '#e6f4ff', textColor: '#0284c7' },
  { name: 'In Bearbeitung', code: 'in-progress', color: '#fff7ed', textColor: '#ea580c' },
  { name: 'Abgeschlossen', code: 'completed', color: '#f0fdf4', textColor: '#16a34a' },
]

const users = [
  { id: 1, name: 'Dragnee1Natsu', image: '/placeholder.svg?height=32&width=32' },
  { id: 2, name: 'Simon Conrad', image: '/placeholder.svg?height=32&width=32' },
  { id: 3, name: 'emre440', image: '/placeholder.svg?height=32&width=32' },
  { id: 4, name: 'AdminUser', image: '/placeholder.svg?height=32&width=32' },
  { id: 5, name: 'TestUser', image: '/placeholder.svg?height=32&width=32' },
]

const selectedPriority = ref(priorities[0])
const selectedStatus = ref(statuses[0])
const selectedAssignee = ref(null)

// File upload variables and handlers
const files = ref<Array<{ name: string; preview: string }>>([])
const isUploadCompleted = ref(false)

const handleUpload = () => {
  if (files.value.length > 0) {
    console.log('Uploading files:')
    files.value.forEach((fileData) => {
      console.log(`Uploading file: ${fileData.name}`)
    })
    isUploadCompleted.value = true
    alert('Files uploaded successfully!')
  } else {
    console.error('No files selected for upload.')
    alert('No files to upload!')
  }
}

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    Array.from(target.files).forEach((file) => {
      const preview = URL.createObjectURL(file)
      files.value.push({ name: file.name, preview })
    })
    isUploadCompleted.value = false // Reset state when new files are selected
    console.log('Files selected:', files.value)
  }
}

const removeFile = (index: number) => {
  files.value.splice(index, 1)
  if (files.value.length === 0) {
    isUploadCompleted.value = false // Ensure the button reappears if files are removed
  }
}

const tabs = ref([{ label: 'PDF' }, { label: 'Audio' }, { label: 'Video' }, { label: 'Image' }])

// Drawer variables
const visibleRight = ref(false)
const selectedFile = ref<{ name: string; preview: string } | null>(null)

const isEditing = ref(false) // Track editing mode
const newFileName = ref('') // Temporary file name for editing

const openFileInDrawer = (file: { name: string; preview: string }) => {
  selectedFile.value = file
  visibleRight.value = true
  isEditing.value = false // Reset editing mode when drawer opens
}

const editFile = () => {
  if (selectedFile.value) {
    newFileName.value = selectedFile.value.name // Pre-fill with current file name
    isEditing.value = true
  }
}

const saveFileName = () => {
  if (selectedFile.value && newFileName.value.trim()) {
    const fileIndex = files.value.findIndex((file) => file.name === selectedFile.value!.name)
    if (fileIndex !== -1) {
      files.value[fileIndex].name = newFileName.value.trim() // Update file name
      selectedFile.value.name = newFileName.value.trim()
      isEditing.value = false // Exit editing mode
      alert('File name updated successfully!')
    }
  }
}

const cancelEdit = () => {
  isEditing.value = false // Cancel editing mode
  newFileName.value = '' // Reset file name
}

const downloadFile = () => {
  if (selectedFile.value) {
    const a = document.createElement('a')
    a.href = selectedFile.value.preview
    a.download = selectedFile.value.name
    a.click()
  }
}

// Function to open the file content
const openFile = () => {
  if (selectedFile.value) {
    window.open(selectedFile.value.preview, '_blank') // Open in a new tab
  } else {
    alert('No file selected to open!')
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex justify-between items-center mb-2">
        <div class="flex gap-3 items-center">
          <Button
            @click="router.push('/cases')"
            icon="pi pi-chevron-left"
            outlined
            rounded
            v-tooltip.top="{ value: 'Return to Case List', showDelay: 1000 }"
          />
          <h1 class="text-2xl font-bold text-gray-900">Case #{{ caseNumber }}</h1>
        </div>

        <div class="flex gap-2">
          <Button label="Generate PDF" icon="pi pi-file-pdf" class="p-button-success" />
          <Button label="Plan Call" icon="pi pi-phone" class="p-button-success" />
        </div>
      </div>
      <p class="text-sm text-gray-500">{{ breadcrumb }}</p>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Details Card -->
      <Card>
        <template #title>
          <h2 class="text-xl font-semibold mb-4">Details</h2>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Case Type</label>
              <InputText v-model="caseDetails.type" class="w-full" />
            </div>
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Reference</label>
              <InputText v-model="caseDetails.reference" class="w-full" />
            </div>
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Created by</label>
              <InputText v-model="caseDetails.createdBy" class="w-full" />
            </div>
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Created on</label>
              <Calendar v-model="caseDetails.createdOn" showTime hourFormat="24" class="w-full" />
            </div>
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Updated on</label>
              <Calendar v-model="caseDetails.updatedOn" showTime hourFormat="24" class="w-full" />
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
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <Dropdown
                v-model="selectedPriority"
                :options="priorities"
                optionLabel="name"
                class="w-full"
              />
            </div>
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Dropdown
                v-model="selectedStatus"
                :options="statuses"
                optionLabel="name"
                class="w-full"
              />
            </div>

            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
              <Dropdown
                v-model="selectedAssignee"
                :options="users"
                optionLabel="name"
                placeholder="Select Assignee"
                class="w-full"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Description Card -->
    <Card class="mt-6">
      <template #title>
        <h2 class="text-xl font-semibold mb-4">Description</h2>
      </template>
      <template #content>
        <Textarea v-model="caseDetails.description" rows="4" class="w-full" />
      </template>
    </Card>

    <!-- Solution Card -->
    <Card class="mt-6">
      <template #title>
        <h2 class="text-xl font-semibold mb-4">Solution</h2>
      </template>
      <template #content>
        <Textarea v-model="caseDetails.solution" rows="4" class="w-full" />
      </template>
    </Card>

    <!-- Data Card -->
    <Card class="mt-6">
      <template #title>
        <h2 class="text-xl font-semibold mb-4">Data</h2>
      </template>
      <template #content>
        <div class="flex flex-col items-center space-y-4">
          <!-- File Input -->
          <div class="relative flex flex-col items-center space-y-2">
            <input
              id="file-upload"
              type="file"
              @change="onFileChange"
              multiple
              :accept="'image/jpeg,image/png,image/gif,audio/mp3,audio/wav,video/mp4,video/avi,application/pdf'"
              class="block border-gray-300 rounded-md shadow-sm focus:ring-blue-500 hover:border-blue-500"
            />
            <p class="text-gray-500 text-sm">You can upload multiple files</p>
          </div>

          <!-- Uploaded Files List -->
          <div v-if="files.length" class="w-full mt-4">
            <h3 class="text-md font-semibold mb-2">Uploaded Files:</h3>
            <ul class="list-disc pl-5 space-y-1">
              <li
                v-for="(file, index) in files"
                :key="index"
                class="flex items-center text-gray-700 space-x-2"
              >
                <a class="text-blue-500 underline cursor-pointer" @click="openFileInDrawer(file)">
                  {{ file.name }}
                </a>
                <Button
                  icon="pi pi-trash"
                  class="p-button-text p-button-danger ml-2"
                  @click="removeFile(index)"
                />
              </li>
            </ul>
          </div>

          <!-- Upload Button -->
          <Button
            v-if="!isUploadCompleted"
            label="Upload Files"
            class="p-button-success"
            @click="handleUpload"
            :disabled="files.length === 0"
          />
        </div>
      </template>
    </Card>

    <!-- Drawer for File Preview -->
    <Drawer
      v-model:visible="visibleRight"
      header="File Preview"
      position="right"
      class="bg-gray-100 text-gray-900"
    >
      <template v-if="selectedFile">
        <div class="p-6">
          <!-- File Icon -->
          <div class="flex justify-center mb-6">
            <i class="pi pi-file text-gray-500 text-4xl"></i>
          </div>

          <!-- File Name and Details -->
          <div class="text-center mb-4">
            <h2 class="text-lg font-semibold">
              {{ isEditing ? 'Edit File Name' : selectedFile.name }}
            </h2>
            <p v-if="!isEditing" class="text-sm text-gray-500">2.5 GB, 01:30:45</p>
          </div>

          <!-- Edit Input -->
          <div v-if="isEditing" class="mb-6">
            <InputText v-model="newFileName" placeholder="Enter new file name" class="w-full" />
            <div class="flex justify-around mt-2">
              <Button
                label="Save"
                icon="pi pi-check"
                class="p-button-success"
                @click="saveFileName"
              />
              <Button
                label="Cancel"
                icon="pi pi-times"
                class="p-button-secondary"
                @click="cancelEdit"
              />
            </div>
          </div>

          <!-- File Description -->
          <div v-if="!isEditing" class="mb-6">
            <h3 class="text-sm font-bold mb-2 text-gray-700">File Description</h3>
            <p class="text-sm text-gray-600">
              I literally just learned that my favorite board game in the whole world (Monopoly) is
              based on Atlantic City!
            </p>
          </div>

          <!-- File Shared Section -->
          <div v-if="!isEditing" class="mb-6">
            <h3 class="text-sm font-bold mb-2 text-gray-700">File Shared With:</h3>
            <div class="flex items-center space-x-3">
              <div
                class="w-8 h-8 bg-gray-300 rounded-full flex justify-center items-center text-gray-700"
              >
                A
              </div>
              <span class="text-sm text-gray-800">Alexander Mikolaenko (You)</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div v-if="!isEditing" class="flex justify-around mt-6 space-x-4">
            <Button
              label="Share"
              icon="pi pi-external-link"
              class="p-button-outlined p-button-primary"
            />
            <Button
              label="Edit"
              icon="pi pi-pencil"
              class="p-button-outlined p-button-warning"
              @click="editFile"
            />
            <Button
              label="Open"
              icon="pi pi-external-link"
              class="p-button-outlined p-button-success"
              @click="openFile"
            />
          </div>
        </div>
      </template>
    </Drawer>
  </div>
</template>
