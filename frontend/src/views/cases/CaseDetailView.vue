<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi'
import { useToast } from 'primevue/usetoast' // Import useToast only once
import { useConfirm } from 'primevue/useconfirm'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'

// PrimeVue components
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Menu from 'primevue/menu'
import Dialog from 'primevue/dialog'
import Skeleton from 'primevue/skeleton'
import Divider from 'primevue/divider'
import Timeline from 'primevue/timeline'

import { MdEditor } from 'md-editor-v3'

// Custom components
import FilePreviewDrawer, {
  type FileProperties,
} from '@/components/case-detail-view-form/FilePreviewDrawer.vue'
import FileDropzoneUpload from '@/components/file-handling/FileDropzoneUpload.vue'
import UserSelector, { type User } from '@/components/case-create-form/UserSelector.vue'
import CaseStatusSelect from '@/components/case-form-fields/CaseStatusSelect/CaseStatusSelect.vue'
import CasePrioritySelect from '@/components/case-form-fields/CaseStatusSelect/CasePrioritySelect.vue'
import ScrollFadeOverlay from '@/components/misc/ScrollFadeOverlay.vue'

// Types
import type { AxiosError } from 'axios'
import type { Case, Attachment } from '@/api'
import { CaseCaseTypeEnum } from '@/api'

// Functions
import { getFileIcon } from '@/functions/getFileIcon'
import { apiBlobToFile } from '@/functions/apiBlobToFile'

// Validation
import { caseSchema } from '@/validation/schemas'
import { useCaseFields } from '@/validation/fields'

import { userOptions } from '@/api/mockdata'

const router = useRouter()
const api = useApi()
const toast = useToast()
const confirm = useConfirm()

const caseId = ref(router.currentRoute.value.params.id)
const breadcrumb = ref(`Cases / Case #${caseId.value}`)

const caseDetails = ref<Case | null>(null)

const caseTypes = ref(
  Object.entries(CaseCaseTypeEnum).map(([_key, value]) => ({
    label: value,
    value: value,
  })),
)

/// Fetch Case Details from the API
const loading = ref(true)
const error = ref<string | null>(null)
const fetchCase = async () => {
  loading.value = true
  error.value = null
  try {
    caseDetails.value = (await api.casesIdGet({ id: Number(caseId.value) })).data

    if (!caseDetails.value.draft) {
      resetForm({
        values: {
          ...caseDetails.value,
          // The API returns assignee instead of assignees
          assignees: caseDetails.value.assignee as [string, ...string[]],
        },
      })
      nextTick(() => {
        form.value.dirty = false
      })
    } else {
      setValues(caseDetails.value)
      inEditMode.value = true
    }
  } catch (err) {
    error.value = (err as AxiosError).message
  } finally {
    loading.value = false
  }
}

// Lifecycle Hooks
onMounted(fetchCase)

/// Editing Mode
const inEditMode = ref(false)
const moreMenu = ref()

const {
  handleSubmit,
  errors,
  meta: form,
  resetForm,
  setValues,
} = useForm({
  validationSchema: toTypedSchema(caseSchema),
})

const fields = useCaseFields()

// User role and permissions
const userRole = ref('admin')
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
  inEditMode.value = true
}

