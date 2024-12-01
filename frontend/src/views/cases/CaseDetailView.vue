<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Textarea from 'primevue/textarea'
import FileUpload from 'primevue/fileupload'
import Menu from 'primevue/menu'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import UserSelector, { type User } from '@/components/case-create-form/UserSelector.vue'
import Divider from 'primevue/divider'

// Define interfaces for type safety
interface CaseDetails {
  name: string
  type: string
  createdBy: string
  createdOn: Date
  updatedOn: Date
  reference: string
  description: string
  solution: string
  assignees: User[]
  participants: User[]
}

interface Priority {
  name: string
  code: string
  color: string
}

interface Status {
  name: string
  code: string
  color: string
  textColor: string
}

const toast = useToast()
const router = useRouter()

const caseNumber = ref('12345')
const breadcrumb = ref('Cases / Servicecase / Overview')

// Initialize with proper typing
const caseDetails = reactive<CaseDetails>({
  name: 'Sample Case',
  type: 'Servicecase',
  createdBy: 'Jason Nicholas Arifin',
  createdOn: new Date('2024-10-25T10:28:00'),
  updatedOn: new Date('2024-10-25T10:28:00'),
  reference: '1234',
  description: 'Initial case description',
  solution: 'Here is the Solution',
  assignees: [],
  participants: [],
})

const originalCaseDetails = ref<CaseDetails>({ ...caseDetails })

const priorities: Priority[] = [
  { name: 'P0', code: 'p0', color: '#ef4444' },
  { name: 'P1', code: 'p1', color: '#f97316' },
  { name: 'P2', code: 'p2', color: '#eab308' },
  { name: 'P3', code: 'p3', color: '#22c55e' },
]

const statuses: Status[] = [
  { name: 'Offen', code: 'open', color: '#e6f4ff', textColor: '#0284c7' },
  { name: 'In Bearbeitung', code: 'in-progress', color: '#fff7ed', textColor: '#ea580c' },
  { name: 'Abgeschlossen', code: 'completed', color: '#f0fdf4', textColor: '#16a34a' },
]

// users array to match User type
const users: User[] = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  image: `/placeholder.svg?height=${50 + i}&width=${50 + i}`,
}))

const selectedPriority = ref<Priority>(priorities[1])
const selectedStatus = ref<Status>(statuses[0])
const selectedAssignees = ref<User[]>([users[0]])
const selectedParticipants = ref<User[]>([])

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

const originalPriority = ref(selectedPriority.value)
const originalStatus = ref(selectedStatus.value)
const originalAssignees = ref([...selectedAssignees.value])
const originalParticipants = ref([...selectedParticipants.value])

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

// Code for edit, save, cancel functionality
const isEditMode = ref(false)
const moreMenu = ref()
const showUnsavedChanges = ref(false)

// schema
const schema = toTypedSchema(
  z.object({
    name: z.string().min(1, 'Case name is required'),
    type: z.string().min(1, 'Case type is required'),
    reference: z.string().min(1, 'Reference is required'),
    description: z.string().min(1, 'Description is required'),
    solution: z.string().min(1, 'Solution is required'),
    assignees: z.array(z.any()).min(1, 'At least one assignee is required'),
    participants: z.array(z.any()).optional(),
  }),
)

const { handleSubmit, errors, resetForm, setFieldValue } = useForm({
  validationSchema: schema,
  initialValues: {
    ...caseDetails,
    assignees: selectedAssignees.value,
  },
})

const hasUnsavedChanges = computed(() => {
  return (
    JSON.stringify(caseDetails) !== JSON.stringify(originalCaseDetails.value) ||
    selectedPriority.value !== originalPriority.value ||
    selectedStatus.value !== originalStatus.value ||
    JSON.stringify(selectedAssignees.value) !== JSON.stringify(originalAssignees.value) ||
    JSON.stringify(selectedParticipants.value) !== JSON.stringify(originalParticipants.value)
  )
})

// User role and permissions
const userRole = ref('user')
const userPermissions = ref(['view'])

// Implement access control
const canEdit = computed(() => {
  return (
    userRole.value === 'admin' ||
    userRole.value === 'manager' ||
    userPermissions.value.includes('edit')
  )
})

const handleEdit = () => {
  if (!canEdit.value) {
    toast.add({
      severity: 'error',
      summary: 'Permission Denied',
      detail: 'You do not have permissions to edit this case.',
      life: 3000,
    })
    return
  }
  isEditMode.value = true
  showUnsavedChanges.value = false
}

