import { ref } from 'vue'
import type { AxiosError } from 'axios'
import type { Attachment } from '@/api'
import { useToast } from 'primevue'
import { apiBlobToFile } from '@/functions/apiBlobToFile'
import { useApi } from '@/composables/useApi'

export const useAttachmentLoading = () => {
  const toast = useToast()
  const api = useApi()

  const files = ref<File[]>([])
  const selectedFile = ref<File | null>(null)
  const filePreviewVisible = ref(false)
  const loadingFileId = ref<number | null>(null)

  /**
   * Load the attachment from the server and open the preview
   * @param attachment The attachment to open
   */
  const openAttachmentPreview = async (attachment: Attachment) => {
    // Check if the attachment is already in the files array
    let file = files.value.find((f) => f.name === attachment.filename)
    if (!file) {
      loadingFileId.value = attachment.id
      // If not, download the file from the server
      try {
        file = await apiBlobToFile(
          await api.casesAttachmentsAttachmentIdDownloadGet(
            {
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
    filePreviewVisible.value = true
  }

  const downloadAttachment = async (attachment: Attachment) => {
    try {
      let file = files.value.find((f) => f.name === attachment.filename)
      if (!file) {
        file = await apiBlobToFile(
          await api.casesAttachmentsAttachmentIdDownloadGet(
            {
              attachmentId: attachment.id,
            },
            { responseType: 'blob' },
          ),
        )
      }

      triggerFileDownload(file)
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'An error occurred while downloading the file\n' + (error as AxiosError).message,
        life: 3000,
      })
      console.error(error)
    }
  }

  const triggerFileDownload = (file: File) => {
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return {
    files,
    selectedFile,
    filePreviewVisible,
    loadingFileId,
    openAttachmentPreview,
    downloadAttachment,
    triggerFileDownload,
  }
}
