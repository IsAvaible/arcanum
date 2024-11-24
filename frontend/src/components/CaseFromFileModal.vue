<script setup lang="ts">
import { effect, nextTick, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import {
  Dialog,
  FileUpload,
  Button,
  Popover,
  Divider,
  useToast,
  usePrimeVue,
  type FileUploadState,
} from 'primevue'
import type { FileUploadSelectEvent, FileUploadUploadEvent } from 'primevue/fileupload'

// References and State
const router = useRouter()
const showDialog = ref(true)
const popover = useTemplateRef('popover')
const maxFileSize = 10 * 1024 * 1024 // 10 MB
// All image types, audio types, pdf and text files
const accept = 'image/*, audio/*, application/pdf, text/*'

const $primevue = usePrimeVue()
const toast = useToast()
type FileUploadType = InstanceType<typeof FileUpload>
const fileUpload = useTemplateRef<FileUploadType & FileUploadState & { choose: () => void }>(
  'file-upload',
)

const totalSize = ref(0)
const totalSizePercent = ref(0)
const files = ref<File[]>([])

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
const openManualCaseCreation = () => {
  showDialog.value = false
  router.push({ name: 'ManualCaseCreation' })
}

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

const formatSize = (bytes: number) => {
  const k = 1024
  const dm = 2
  const sizes = $primevue.config.locale!.fileSizeTypes ?? ['Bytes', 'KB', 'MB', 'GB', 'TB']

  if (bytes === 0) {
    return `0${sizes[0]}`
  }

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const formattedSize = parseFloat((bytes / Math.pow(k, i)).toFixed(dm))

  return `${formattedSize}${sizes[i]}`
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

const getFileIcon = (type: string): string => {
  if (type.startsWith('image')) {
    return 'pi-image'
  } else if (type.startsWith('audio')) {
    return 'pi-headphones'
  } else if (type.startsWith('application/pdf')) {
    return 'pi-file-pdf'
  } else if (type.startsWith('video')) {
    return 'pi-video'
  } else {
    return 'pi-file'
  }
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
</script>

<template>
  <div>
    <!-- Create New Case Button -->
    <Button label="Create New Case" class="p-button-primary" @click="showDialog = true" />

    <!-- File Upload Dialog -->
    <Dialog
      v-model:visible="showDialog"
      header="Create New Case"
      class="max-w-5xl w-[calc(100%-3rem)] max-h-[calc(100%-3rem)]"
      modal
    >
      <div class="p-4 space-y-6">
        <!-- Options Section -->
        <div class="flex flex-col space-y-4">
          <FileUpload
            name="demo[]"
            url="/api/upload"
            @upload="onTemplatedUpload($event)"
            :multiple="true"
            :accept="accept"
            :maxFileSize="maxFileSize"
            @select="onSelectedFiles"
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
                </div>
              </div>
            </template>
          </FileUpload>
          <Button
            label="Generate Case From Files"
            icon="pi pi-sparkles"
            class="w-full bg-gradient-to-tr from-green-500 via-blue-600 to-purple-700 border-none opacity-85 hover:opacity-100 transition-opacity"
            @click="openManualCaseCreation"
          />
          <Divider>
            <b>or</b>
          </Divider>
          <Button
            label="Create Case Manually"
            icon="pi pi-pen-to-square"
            severity="secondary"
            class="w-full"
            @click="openManualCaseCreation"
          />
        </div>
      </div>

      <Popover ref="popover">
        <div class="flex flex-col gap-y-3 p-2" v-if="popoverPreviewFile && !displayRequirements">
          <h4 class="font-semibold">Preview</h4>
          <div class="flex flex-col items-center gap-y-2 p-4">
            <img
              v-if="popoverPreviewFile && popoverPreviewFile.type.startsWith('image')"
              :src="popoverPreviewFile?.objectURL"
              alt="Preview"
              class="max-w-64 object-cover rounded-lg"
            />
          </div>
        </div>
        <div v-if="displayRequirements">
          <h4 class="font-semibold">Requirements</h4>
          <ul class="list-disc list-inside">
            <li>File size must be less than 10 MB</li>
            <li>File type must be an image or PDF</li>
          </ul>
        </div>
      </Popover>
    </Dialog>
  </div>
</template>

<style scoped></style>