const handleSave = handleSubmit(
  (values) => {
    // Simulate conflict detection
    const conflictDetected = Math.random() < 0.2 // 20% chance of conflict

    if (conflictDetected) {
      toast.add({
        severity: 'error',
        summary: 'Conflict Detected',
        detail: 'Another user has modified this case. Please refresh and try again.',
        life: 3000,
      })
      return
    }

    Object.assign(caseDetails, values)
    originalCaseDetails.value = { ...caseDetails }
    originalPriority.value = selectedPriority.value
    originalStatus.value = selectedStatus.value
    originalAssignees.value = [...selectedAssignees.value]
    originalParticipants.value = [...selectedParticipants.value]
    isEditMode.value = false
    showUnsavedChanges.value = false
    toast.add({
      severity: 'success',
      summary: 'Changes Saved',
      detail: 'Your changes have been successfully saved.',
      life: 3000,
    })
  },
  ({ errors }) => {
    // This callback is called when there are validation errors
    console.log('Validation errors:', errors)
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Please fix the errors before saving.',
      life: 3000,
    })
  },
)

const handleCancel = () => {
  if (hasUnsavedChanges.value) {
    if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
      resetForm()
      Object.assign(caseDetails, originalCaseDetails.value)
      selectedPriority.value = originalPriority.value
      selectedStatus.value = originalStatus.value
      selectedAssignees.value = [...originalAssignees.value]
      selectedParticipants.value = [...originalParticipants.value]
      isEditMode.value = false
      showUnsavedChanges.value = false
      toast.add({
        severity: 'info',
        summary: 'Edit Cancelled',
        detail: 'Your changes have been discarded.',
        life: 3000,
        closable: true,
      })
    }
  } else {
    isEditMode.value = false
  }
}

// Watch for changes and update unsaved changes banner
watch(
  [
    () => ({ ...caseDetails }),
    selectedPriority,
    selectedStatus,
    selectedAssignees,
    selectedParticipants,
  ],
  () => {
    if (isEditMode.value) {
      showUnsavedChanges.value = hasUnsavedChanges.value
    }
  },
  { deep: true },
)

watch(selectedAssignees, (newValue) => {
  setFieldValue('assignees', newValue)
})

const menuItems = [
  {
    label: 'Export as CSV',
    icon: 'pi pi-file-excel',
    command: () => {
      console.log('Exporting as CSV')
    },
  },
  {
    label: 'Share Case',
    icon: 'pi pi-share-alt',
    command: () => {
      console.log('Sharing case')
    },
  },
  {
    label: 'Print',
    icon: 'pi pi-print',
    command: () => {
      console.log('Printing case')
    },
  },
]

