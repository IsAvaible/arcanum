<script setup lang="ts">
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Textarea from 'primevue/textarea'
import Dialog from 'primevue/dialog'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import FilePreviewDrawer, {
  type FileProperties,
} from '@/components/case-detail-view-form/FilePreviewDrawer.vue'
import FileDropzoneUpload from '@/components/file-handling/FileDropzoneUpload.vue'
import { useToast } from 'primevue'
import { getFileIcon } from '@/functions/getFileIcon'

const caseNumber = ref('12345')
const breadcrumb = ref('Cases / Servicecase / Overview')

const router = useRouter()
const toast = useToast()

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
const files = ref<File[]>([])
const filesToUpload = ref<File[]>([])
const fileUploadDialogVisible = ref(false)
const uploading = ref(false)

const uploadFiles = async () => {
  if (filesToUpload.value.length > 0) {
    uploading.value = true
    try {
      // Simulate uploading files
      await new Promise((resolve) => setTimeout(resolve, 1000))

      files.value.push(...filesToUpload.value)
      filesToUpload.value = []

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Files uploaded successfully',
        life: 3000,
      })

      fileUploadDialogVisible.value = false
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'An error occurred while uploading the files',
        life: 3000,
      })

      console.error(error)
    } finally {
      uploading.value = false
    }
  }
}

// Drawer variables
const selectedFile = ref<File | null>(null)
const previewDrawerVisible = ref(false)
const selectedFileProperties = ref<FileProperties | null>(null)

const openFileInDrawer = (file: File) => {
  selectedFile.value = file
  // TODO: Get file properties from the server
  selectedFileProperties.value = { name: file.name, description: '', sharedWith: '' }
  previewDrawerVisible.value = true
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
          <Button label="Generate PDF" icon="pi pi-file-pdf" />
          <Button label="Plan Call" icon="pi pi-phone" />
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
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold mb-4">Attachments</h2>
          <Button
            v-if="files.length > 0"
            icon="pi pi-cloud-upload"
            rounded
            severity="secondary"
            @click="fileUploadDialogVisible = true"
            v-tooltip.top="{ value: 'Upload Additional Files', showDelay: 1000 }"
          />
        </div>
      </template>
      <template #content>
        <div v-if="files.length > 0" class="grid grid-cols-5 gap-4">
          <Card
            v-for="file in files"
            :key="file.name"
            @click="openFileInDrawer(file)"
            class="cursor-pointer"
          >
            <template #content>
              <div class="flex flex-col items-center">
                <i :class="`text-4xl text-gray-600 mb-5 pi ${getFileIcon(file.type)}`"></i>
                <p class="text-gray-600 text-center break-all">{{ file.name }}</p>
              </div>
            </template>
          </Card>
        </div>
        <FileDropzoneUpload v-else v-model:files="filesToUpload">
          <template #file-list-footer>
            <Button
              icon="pi pi-cloud-upload"
              label="Upload Files"
              @click="uploadFiles"
              :loading="uploading"
            />
          </template>
        </FileDropzoneUpload>
      </template>
    </Card>

    <!-- File Upload Popover -->
    <Dialog v-model:visible="fileUploadDialogVisible" modal class="lg:min-w-[50rem]">
      <h2 class="text-xl font-semibold mb-4">Upload Additional Files</h2>
      <FileDropzoneUpload v-model:files="filesToUpload">
        <template #file-list-footer>
          <Button
            icon="pi pi-cloud-upload"
            label="Upload Files"
            @click="uploadFiles"
            :loading="uploading"
          />
        </template>
      </FileDropzoneUpload>
    </Dialog>

    <!-- Drawer for File Preview -->
    <FilePreviewDrawer
      v-if="previewDrawerVisible"
      v-model:visible="previewDrawerVisible"
      :selected-file="selectedFile"
      :file-properties="selectedFileProperties"
    />
  </div>
</template>
