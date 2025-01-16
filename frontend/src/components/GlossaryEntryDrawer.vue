<script setup lang="ts">
import { getFileIcon } from '@/functions/getFileIcon'
import Button from 'primevue/button'
import FilePreview from '@/components/file-handling/FilePreview.vue'
import FileDropzoneUpload from '@/components/file-handling/FileDropzoneUpload.vue'
import Skeleton from 'primevue/skeleton'
import Drawer from 'primevue/drawer'
import Dialog from 'primevue/dialog'
import { useVModel } from '@vueuse/core'
import { onMounted, ref, watch } from 'vue'
import type { GlossaryEntry, GlossaryEntryDetail } from '@/api'
import type { AxiosError } from 'axios'
import { useAttachmentLoading } from '@/composables/useAttachmentLoading'
import { useApi } from '@/composables/useApi'
import { useToast } from 'primevue'
import { formatDate } from '@/functions/formatDate'

interface Props {
  entry?: GlossaryEntry | null
}
const props = defineProps<Props>()

interface Emits {
  (event: 'update:entry', value: GlossaryEntry): void
}
const emit = defineEmits<Emits>()

const api = useApi()
const toast = useToast()

const visible = ref(false)
const selectedEntry = useVModel(props, 'entry', emit)
const selectedEntryDetail = ref<GlossaryEntryDetail | null>()
const selectedEntryDetailLoading = ref(false)
const selectedEntryDetailError = ref<string | null>(null)

/**
 * Select a glossary entry and fetch its detailed information.
 * @param entry The glossary entry to select.
 */
const selectEntry = (entry: GlossaryEntry) => {
  filePreviewVisible.value = false
  selectedEntry.value = entry
  fetchEntryDetail(entry.id)
  visible.value = true
}

/**
 * Fetch the detailed information for a glossary entry.
 * @param id The ID of the glossary entry to fetch.
 */
const fetchEntryDetail = async (id: GlossaryEntry['id']) => {
  selectedEntryDetailLoading.value = true
  selectedEntryDetailError.value = null
  try {
    const response = await api.glossaryIdGet({ id })
    selectedEntryDetail.value = response.data
  } catch (e) {
    console.error(e)
    selectedEntryDetailError.value = (e as AxiosError).message
  } finally {
    selectedEntryDetailLoading.value = false
  }
}

const filesToUpload = ref<File[]>([])
const fileUploadDialogVisible = ref(false)
const uploading = ref(false)

/**
 * Upload the selected files to the case.
 */