const toggleMenu = (event: Event) => {
  moreMenu.value.toggle(event)
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Unsaved changes banner -->
    <div
      v-if="showUnsavedChanges"
      class="fixed top-0 left-0 right-0 bg-blue-50 border-b border-blue-200 p-4 z-50"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div class="flex items-center">
          <i class="pi pi-info-circle text-blue-500 mr-2"></i>
          <span class="text-blue-700">You have unsaved changes</span>
        </div>
        <div class="flex gap-2">
          <Button label="Save" icon="pi pi-check" class="p-button-sm" @click="handleSave" />
          <Button
            label="Discard"
            icon="pi pi-times"
            class="p-button-sm p-button-secondary"
            @click="handleCancel"
          />
        </div>
      </div>
    </div>

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
          <!-- hinzufügen in Button :disabled="!canEdit" falls man Edit nicht sehen möchte -->
          <Button v-if="!isEditMode" label="Edit" icon="pi pi-pencil" @click="handleEdit" />
          <Button v-if="isEditMode" label="Save" icon="pi pi-check" @click="handleSave" />
          <Button
            v-if="isEditMode"
            label="Cancel"
            icon="pi pi-times"
            severity="secondary"
            @click="handleCancel"
          />
          <Button
            label="Generate PDF"
            icon="pi pi-file-pdf"
            class="p-button-success"
            :disabled="isEditMode"
          />
          <Button
            label="Plan Call"
            icon="pi pi-phone"
            class="p-button-success"
            :disabled="isEditMode"
          />
          <Button
            icon="pi pi-ellipsis-v"
            @click="toggleMenu"
            aria-haspopup="true"
            aria-controls="more_actions_menu"
            :disabled="isEditMode"
          />
          <Menu ref="moreMenu" id="more_actions_menu" :model="menuItems" :popup="true" />
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
              <label class="block text-sm font-medium text-gray-700 mb-1">Case Name (*)</label>
              <InputText
                id="name"
                v-model="caseDetails.name"
                class="w-full"
                :class="{ 'p-invalid': errors.name }"
                :disabled="!isEditMode"
                @update:modelValue="setFieldValue('name', $event)"
              />
              <small v-if="errors.name" class="p-error block mt-1">{{ errors.name }}</small>
            </div>
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Case Type (*)</label>
              <InputText
                id="type"
                v-model="caseDetails.type"
                class="w-full"
                :class="{ 'p-invalid': errors.type }"
                :disabled="!isEditMode"
                @update:modelValue="setFieldValue('type', $event)"
              />
              <small v-if="errors.type" class="p-error block mt-1">{{ errors.type }}</small>
            </div>
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Reference</label>
              <InputText
                v-model="caseDetails.reference"
                class="w-full"
                :class="{ 'p-invalid': errors.reference }"
                :disabled="!isEditMode"
                @update:modelValue="setFieldValue('reference', $event)"
              />
              <small v-if="errors.reference" class="p-error block mt-1">{{
                errors.reference
              }}</small>
            </div>
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Created by</label>
              <InputText v-model="caseDetails.createdBy" class="w-full" disabled />
            </div>
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Created on</label>
              <Calendar
                v-model="caseDetails.createdOn"
                showTime
                hourFormat="24"
                class="w-full"
                disabled
              />
            </div>
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Updated on</label>
              <Calendar
                v-model="caseDetails.updatedOn"
                showTime
                hourFormat="24"
                class="w-full"
                disabled
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
            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <Dropdown
                v-model="selectedPriority"
                :options="priorities"
                optionLabel="name"
                class="w-full"
                :disabled="!isEditMode"
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
                :disabled="!isEditMode"
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
              <label class="block text-sm font-medium text-gray-700 mb-1">Assignees (*)</label>
              <div class="w-full">
                <UserSelector
                  assigneeLabel="Assignees"
                  :userOptions="users"
                  v-model:selectedUsers="selectedAssignees"
                  multi-select
                  :disabled="!isEditMode"
                  :invalid="!!errors.assignees"
                />
                <small v-if="errors.assignees" class="p-error block mt-1">
                  {{ errors.assignees }}
                </small>
              </div>
            </div>

            <Divider />

            <div class="field">
              <label class="block text-sm font-medium text-gray-700 mb-1">Participants</label>
              <div class="w-full">
                <UserSelector
                  assigneeLabel="Participants"
                  :userOptions="users"
                  v-model:selectedUsers="selectedParticipants"
                  multi-select
                  :disabled="!isEditMode"
                  :class="{ 'p-invalid': errors.participants }"
                />
                <small v-if="errors.participants" class="p-error block mt-1">
                  {{ errors.participants }}
                </small>
              </div>
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
        <Textarea
          v-model="caseDetails.description"
          rows="4"
          class="w-full"
          :class="{ 'p-invalid': errors.description }"
          :disabled="!isEditMode"
          @update:modelValue="setFieldValue('description', $event)"
        />
        <small v-if="errors.description" class="p-error block mt-1">{{ errors.description }}</small>
      </template>
    </Card>

    <!-- Solution Card -->
    <Card class="mb-6">
      <template #title>
        <h2 class="text-xl font-semibold mb-4">Solution</h2>
      </template>
      <template #content>
        <Textarea
          v-model="caseDetails.solution"
          rows="4"
          class="w-full"
          :class="{ 'p-invalid': errors.solution }"
          :disabled="!isEditMode"
          @update:modelValue="setFieldValue('solution', $event)"
        />
        <small v-if="errors.solution" class="p-error block mt-1">{{ errors.solution }}</small>
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
                :disabled="!isEditMode"
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
                :disabled="!isEditMode"
              />
            </div>
            <div v-else class="flex justify-center">
              <FileUpload
                mode="basic"
                :auto="true"
                @upload="onUpload"
                v-bind="getUploadProps(selectedDataType)"
                :disabled="!isEditMode"
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

:deep(.p-multiselect.p-invalid) {
  border-color: #ef4444 !important;
}

:deep(.p-dropdown-item) {
  padding: 0.5rem !important;
}

:deep(.p-dropdown-label) {
  padding: 0.5rem !important;
}

:deep(.p-disabled) {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Add transition for unsaved changes banner */
.fixed {
  transition: all 0.3s ease-in-out;
}

.p-error {
  color: #ef4444;
}

.p-invalid {
  border-color: #ef4444 !important;
}
</style>
