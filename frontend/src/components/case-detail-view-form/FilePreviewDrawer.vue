<script setup lang="ts">
import { ref, computed, useTemplateRef } from 'vue'
import Drawer from 'primevue/drawer'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { useVModel } from '@vueuse/core'
import FilePreview from '@/components/file-handling/FilePreview.vue'
import { formatSize } from '@/functions/formatSize'

export type FileProperties = {
  name: string
  description: string
  sharedWith: string
}
const props = defineProps<{
  visible: boolean
  file: File | null
  fileProperties: FileProperties | null
  timestamp?: number
}>()

const emit = defineEmits(['update:visible', 'update:fileProperties'])

const previewComponent = useTemplateRef('filePreview')
const visible = useVModel(props, 'visible', emit)
const fileProperties = useVModel(props, 'fileProperties', emit)
const editing = ref(false)
const selectedFile = props.file

const editedFileProperties = ref<FileProperties | null>(null)

// Computed property to bind to editable or readonly mode
const editingFile = computed(() => {
  if (editing.value) {
    return editedFileProperties.value // Editing mode
  }
  return fileProperties.value || { name: '', description: '', sharedWith: '' }
})

const editFile = () => {
  if (fileProperties.value) {
    editedFileProperties.value = { ...fileProperties.value }
    editing.value = true
  }
}

const saveFileChanges = () => {
  if (fileProperties.value && editedFileProperties.value) {
    fileProperties.value.name = editedFileProperties.value.name
    fileProperties.value.description = editedFileProperties.value.description
    fileProperties.value.sharedWith = editedFileProperties.value.sharedWith
    editing.value = false
  }
}

const cancelEdit = () => {
  editing.value = false
  editedFileProperties.value = { name: '', description: '', sharedWith: '' }
}

const closeDrawer = () => {
  visible.value = false
}

const openFile = () => {
  if (selectedFile) {
    window.open(URL.createObjectURL(selectedFile), '_blank')
  }
}

const jumpToTimestamp = computed(() => {
  if (previewComponent.value) {
    return previewComponent.value!.jumpToTimestamp
  }
})
defineExpose({ jumpToTimestamp: jumpToTimestamp })
</script>

<template>
  <Drawer
    v-model:visible="visible"
    position="right"
    style="width: 40rem"
    class="bg-slate-100 text-gray-900"
    @hide="closeDrawer"
  >
    <!-- Drawer Header -->
    <template #header>
      <div class="flex-1 flex flex-col items-center">
        <i class="pi pi-file text-gray-500 text-2xl mb-3"></i>
        <span class="text-lg text-center word-break font-semibold text-gray-900">
          {{ selectedFile?.name || 'Undefined' }}
        </span>
        <span class="text-sm text-gray-500">
          {{ formatSize(selectedFile?.size ?? 0) }}
        </span>
      </div>
    </template>

    <!-- Drawer Content -->
    <template v-if="selectedFile">
      <div class="h-full flex flex-col gap-y-4 p-6">
        <div class="grid grid-cols-2 gap-4">
          <!-- File Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700">File Name</label>
            <p v-if="!editing" class="py-2.5 text-gray-800">
              {{ fileProperties?.name || 'Empty' }}
            </p>
            <InputText v-model="editingFile!.name" v-else class="w-full" />
          </div>

          <!-- Shared With -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Shared With</label>
            <p v-if="!editing" class="py-2.5 text-gray-800">
              {{ fileProperties?.sharedWith || 'None' }}
            </p>
            <InputText v-model="editingFile!.sharedWith" v-else class="w-full" />
          </div>

          <!-- File Description -->
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700">Description</label>
            <p v-if="!editing" class="py-2.5 text-gray-800">
              {{ fileProperties?.description || 'Empty' }}
            </p>
            <InputText v-model="editingFile!.description" v-else class="w-full" />
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="text-center">
          <Button
            v-if="!editing"
            label="Edit Metadata"
            icon="pi pi-pencil"
            variant="outlined"
            severity="secondary"
            @click="editFile"
          />
          <div v-if="editing" class="flex justify-around mt-4">
            <Button
              label="Cancel"
              icon="pi pi-times"
              class="p-button-secondary"
              @click="cancelEdit"
            />
            <Button
              label="Save"
              icon="pi pi-check"
              class="p-button-success"
              @click="saveFileChanges"
            />
          </div>
        </div>

        <div class="mt-6 border-t pt-4 flex-1 flex flex-col">
          <div class="flex justify-between items-center">
            <h3 class="text-md font-semibold">File Preview</h3>
            <Button
              v-if="selectedFile"
              icon="pi pi-external-link"
              variant="text"
              severity="secondary"
              rounded
              aria-label="Open File"
              v-tooltip="{ value: 'Open File', showDelay: 1000 }"
              @click="openFile"
            />
          </div>
          <FilePreview ref="filePreview" class="flex-1" :file="selectedFile" />
        </div>
      </div>
    </template>
  </Drawer>
</template>

<style scoped></style>
