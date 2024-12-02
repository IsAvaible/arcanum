<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Textarea from 'primevue/textarea'
import Dialog from 'primevue/dialog'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi'
import type { AxiosError } from 'axios'
import { type CaseAllOfAttachments, CaseCaseTypeEnum } from '@/api'
import type { Case } from '@/api'
import Skeleton from 'primevue/skeleton'
import FilePreviewDrawer, {
  type FileProperties,
} from '@/components/case-detail-view-form/FilePreviewDrawer.vue'
import FileDropzoneUpload from '@/components/file-handling/FileDropzoneUpload.vue'
import { getFileIcon } from '@/functions/getFileIcon'
import { useToast } from 'primevue'
import { apiBlobToFile } from '@/functions/apiBlobToFile'

const router = useRouter()
const api = useApi()
const toast = useToast()

const caseId = ref(router.currentRoute.value.params.id)
const breadcrumb = ref('Cases / Servicecase / Overview')

const caseDetails = ref<Case | null>(null)

const loading = ref(true)
const error = ref<string | null>(null)
const fetchCase = async () => {
  loading.value = true
  error.value = null
  try {
    caseDetails.value = (await api.casesIdGet({ id: Number(caseId.value) })).data
  } catch (err) {
    error.value = (err as AxiosError).message
    console.error(err)
  } finally {
    loading.value = false
  }
}

const _caseTypes = ref(
  Object.entries(CaseCaseTypeEnum).map(([_key, value]) => ({
    label: value,
    value: value,
  })),
)

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

const selectedAssignee = ref(null)

const files = ref<File[]>([])
const filesToUpload = ref<File[]>([])
const fileUploadDialogVisible = ref(false)
const uploading = ref(false)

const uploadFiles = async () => {
  if (filesToUpload.value.length > 0) {
    uploading.value = true
    try {
      const response = await api.casesIdAttachmentsPost({
        id: Number(caseId.value),
        files: filesToUpload.value,
      })
      console.log(response)

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
        detail: 'An error occurred while uploading the files\n' + (error as AxiosError).message,
        life: 3000,
      })

      console.error(error)
    } finally {
      uploading.value = false
    }
  }
}

const deleteAttachment = async (attachment: CaseAllOfAttachments) => {
  try {
    await api.casesIdAttachmentsFilenameDelete({
      id: Number(caseId.value),
      filename: attachment.filename,
    })

    files.value = files.value.filter((f) => f.name !== attachment.filename)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'An error occurred while deleting the file\n' + (error as AxiosError).message,
      life: 3000,
    })
    console.error(error)
  }
}

// Drawer variables
const selectedFile = ref<File | null>(null)
const previewDrawerVisible = ref(false)
const selectedFileProperties = ref<FileProperties | null>(null)
const loadingFile = ref<string | null>(null)

const openAttachmentInDrawer = async (attachment: CaseAllOfAttachments) => {
  // Check if the attachment is already in the files array
  let file = files.value.find((f) => f.name === attachment.filename)
  if (!file) {
    loadingFile.value = attachment.filename
    // If not, download the file from the server
    try {
      file = await apiBlobToFile(
        await api.casesIdAttachmentsFilenameGet(
          {
            id: Number(caseId.value),
            filename: attachment.filename,
          },
          { responseType: 'blob' },
        ),
      )

      files.value.push(file)
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'An error occurred while downloading the file\n' + (error as AxiosError).message,
        life: 3000,
      })
      console.error(error)
      return
    } finally {
      loadingFile.value = null
    }
  }

  selectedFile.value = file!
  // TODO: Get file properties from the server
  selectedFileProperties.value = { name: file!.name, description: '', sharedWith: '' }
  previewDrawerVisible.value = true
}

