<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Textarea from 'primevue/textarea'
import FileUpload from 'primevue/fileupload'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi'
import type { AxiosError } from 'axios'
import { CaseCaseTypeEnum } from '@/api'
import type { Case } from '@/api'
import Skeleton from 'primevue/skeleton'

const router = useRouter()
const api = useApi()

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
    console.log(caseDetails.value)
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

const onUpload = (event: unknown) => {
  console.log('File uploaded:', event)
}

const dataTypes = [
  { label: 'Text', value: 'text' },
  { label: 'XML', value: 'xml' },
  { label: 'JSON', value: 'json' },
  { label: 'Image', value: 'image' },
  { label: 'Audio', value: 'audio' },
  { label: 'Video', value: 'video' },
]

const selectedDataType = ref('image')

const getUploadProps = (dataType: string) => {
  switch (dataType) {
    case 'image':
      return {
        accept: 'image/*',
        maxFileSize: 1000000,
        chooseLabel: 'Choose Image',
      }
    case 'audio':
      return {
        accept: 'audio/*',
        maxFileSize: 1000000,
        chooseLabel: 'Choose Audio',
      }
    case 'video':
      return {
        accept: 'video/*',
        maxFileSize: 10000000,
        chooseLabel: 'Choose Video',
      }
    default:
      return {}
  }
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
          <Button label="Generate PDF" icon="pi pi-file-pdf" class="p-button-success" />
          <Button label="Plan Call" icon="pi pi-phone" class="p-button-success" />
        </div>
      </div>
      <p class="text-sm text-gray-500">{{ breadcrumb }}</p>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-2 lg:min-w-[57rem] gap-6 mb-6">
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

    <!-- Description Card -->
    <Card class="mb-6">
      <template #title>
        <h2 class="text-xl font-semibold mb-4">Description</h2>
      </template>
      <template #content>
        <Textarea v-if="!loading" v-model="caseDetails!.description" rows="4" class="w-full" />
        <Skeleton v-else height="2.5rem" />
      </template>
    </Card>

    <!-- Solution Card -->
    <Card class="mb-6">
      <template #title>
        <h2 class="text-xl font-semibold mb-4">Solution</h2>
      </template>
      <template #content>
        <Textarea v-if="!loading" v-model="caseDetails!.solution" rows="4" class="w-full" />
        <Skeleton v-else height="2.5rem" />
      </template>
    </Card>

    <!-- Data Card -->
    <Card>
      <template #title>
        <h2 class="text-xl font-semibold mb-4">Data</h2>
      </template>
      <template #content>
        <div class="space-y-6">
          <div class="flex justify-between items-center">
            <div v-for="dataType in dataTypes" :key="dataType.value" class="text-center">
              <button
                @click="selectedDataType = dataType.value"
                class="px-4 py-2 rounded-md transition-colors duration-200 ease-in-out"
                :class="{
                  'bg-blue-100 text-blue-700': selectedDataType === dataType.value,
                  'hover:bg-gray-100': selectedDataType !== dataType.value,
                }"
              >
                {{ dataType.label }}
              </button>
            </div>
          </div>

          <div class="mt-4">
            <div v-if="['text', 'xml', 'json'].includes(selectedDataType)">
              <Textarea
                :placeholder="`Enter ${selectedDataType.toUpperCase()} data`"
                rows="4"
                class="w-full"
              />
            </div>
            <div v-else class="flex justify-center">
              <FileUpload
                mode="basic"
                :auto="true"
                @upload="onUpload"
                v-bind="getUploadProps(selectedDataType)"
              />
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
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
