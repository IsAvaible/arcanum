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
  const loadingAttachmentId = ref<number | null>(null)

  /**
   * Load the attachment from the server and open the preview
   * @param attachment The attachment to open
   */
  const openAttachmentPreview = async (attachment: Attachment) => {
    // Check if the attachment is already in the files array
    let file: File | null = files.value.find((f) => f.name === attachment.filename) || null
    if (!file) {
      file = await downloadAttachment(attachment)
    }

    selectedFile.value = file
    filePreviewVisible.value = !!file
  }

  /**
   * Download an attachment from the server
   * @param attachment The attachment to download
   */
  const downloadAttachment = async (attachment: Attachment): Promise<File | null> => {
    const file = files.value.find((f) => f.name === attachment.filename)
    if (file) {
      return file
    }
    try {
      loadingAttachmentId.value = attachment.id
      const file = await apiBlobToFile(
        await api.casesAttachmentsAttachmentIdDownloadGet(
          {
            attachmentId: attachment.id,
          },
          { responseType: 'blob' },
        ),
      )
      files.value.push(file)
      return file
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'An error occurred while downloading the file\n' + (error as AxiosError).message,
        life: 3000,
      })
      console.error(error)
      return null
    } finally {
      loadingAttachmentId.value = null
    }
  }

  /**
   * Trigger the download of an attachment
   * @param attachment The attachment to download
   */
  const triggerAttachmentDownload = async (attachment: Attachment) => {
    const file = await downloadAttachment(attachment)
    if (!file) return
    triggerFileDownload(file)
  }

  /**
   * Trigger the download of a file
   * @param file The file to download
   */
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
    loadingAttachmentId,
    openAttachmentPreview,
    triggerAttachmentDownload,
    triggerFileDownload,
  }
}