const saveLoading = ref(false)
const handleSave = handleSubmit(
  async (values) => {
    saveLoading.value = true
    try {
      if (caseDetails.value!.draft) {
        caseDetails.value = (
          await api.confirmCaseIdPut({
            id: Number(caseId.value),
            ...values,
            assignee: values.assignees,
          })
        ).data
      } else {
        caseDetails.value = (
          await api.casesIdPut({ id: Number(caseId.value), ...values, assignee: values.assignees })
        ).data
      }
      resetForm({ values: values })
      await nextTick(() => {
        form.value.dirty = false
      })
      inEditMode.value = false
      toast.add({
        severity: 'success',
        summary: 'Changes Saved',
        detail: 'Your changes have been successfully saved.',
        life: 3000,
      })
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'An error occurred while saving the case\n' + (error as AxiosError).message,
        life: 3000,
      })
      console.error(error)
    } finally {
      saveLoading.value = false
    }
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
  if (form.value.dirty) {
    confirm.require({
      message: !caseDetails.value!.draft
        ? 'You have unsaved changes. Are you sure you want to cancel?'
        : "The case hasn't been saved and will be deleted. Are you sure you want to discard?",
      header: 'Confirm Cancel',
      icon: 'pi pi-exclamation-triangle',
      rejectProps: {
        severity: 'secondary',
        outlined: true,
      },
      accept: async () => {
        if (caseDetails.value!.draft) {
          if (await deleteDraft()) {
            await router.push({ name: 'cases' })
          }
        } else {
          resetForm()
          inEditMode.value = false
          toast.add({
            severity: 'info',
            summary: 'Edit Cancelled',
            detail: 'Your changes have been discarded.',
            life: 3000,
            closable: true,
          })
        }
      },
    })
  } else {
    inEditMode.value = false
  }
}

const deleteDraft = async () => {
  try {
    await api.casesIdDelete({ id: Number(caseId.value) })

    toast.add({
      severity: 'info',
      summary: 'Draft Deleted',
      detail: 'The draft has been deleted.',
      life: 3000,
      closable: true,
    })

    return true
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'An error occurred while deleting the draft\n' + (e as AxiosError).message,
      life: 3000,
    })

    return false
  }
}

const navigateTo = async (name: string) => {
  if (!form.value.dirty) {
    await router.push({ name: name })
  } else {
    confirm.require({
      message: 'You have unsaved changes. Are you sure you want to leave?',
      header: 'Confirm Navigation',
      icon: 'pi pi-exclamation-triangle',
      rejectProps: {
        severity: 'secondary',
        outlined: true,
      },
      accept: async () => {
        if (caseDetails.value!.draft) {
          if (!(await deleteDraft())) {
            return // Don't navigate if the draft couldn't be deleted
          }
        }
        await router.push({ name: name })
      },
    })
  }
}

const solutionMdEditor = useTemplateRef<typeof MdEditor | null>('solutionMdEditor')
const descriptionMdEditor = useTemplateRef<typeof MdEditor | null>('descriptionMdEditor')

watch(
  [solutionMdEditor, descriptionMdEditor],
  // Watch for the solution and description editors to be initialized
  ([solution, description]) => {
    if (solution && description) {
      // Watch for the inEditMode value to toggle the previewOnly mode
      watch(
        inEditMode,
        (value) => {
          if (value) {
            nextTick(() => {
              solutionMdEditor.value?.togglePreviewOnly(false)
              descriptionMdEditor.value?.togglePreviewOnly(false)
            })
          } else {
            nextTick(() => {
              solutionMdEditor.value?.togglePreviewOnly(true)
              descriptionMdEditor.value?.togglePreviewOnly(true)
            })
          }
        },
        { immediate: true },
      )
    }
  },
  { immediate: true },
)

/// File / Attachment Handling

const files = ref<File[]>([])
const filesToUpload = ref<File[]>([])
const fileUploadDialogVisible = ref(false)
const uploading = ref(false)