const uploadFiles = async () => {
  if (filesToUpload.value.length > 0) {
    uploading.value = true
    try {
      const result = await api.glossaryIdUploadPost({
        id: selectedEntryDetail.value!.id,
        files: filesToUpload.value,
      })

      files.value.push(...filesToUpload.value)
      filesToUpload.value = []

      selectedEntryDetail.value!.relatedAttachments = result.data.relatedAttachments

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

/// File Preview Drawer Logic
const {
  files,
  selectedFile,
  filePreviewVisible,
  loadingFileId,
  openAttachmentPreview,
  triggerFileDownload,
} = useAttachmentLoading()

onMounted(() => {
  watch(
    () => selectedEntry.value,
    async (entry) => {
      if (entry) {
        selectEntry(entry)
      } else {
        visible.value = false
      }
    },
    { immediate: true },
  )
})
</script>

<template>
  <Drawer
    v-model:visible="visible"
    position="right"
    :style="{ width: 'min(100%,35rem)' }"
    class="p-sidebar-lg"
  >
    <template v-if="selectedEntry">
      <div class="px-2 h-full max-h-full overflow-auto relative">
        <!-- Term Header -->
        <div class="mb-8">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <i class="pi pi-book text-emerald-500 text-lg"></i>
            </div>
            <div>
              <h2 class="text-xl font-semibold text-gray-900">{{ selectedEntry.term }}</h2>
            </div>
          </div>

          <!-- Usage Statistics -->
          <div class="flex gap-4 mt-4">
            <div class="bg-gray-50 rounded-lg p-3 flex-1">
              <div class="text-sm text-gray-500">Usages</div>
              <div class="text-lg font-semibold text-gray-900">
                {{ selectedEntry.usageCount || 0 }}
              </div>
            </div>
            <div class="bg-gray-50 rounded-lg p-3 flex-1">
              <div class="text-sm text-gray-500">Last used</div>
              <div class="text-lg font-semibold text-gray-900">
                {{ formatDate(selectedEntry.updatedAt ?? selectedEntry.createdAt) || 'Never' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Term Content -->
        <div class="space-y-8">
          <!-- Loading State -->
          <div v-if="selectedEntryDetailLoading">
            <h3 class="text-sm font-medium text-gray-700 mb-3">Related Cases</h3>
            <div class="space-y-2">
              <Skeleton v-for="_ in 3" height="3rem" class="w-full" />
            </div>
            <h3 class="text-sm font-medium text-gray-700 mb-3 mt-5">Related Cases</h3>
            <div class="space-y-2">
              <Skeleton v-for="_ in 4" height="3rem" class="w-full" />
            </div>
          </div>
          <!-- Error State -->
          <div v-else-if="selectedEntryDetailError">
            <div class="text-center py-12 bg-white rounded-xl border border-gray-200">
              <div
                class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center"
              >
                <i class="pi pi-exclamation-circle text-red-500 text-xl"></i>
              </div>
              <h3 class="text-lg font-medium text-gray-900">An error occurred</h3>
              <p class="text-gray-500 mt-2">{{ selectedEntryDetailError }}</p>
              <Button
                text
                severity="danger"
                class="mt-4"
                @click="fetchEntryDetail(selectedEntry.id)"
              >
                Retry
              </Button>
            </div>
          </div>
          <!-- Content -->
          <div v-else>
            <h3 class="text-sm font-medium text-gray-700 mb-3">Related Cases</h3>
            <div class="space-y-2">
              <router-link
                v-if="selectedEntryDetail?.relatedCases.length"
                v-for="caseRef in selectedEntryDetail.relatedCases"
                :key="caseRef.id"
                :to="{ name: 'case-detail', params: { id: caseRef.id } }"
                target="_blank"
                v-tooltip.bottom="{ value: 'Open Case', showDelay: 500 }"
                class="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-emerald-200 hover:shadow-sm transition-all cursor-pointer w-full"
              >
                <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <i class="pi pi-file text-emerald-500"></i>
                </div>
                <span class="text-sm text-start text-nowrap truncate text-gray-600">{{
                  caseRef.title
                }}</span>
              </router-link>
              <div v-else class="text-gray-500 text-center">No related cases found</div>
            </div>
            <h3 class="text-sm font-medium text-gray-700 mb-3 mt-5">Related Attachments</h3>
            <div class="space-y-2">
              <button
                v-if="selectedEntryDetail?.relatedAttachments.length"
                v-for="attachmentRef in selectedEntryDetail.relatedAttachments"
                :key="attachmentRef.id"
                @click="openAttachmentPreview(attachmentRef)"
                v-tooltip.bottom="{ value: 'Preview Attachment', showDelay: 500 }"
                class="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-emerald-200 hover:shadow-sm transition-all cursor-pointer w-full"
              >
                <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <i class="pi text-emerald-500" :class="getFileIcon(attachmentRef.mimetype)"></i>
                </div>
                <span class="text-sm text-start text-nowrap truncate text-gray-600">{{
                  attachmentRef.filename
                }}</span>
              </button>
              <Button
                icon="pi pi-cloud-upload"
                :label="`Upload${selectedEntryDetail?.relatedAttachments.length ? ' Additional' : ''} Files`"
                class="w-full"
                outlined
                @click="fileUploadDialogVisible = true"
                v-tooltip.top="{ value: 'Upload Additional Files', showDelay: 1000 }"
              />
            </div>
          </div>
        </div>
        <!-- File Preview -->
        <div
          :class="{
            'h-[min(80%,max(25rem,40%))]': filePreviewVisible || loadingFileId,
            'h-0': !filePreviewVisible && !loadingFileId,
          }"
          class="absolute bottom-0 left-0 bg-white rounded-t-md ring-1 ring-gray-50 shadow-md w-full rounded-lg flex flex-col resize-y transition-[height] transition-duration-300 overflow-clip"
        >
          <div class="w-full flex items-center">
            <h3 class="text-sm font-medium text-gray-700 flex-1 truncate">
              Attachment Preview -
              <span class="font-normal">{{ selectedFile?.name ?? 'Loading' }}</span>
            </h3>
            <Button
              v-if="selectedFile"
              icon="pi pi-download"
              text
              severity="secondary"
              size="small"
              v-tooltip.top="{ value: 'Download', showDelay: 500 }"
              rounded
              @click="triggerFileDownload(selectedFile!)"
            />
            <Button
              icon="pi pi-times"
              text
              severity="secondary"
              rounded
              @click="filePreviewVisible = false"
            />
          </div>
          <FilePreview :file="selectedFile" v-if="selectedFile" class="flex-1" />
          <div v-else-if="loadingFileId" class="w-full flex-1 flex items-center justify-center">
            <i class="pi pi-spin pi-spinner text-gray-400 text-2xl"></i>
            <span class="text-gray-400 ml-2">Loading...</span>
          </div>
        </div>
      </div>
    </template>

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
  </Drawer>
</template>

<style scoped></style>
