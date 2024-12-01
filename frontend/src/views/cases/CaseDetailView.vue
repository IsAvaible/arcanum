<script setup lang="ts">
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Textarea from 'primevue/textarea'
import Drawer from 'primevue/drawer' // Import the Drawer component
import { useRouter } from 'vue-router'
import { ref, computed, watch } from 'vue'

// File interface for consistency
interface CustomFile {
  name: string
  preview: string
  description: string
  sharedWith: string
}

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

interface Assignee {
  id: number | null
  name: string
  image?: string | null
}

const selectedAssignee = ref<Assignee | null>(null)

/*const selectedAssignee = ref(null)*/

// File upload variables and handlers
const files = ref<CustomFile[]>([])
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
      files.value.push({ name: file.name, preview, description: '', sharedWith: 'You' })
    })
    isUploadCompleted.value = false
    console.log('Files selected:', files.value)
  }
}

const removeFile = (index: number) => {
  files.value.splice(index, 1)
  if (files.value.length === 0) {
    isUploadCompleted.value = false
  }
}

// Drawer variables
const visibleRight = ref(false)

const isEditing = ref(false)
const selectedFile = ref<{
  name: string
  description: string
  sharedWith: string
  preview: string
} | null>(null)

const editedFile = ref({
  name: '',
  description: '',
  sharedWith: '',
})

// Computed property to bind to editable or readonly mode
const editingFile = computed(() => {
  if (isEditing.value) {
    return editedFile.value // Editing mode
  }
  return selectedFile.value || { name: '', description: '', sharedWith: '', preview: '' } // Default structure if selectedFile is null
})

const openFileInDrawer = (file: CustomFile) => {
  selectedFile.value = file
  visibleRight.value = true
  isEditing.value = false
}

// Function to start editing
const editFile = () => {
  if (selectedFile.value) {
    editedFile.value = { ...selectedFile.value } // Copy selected file to editedFile
    isEditing.value = true
  }
}

// Function to save changes
const saveFileChanges = () => {
  if (selectedFile.value && editedFile.value) {
    selectedFile.value.name = editedFile.value.name
    selectedFile.value.description = editedFile.value.description
    selectedFile.value.sharedWith = editedFile.value.sharedWith
    isEditing.value = false
  }
}

// Function to cancel editing
const cancelEdit = () => {
  isEditing.value = false
  editedFile.value = { name: '', description: '', sharedWith: '' } // Reset editedFile
}
/*
const downloadFile = () => {
  if (selectedFile.value) {
    const a = document.createElement('a')
    a.href = selectedFile.value.preview
    a.download = selectedFile.value.name
    a.click()
  }
}
*/

/*
const openFile = () => {
  if (selectedFile.value) {
    window.open(selectedFile.value.preview, '_blank')
  } else {
    alert('No file selected to open!')
  }
}
*/

const isDrawerExpanded = ref(false) // Controls whether the drawer is expanded

// Watcher to reset the drawer size when it's closed
watch(visibleRight, (newValue) => {
  if (!newValue) {
    isDrawerExpanded.value = false // Reset to default size when closed
  }
})