const uploadFiles = async () => {
  if (filesToUpload.value.length > 0) {
    uploading.value = true
    try {
      const result = await api.casesIdAttachmentsPost({
        id: Number(caseId.value),
        files: filesToUpload.value,
      })

      files.value.push(...filesToUpload.value)
      filesToUpload.value = []

      caseDetails.value!.attachments = result.data.attachments

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `File${filesToUpload.value.length > 1 ? 's' : ''} uploaded successfully`,
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

const deleteAttachment = async (attachment: Attachment) => {
  deletingFileId.value = attachment.id

  try {
    await api.casesIdAttachmentsAttachmentIdDelete({
      id: Number(caseId.value),
      attachmentId: attachment.id,
    })

    files.value = files.value.filter((f) => f.name !== attachment.filename)
    caseDetails.value!.attachments = caseDetails.value!.attachments.filter(
      (a) => a.id !== attachment.id,
    )

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'File deleted successfully',
      life: 2000,
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'An error occurred while deleting the file\n' + (error as AxiosError).message,
      life: 3000,
    })
    console.error(error)
  } finally {
    deletingFileId.value = null
  }
}

/// File Preview Drawer Logic

const selectedFile = ref<File | null>(null)
const previewDrawerVisible = ref(false)
const selectedFileProperties = ref<FileProperties | null>(null)
const loadingFileId = ref<number | null>(null)
const deletingFileId = ref<number | null>(null)

const openAttachmentInDrawer = async (attachment: Attachment) => {
  // Check if the attachment is already in the files array
  let file = files.value.find((f) => f.name === attachment.filename)
  if (!file) {
    loadingFileId.value = attachment.id
    // If not, download the file from the server
    try {
      file = await apiBlobToFile(
        await api.casesIdAttachmentsAttachmentIdDownloadGet(
          {
            id: Number(caseId.value),
            attachmentId: attachment.id,
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
      loadingFileId.value = null
    }
  }

  selectedFile.value = file!
  // TODO: Get file properties from the server
  selectedFileProperties.value = { name: file!.name, description: '', sharedWith: '' }
  previewDrawerVisible.value = true
}

/// Menu
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

/**
 * Toggle the more actions menu
 * @param event The click event
 */
const toggleMenu = (event: Event) => {
  moreMenu.value.toggle(event)
}

/**
 * Format the date to a human-readable format
 * @param date The date to format
 */
const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleString()
}

const changeHistoryEvents = computed(() => {
  return caseDetails.value
    ? caseDetails.value.changeHistory.map((entry) => ({
        status: 'Updated',
        date: formatDate(entry.updatedAt),
        icon: 'pi pi-calendar',
        color: '#3B82F6',
      }))
    : []
})
</script>

<template>
  <div class="max-w-7xl w-[80vw] mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Unsaved changes banner -->
    <div v-if="inEditMode && form.dirty" class="unsaved-banner">
      <div class="banner-content">
        <div class="flex items-center">
          <i class="pi pi-info-circle text-blue-500 mr-2"></i>
          <span class="text-blue-700">{{
            caseDetails?.draft ? 'You are editing an AI Draft' : 'You have unsaved changes'
          }}</span>
        </div>
      </div>
    </div>
    <!-- Header -->
    <div class="mb-8">
      <div class="flex justify-between items-center mb-2 gap-x-4">
        <div class="flex min-w-10 gap-3 items-center">
          <Button
            @click="navigateTo('cases')"
            class="flex-shrink-0"
            icon="pi pi-chevron-left"
            outlined
            rounded
            v-tooltip.top="{ value: 'Return to Case List', showDelay: 1000 }"
          />
          <h1 class="text-2xl font-bold text-gray-900 truncate">
            Case #{{ caseId
            }}<span class="font-semibold" v-if="caseDetails?.title">
              - {{ caseDetails?.title }}</span
            >
          </h1>
        </div>

        <div class="flex gap-2">
          <Button v-if="!inEditMode" label="Edit" icon="pi pi-pencil" @click="handleEdit" />
          <Button
            v-if="inEditMode"
            label="Save"
            icon="pi pi-check"
            @click="handleSave"
            :loading="saveLoading"
            :disabled="saveLoading"
          />
          <Button
            v-if="inEditMode"
            :label="caseDetails?.draft ? 'Discard' : 'Cancel'"
            icon="pi pi-times"
            severity="secondary"
            @click="handleCancel"
          />
          <Button
            icon="pi pi-ellipsis-v"
            @click="toggleMenu"
            aria-haspopup="true"
            aria-controls="more_actions_menu"
            :disabled="inEditMode"
          />
          <Menu ref="moreMenu" id="more_actions_menu" :model="menuItems" :popup="true" />
        </div>
      </div>
      <p class="text-sm text-gray-500">{{ breadcrumb }}</p>
    </div>

    <div v-if="!error">
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
                <label>Title</label>
                <InputText
                  v-if="!loading"
                  v-model="fields.title.value.value"
                  :disabled="!inEditMode"
                  :invalid="!!errors.title"
                  class="w-full"
                />
                <Skeleton v-else height="2.5rem" />
                <small v-if="errors.title" class="p-error block mt-1">{{ errors.title }}</small>
              </div>
              <div class="field">
                <label>Case Type</label>
                <Select
                  v-if="!loading"
                  v-model="fields.type.value.value"
                  :options="caseTypes"
                  option-label="label"
                  option-value="value"
                  :disabled="!inEditMode"
                  :invalid="!!errors.case_type"
                  class="w-full"
                />
                <Skeleton v-else height="2.5rem" />
                <small v-if="errors.case_type" class="p-error block mt-1">{{
                  errors.case_type
                }}</small>
              </div>
              <div class="field">
                <label>Reference</label>
                <InputText
                  v-if="!loading"
                  :model-value="String(caseDetails!.id)"
                  class="w-full"
                  disabled
                />
                <Skeleton v-else height="2.5rem" />
              </div>
              <div class="field">
                <label>Created by</label>
                <InputText v-if="!loading" model-value="Backend Missing" class="w-full" disabled />
                <Skeleton v-else height="2.5rem" />
              </div>
              <div class="field">
                <label>Created at</label>
                <DatePicker
                  v-if="!loading"
                  :model-value="new Date(caseDetails!.createdAt)"
                  disabled
                  showTime
                  hourFormat="24"
                  class="w-full"
                />
                <Skeleton v-else height="2.5rem" />
              </div>
              <div class="field">
                <label>Updated at</label>
                <DatePicker
                  v-if="!loading"
                  :model-value="new Date(caseDetails!.updatedAt)"
                  showTime
                  hourFormat="24"
                  class="w-full"
                  disabled
                />
                <Skeleton v-else height="2.5rem" />
              </div>
            </div>
          </template>
        </Card>

        <!-- Status & People Card -->
        <Card>
          <template #title>
            <h2 class="text-xl font-semibold mb-4">Status & People</h2>
          </template>
          <template #content>
            <div class="space-y-4">
              <div class="field">
                <label>Status</label>
                <CaseStatusSelect
                  v-model="fields.status.value.value"
                  v-if="!loading"
                  class="w-full min-h-10"
                  :disabled="!inEditMode"
                  :invalid="!!errors.status"
                />
                <Skeleton v-else height="2.5rem" />
                <small v-if="errors.status" class="p-error block mt-1">{{ errors.status }}</small>
              </div>

              <div class="field">
                <label>Priority</label>
                <CasePrioritySelect
                  v-model="fields.priority.value.value"
                  v-if="!loading"
                  class="w-full"
                  :disabled="!inEditMode"
                  :invalid="!!errors.priority"
                />
                <Skeleton v-else height="2.5rem" />
                <small v-if="errors.priority" class="p-error block mt-1">{{
                  errors.priority
                }}</small>
              </div>

              <Divider />

              <div class="field">
                <label>Assignees</label>
                <div v-if="!loading">
                  <UserSelector
                    :selected-users="
                      userOptions.filter((u) => fields.assignees.value.value?.includes(u.name))
                    "
                    @update:selected-users="
                      fields.assignees.value.value = $event.map((u) => u.name)
                    "
                    assigneeLabel="Assignees"
                    :placeholder="inEditMode ? 'Select Assignees' : ''"
                    :userOptions="userOptions as User[]"
                    multi-select
                    :disabled="!inEditMode"
                    :invalid="!!errors.assignees"
                  />
                  <small v-if="errors.assignees" class="p-error block mt-1">
                    {{ errors.assignees }}
                  </small>
                </div>
                <Skeleton v-else height="2.5rem" />
              </div>

              <div class="field">
                <label>Participants</label>
                <div v-if="!loading">
                  <UserSelector
                    :selected-users="
                      userOptions.filter((u) => fields.participants.value.value?.includes(u.name))
                    "
                    @update:selected-users="
                      fields.participants.value.value = $event.map((u) => u.name)
                    "
                    assigneeLabel="Participants"
                    :placeholder="inEditMode ? 'Select Participants' : ''"
                    :userOptions="userOptions"
                    multi-select
                    :disabled="!inEditMode"
                    :invalid="!!errors.participants"
                  />
                  <small v-if="errors.participants" class="p-error block mt-1">
                    {{ errors.participants }}
                  </small>
                </div>
                <Skeleton v-else height="2.5rem" />
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
          <MdEditor
            v-if="!loading"
            v-model="fields.description.value.value"
            class="min-h-64 resize-y"
            style="height: 16rem"
            language="en-US"
            id="description"
            :disabled="!inEditMode"
            :invalid="!!errors.description"
            noUploadImg
            ref="descriptionMdEditor"
          />
          <Skeleton v-else height="2.5rem" />
          <small v-if="errors.description" class="p-error block mt-1">{{
            errors.description
          }}</small>
        </template>
      </Card>

      <!-- Solution Card -->
      <Card class="mt-6">
        <template #title>
          <h2 class="text-xl font-semibold mb-4">Solution</h2>
        </template>
        <template #content>
          <MdEditor
            v-if="!loading"
            v-model="fields.solution.value.value"
            class="min-h-64 resize-y"
            style="height: 16rem"
            language="en-US"
            id="solution"
            :disabled="!inEditMode"
            :invalid="!!errors.solution"
            noUploadImg
            ref="solutionMdEditor"
          />
          <Skeleton v-else height="2.5rem" />
          <small v-if="errors.solution" class="p-error block mt-1">{{ errors.solution }}</small>
        </template>
      </Card>

      <!-- Attachments Card -->
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
                <div class="flex flex-col items-center">
                  <i
                    :class="`text-4xl text-gray-600 mb-5 pi
                      ${
                        file.id == loadingFileId
                          ? 'pi-spin pi-spinner'
                          : file.id == deletingFileId
                            ? 'pi-trash pulse'
                            : getFileIcon(file.mimetype)
                      }`"
                  ></i>
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

      <!-- Change History Card -->
      <Card class="mt-6">
        <template #title>
          <h2 class="text-xl font-semibold mb-4">Change History</h2>
        </template>
        <template #content>
          <ScrollFadeOverlay axis="vertical" content-class="max-h-[190px]">
            <Timeline :value="changeHistoryEvents" align="left">
              <template #marker="slotProps">
                <span
                  class="flex w-10 h-10 items-center justify-center text-white rounded-full z-10 shadow-sm bg-gray-800"
                >
                  <i class="pi pi-file-edit -mr-0.5"></i>
                </span>
              </template>
              <template #content="slotProps">
                <div class="flex items-center justify-between pt-2">
                  <p class="font-semibold text-gray-800">
                    Case Updated -
                    <span class="text-sm text-gray-600">{{ slotProps.item.date }}</span>
                  </p>
                </div>
              </template>
            </Timeline>
          </ScrollFadeOverlay>
        </template>
      </Card>
    </div>
    <div
      v-else
      aria-errormessage="An error occurred while fetching the case details"
      class="flex items-center justify-center gap-x-3 bg-red-100 text-red-600 p-4 rounded-lg"
    >
      <i class="pi pi-exclamation-triangle text-3xl" />
      <span class="text-center font-semibold">
        An error occurred while fetching the case details<br />
        <span class="font-bold">Error</span>: {{ error }}
      </span>
    </div>

    <!-- File Upload Popover -->
    <Dialog v-model:visible="fileUploadDialogVisible" modal class="lg:min-w-[50rem]">
      <template #header>
        <h2 class="text-xl font-semibold mb-4">Upload Additional Files</h2>
      </template>
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

<style scoped>
.field > label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

:deep(.p-component:disabled):not(.p-button),
:deep(.p-disabled) {
  @apply bg-slate-50 text-slate-600 opacity-100;
}

:deep(.p-disabled) [data-pc-section='dropdown'] {
  @apply hidden;
}

.unsaved-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #e6f7ff;
  border-bottom: 1px solid #b3d8ff;
  z-index: 1000;
  padding: 8px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
}

.banner-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 80rem;
  height: 3rem;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Add margin-top to main content container */
.max-w-7xl {
  margin-top: 60px;
}

:deep(.p-timeline-event-opposite) {
  @apply flex-initial;
}
</style>