// Lifecycle Hooks
onMounted(fetchCase)
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
          <h1 class="text-2xl font-bold text-gray-900">Case #{{ caseId }}</h1>
        </div>

        <div class="flex gap-2">
          <Button label="Generate PDF" icon="pi pi-file-pdf" />
          <Button label="Plan Call" icon="pi pi-phone" />
        </div>
      </div>
      <p class="text-sm text-gray-500">{{ breadcrumb }}</p>
    </div>

    <!-- Main Content -->
    <div v-if="!error" class="grid grid-cols-1 lg:grid-cols-2 lg:min-w-[57rem] gap-6 mb-6">
      <!-- Details Card -->
      <Card>
        <template #title>
          <h2 class="text-xl font-semibold mb-4">Details</h2>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Case Type</label>
              <InputText v-if="!loading" v-model="caseDetails!.case_type" class="w-full" />
              <Skeleton v-else height="2.5rem" />
            </div>
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <InputText v-if="!loading" v-model="caseDetails!.title" class="w-full" />
              <Skeleton v-else height="2.5rem" />
            </div>
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Created by</label>
              <InputText v-if="!loading" class="w-full" value="Unknown (Backend Missing)" />
              <Skeleton v-else height="2.5rem" />
            </div>
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Created at</label>
              <DatePicker
                v-if="!loading"
                :model-value="new Date(caseDetails!.createdAt)"
                @update:model-value="caseDetails!.createdAt = ($event! as Date).toISOString()"
                showTime
                hourFormat="24"
                class="w-full"
              />
              <Skeleton v-else height="2.5rem" />
            </div>
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Updated at</label>
              <DatePicker
                v-if="!loading"
                :model-value="new Date(caseDetails!.updatedAt)"
                @update:model-value="caseDetails!.updatedAt = ($event! as Date).toISOString()"
                showTime
                hourFormat="24"
                class="w-full"
              />
              <Skeleton v-else height="2.5rem" />
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
              <Select
                v-if="!loading"
                placeholder="Unknown (Backend Missing)"
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
              </Select>
              <Skeleton v-else height="2.5rem" />
            </div>

            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Select
                v-if="!loading"
                placeholder="Unknown (Backend Missing)"
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
              </Select>
              <Skeleton v-else height="2.5rem" />
            </div>

            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
              <div v-if="!loading">
                <Select
                  :options="users"
                  optionLabel="name"
                  placeholder="Unknown (Backend Incomplete)"
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
                </Select>
                <p class="mt-2 text-sm text-gray-500" v-if="!selectedAssignee">
                  No assignee selected
                </p>
              </div>
              <Skeleton v-else height="2.5rem" />
            </div>
          </div>
        </template>
      </Card>
    </div>
    <Message v-else severity="error" text="An error occurred while fetching the case details" />

    <!-- Description Card -->
    <Card class="mt-6">
      <template #title>
        <h2 class="text-xl font-semibold mb-4">Description</h2>
      </template>
      <template #content>
        <Textarea v-if="!loading" v-model="caseDetails!.description" rows="4" class="w-full" />
        <Skeleton v-else height="2.5rem" />
      </template>
    </Card>

    <!-- Solution Card -->
    <Card class="mt-6">
      <template #title>
        <h2 class="text-xl font-semibold mb-4">Solution</h2>
      </template>
      <template #content>
        <Textarea v-if="!loading" v-model="caseDetails!.solution" rows="4" class="w-full" />
        <Skeleton v-else height="2.5rem" />
      </template>
    </Card>

    <!-- Data Card -->
    <Card class="mt-6">
      <template #title>
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold mb-4">Attachments</h2>
          <Button
            v-if="caseDetails?.attachments.length ?? 0 > 0"
            icon="pi pi-cloud-upload"
            rounded
            severity="secondary"
            @click="fileUploadDialogVisible = true"
            v-tooltip.top="{ value: 'Upload Additional Files', showDelay: 1000 }"
          />
        </div>
      </template>
      <template #content>
        <div v-if="caseDetails?.attachments.length ?? 0 > 0" class="grid grid-cols-5 gap-4">
          <Card
            v-for="file in caseDetails!.attachments"
            :key="file.id"
            @click="openAttachmentInDrawer(file)"
            class="cursor-pointer relative"
          >
            <template #content>
              <div
                class="flex flex-col items-center"
                :class="{ 'animate-pulse': file.filename == loadingFile }"
              >
                <i :class="`text-4xl text-gray-600 mb-5 pi ${getFileIcon(file.mimetype)}`"></i>
                <p class="text-gray-600 text-center break-all">{{ file.filename }}</p>
              </div>
              <div class="absolute top-0 left-0 w-full flex justify-end">
                <Button
                  icon="pi pi-times"
                  size="small"
                  severity="secondary"
                  rounded
                  variant="text"
                  @click.stop="deleteAttachment(file)"
                />
              </div>
            </template>
          </Card>
        </div>
        <FileDropzoneUpload v-else-if="!loading" v-model:files="filesToUpload">
          <template #file-list-footer>
            <Button
              icon="pi pi-cloud-upload"
              label="Upload Files"
              @click="uploadFiles"
              :loading="uploading"
            />
          </template>
        </FileDropzoneUpload>
        <Skeleton v-else height="10rem" />
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