const expandDrawer = () => {
  isDrawerExpanded.value = !isDrawerExpanded.value // Toggle drawer size
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
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Dropdown
                v-model="selectedStatus"
                :options="statuses"
                optionLabel="name"
                class="w-full"
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

            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
              <Dropdown
                v-model="selectedAssignee"
                :options="[...users, { id: null, name: 'Select Assignee', image: null }]"
                optionLabel="name"
                class="w-full"
                placeholder="Select Assignee"
              >
                <template #value="slotProps">
                  <div
                    class="flex items-center gap-2"
                    v-if="slotProps.value && slotProps.value.id !== null"
                  >
                    <img
                      :src="slotProps.value.image"
                      :alt="slotProps.value.name"
                      class="w-6 h-6 rounded-full"
                    />
                    <span>{{ slotProps.value.name }}</span>
                  </div>
                  <div v-else-if="slotProps.value && slotProps.value.id === null">
                    <span>{{ slotProps.value.name }}</span>
                  </div>
                </template>
                <template #option="slotProps">
                  <div class="flex items-center gap-2">
                    <template v-if="slotProps.option.id !== null">
                      <img
                        :src="slotProps.option.image"
                        :alt="slotProps.option.name"
                        class="w-6 h-6 rounded-full"
                      />
                    </template>
                    <span>{{ slotProps.option.name }}</span>
                  </div>
                </template>
              </Dropdown>
              <p
                class="mt-2 text-sm text-gray-500"
                v-if="!selectedAssignee || selectedAssignee.id === null"
              >
                No assignee selected
              </p>
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
      position="right"
      :style="{ width: isDrawerExpanded ? '75%' : '25%' }"
      class="bg-gray-100 text-gray-900"
    >
      <!-- Drawer Header -->
      <template #header>
        <div class="flex items-center gap-3">
          <i class="pi pi-file text-gray-500 text-2xl"></i>
          <span class="text-lg font-semibold text-gray-900">
            {{ selectedFile?.name || 'File' }}
          </span>
        </div>
      </template>

      <!-- Drawer Content -->
      <template v-if="selectedFile">
        <div class="p-6">
          <!-- File Name -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">File Name</label>
            <InputText v-model="editingFile.name" :disabled="!isEditing" class="w-full" />
          </div>

          <!-- File Description -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">Description</label>
            <InputText v-model="editingFile.description" :disabled="!isEditing" class="w-full" />
          </div>

          <!-- Shared With -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700">Shared With</label>
            <InputText v-model="editingFile.sharedWith" :disabled="!isEditing" class="w-full" />
          </div>

          <!-- Action Buttons -->
          <div class="text-center">
            <Button
              v-if="!isEditing"
              label="Edit"
              icon="pi pi-pencil"
              class="p-button-outlined p-button-success"
              @click="editFile"
            />
            <Button
              v-if="!isEditing"
              label="Open"
              icon="pi pi-external-link"
              class="p-button-outlined p-button-primary"
              @click="expandDrawer"
              style="margin-left: 10px"
            />
            <div v-if="isEditing" class="flex justify-between mt-4">
              <Button
                label="Save"
                icon="pi pi-check"
                class="p-button-success"
                @click="saveFileChanges"
              />
              <Button
                label="Cancel"
                icon="pi pi-times"
                class="p-button-secondary"
                @click="cancelEdit"
              />
            </div>
          </div>

          <!-- Inline Preview (Hidden until "Open" is clicked) -->
          <div v-if="isDrawerExpanded" class="mt-6 border-t pt-4">
            <h3 class="text-md font-semibold mb-4">File Preview</h3>
            <div class="flex justify-center items-center">
              <!-- PDF Preview -->
              <iframe
                v-if="selectedFile.name.endsWith('.pdf')"
                :src="selectedFile.preview"
                class="w-full h-96 border rounded"
              ></iframe>

              <!-- Image Preview -->
              <img
                v-else-if="selectedFile.name.match(/\.(png|jpg|jpeg|gif)$/)"
                :src="selectedFile.preview"
                alt="Image Preview"
                class="w-full h-96 object-contain"
              />

              <!-- Video Preview -->
              <video
                v-else-if="selectedFile.name.endsWith('.mp4') || selectedFile.name.endsWith('.avi')"
                controls
                class="w-full h-96"
              >
                <source :src="selectedFile.preview" />
                Your browser does not support the video tag.
              </video>

              <!-- Audio Preview -->
              <audio
                v-else-if="selectedFile.name.endsWith('.mp3') || selectedFile.name.endsWith('.wav')"
                controls
                class="w-full"
              >
                <source :src="selectedFile.preview" />
                Your browser does not support the audio tag.
              </audio>

              <!-- Unsupported File Type -->
              <p v-else class="text-gray-500">Preview not available for this file type.</p>
            </div>
          </div>
        </div>
      </template>
    </Drawer>
  </div>
</template>
