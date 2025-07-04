<script setup lang="ts">
import FileUpload, {
  type FileUploadProps,
  type FileUploadSelectEvent,
  type FileUploadUploadEvent,
  type FileUploadState,
} from 'primevue/fileupload'
import { Button, Popover, useToast } from 'primevue'

import { effect, nextTick, ref, useTemplateRef } from 'vue'
import FilePreview from '@/components/file-handling/FilePreview.vue'
import { useVModel } from '@vueuse/core'
import { getFileIcon } from '@/functions/getFileIcon'
import { formatSize } from '@/functions/formatSize'

const props = withDefaults(defineProps<FileUploadProps & { files?: File[] }>(), {
  files: () => [] as File[],
})
const emit = defineEmits(['update:files'])

const files = useVModel(props, 'files', emit)

// References and State
const popover = useTemplateRef('popover')
const maxFileSize = 1024 * 1024 * 1024 // 1GB
// All image types, audio types, pdf and text files
const accept = 'image/*, audio/*, application/pdf, text/*, video/*'
const toast = useToast()
type FileUploadType = InstanceType<typeof FileUpload>
const fileUpload = useTemplateRef<FileUploadType & FileUploadState & { choose: () => void }>(
  'file-upload',
)
const fileUploadWrapper = useTemplateRef('fileUploadWrapper')
const totalSize = ref(0)
const totalSizePercent = ref(0)

effect(() => {
  fileUpload.value?.messages?.forEach((message: string) => {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 5000,
    })
  })
})
// Methods
const onRemoveTemplatingFile = (
  file: File,
  removeFileCallback: (index: number) => void,
  index: number,
) => {
  removeFileCallback(index)
  totalSize.value -= parseInt(formatSize(file.size))
  totalSizePercent.value = totalSize.value / 10
}
const _onClearTemplatingUpload = (clear: () => void) => {
  clear()
  totalSize.value = 0
  totalSizePercent.value = 0
}
const onSelectedFiles = (event: FileUploadSelectEvent) => {
  files.value = event.files
  files.value.forEach((file) => {
    totalSize.value += parseInt(formatSize(file.size))
  })
}
const onTemplatedUpload = (_event: FileUploadUploadEvent) => {
  toast.add({ severity: 'info', summary: 'Success', detail: 'File Uploaded', life: 3000 })
}

const popoverPreviewFile = ref<(File & { objectURL: string }) | null>()
const previewFile = (event: MouseEvent, file: File) => {
  const _file = file as File & { objectURL: string }
  popover.value!.hide()
  displayRequirements.value = false
  if (popoverPreviewFile.value !== _file) {
    popoverPreviewFile.value = _file
    nextTick(() => {
      popover.value!.show(event)
    })
  } else {
    popoverPreviewFile.value = null
  }
}

const closePopover = () => {
  popover.value!.hide()
  popoverPreviewFile.value = null
}

const displayRequirements = ref(false)
const toggleRequirements = (event: MouseEvent) => {
  popover.value!.hide()
  displayRequirements.value = !displayRequirements.value
  if (displayRequirements.value) {
    nextTick(() => {
      popover.value!.show(event)
    })
  }
}

/**
 * Programmatically add a file to the FileUpload component
 * @param file The file to add
 */
const addFileProgrammatically = (file: File) => {
  // Create a DataTransfer instance
  const dataTransfer = new DataTransfer()

  // Append the file to the DataTransfer object
  dataTransfer.items.add(file)

  // Access the file input of the FileUpload component
  const inputElement = fileUploadWrapper.value!.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement
  if (inputElement) {
    // Set the files property of the input element
    inputElement.files = dataTransfer.files

    // Trigger a change event to update the component
    const event = new Event('change', { bubbles: true })
    inputElement.dispatchEvent(event)
  }
}

defineExpose({
  addFile: addFileProgrammatically,
})
</script>

<template>
  <div ref="fileUploadWrapper">
    <FileUpload
      v-bind="$attrs"
      @upload="onTemplatedUpload($event)"
      @select="onSelectedFiles"
      :multiple="true"
      :accept="accept"
      :maxFileSize="maxFileSize"
      ref="file-upload"
    >
      <template #header="{ chooseCallback, uploadCallback, clearCallback, files }">
        <span></span>
      </template>
      <template #content="{ files, removeFileCallback }">
        <div class="flex flex-col gap-8 pt-4">
          <div class="flex items-center justify-center flex-col">
            <div class="border-2 rounded-full size-24 flex items-center justify-center">
              <i class="pi pi-cloud-upload text-4xl text-muted-color" />
            </div>
            <h4 class="mt-4 font-semibold text-lg">Drag & Drop</h4>
            <p>
              or
              <span class="underline cursor-pointer" @click="fileUpload!.choose()"
                >choose files</span
              >
            </p>
            <div
              class="grid grid-cols-[1fr_auto_1fr] gap-x-2 items-center mt-6 text-surface-600 text-sm"
            >
              <p class="text-right">max file size is {{ formatSize(maxFileSize) }}</p>
              <span class="rounded-full size-0.75 bg-surface-600"></span>
              <button @click="toggleRequirements">see more requirements</button>
            </div>
          </div>
          <div v-if="files.length > 0" class="flex flex-col gap-y-4">
            <div
              v-for="(file, index) of files"
              :key="index"
              class="flex items-center gap-4 p-2 rounded-lg border border-surface-200"
            >
              <Button
                severity="secondary"
                :icon="`pi ${getFileIcon(file.type)}`"
                class="p-button-rounded p-button-text"
                aria-label="Preview File"
                @click="previewFile($event, file)"
              />
              <div class="flex-1">
                <p class="font-medium">{{ file.name }}</p>
                <p class="text-surface-400">{{ formatSize(file.size) }}</p>
              </div>
              <Button
                severity="secondary"
                icon="pi pi-trash"
                class="p-button-rounded p-button-text"
                aria-label="Remove File"
                @click="onRemoveTemplatingFile(file, removeFileCallback, index)"
              />
            </div>

            <slot name="file-list-footer"></slot>
          </div>
        </div>
      </template>
    </FileUpload>
  </div>

  <Popover ref="popover">
    <div class="flex flex-col gap-y-3 p-2" v-if="popoverPreviewFile && !displayRequirements">
      <div class="flex w-full items-center justify-between -mb-2 min-w-72">
        <h4 class="font-semibold text-lg">Preview</h4>
        <Button
          icon="pi pi-times"
          variant="text"
          severity="secondary"
          class="p-button-rounded"
          aria-label="Close Preview"
          @click="closePopover"
        />
      </div>
      <FilePreview class="h-96" :file="popoverPreviewFile" />
    </div>
    <div v-if="displayRequirements">
      <h4 class="font-semibold">Requirements</h4>
      <ul class="list-disc list-inside">
        <li>File size must be less than {{ formatSize(maxFileSize) }}</li>
        <li>File type must be an image, audio, video, PDF or text</li>
      </ul>
    </div>
  </Popover>
</template>

<style scoped></style>
