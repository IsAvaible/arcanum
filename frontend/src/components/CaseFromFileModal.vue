<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Dialog, Button, Divider, useToast } from 'primevue'
import FileDropzoneUpload from '@/components/file-handling/FileDropzoneUpload.vue'
import { useVModel } from '@vueuse/core'
import { useApi } from '@/composables/useApi'
import { AxiosError } from 'axios'

const props = defineProps<{
  /** The visibility of the dialog */
  visible?: boolean
}>()
const emit = defineEmits(['update:visible'])

const toast = useToast()
const api = useApi()

// References and State
const router = useRouter()
const files = ref<File[]>([])
const showDialog = useVModel(props, 'visible', emit)

// Methods
const openManualCaseCreation = () => {
  showDialog.value = false
  router.push({ name: 'case-create-manual' })
}

const loading = ref(false)
const openAICaseCreation = async () => {
  if (files.value.length === 0) {
    toast.add({
      severity: 'error',
      summary: 'No files selected',
      detail: 'Please select files to generate a case from',
      life: 3000,
    })
  } else {
    loading.value = true
    try {
      const result = await api.createCaseFromFilesPost({ files: files.value })
      console.log(result)
      await router.push('/cases/' + result.data[0].id)
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'An error occurred while creating the case:\n\t' + (error as AxiosError).message,
        life: 3000,
      })
      console.error(error)
    } finally {
      loading.value = false
    }
  }
}
</script>

<template>
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
        <FileDropzoneUpload v-model:files="files" />
        <Button
          :loading="loading"
          :disabled="loading"
          :label="`Generat${loading ? 'ing' : 'e'} Case From Files`"
          icon="pi pi-sparkles"
          class="w-full bg-gradient-to-tr from-green-500 via-blue-600 to-purple-700 border-none opacity-85 transition-opacity"
          :class="{
            'hover:opacity-100': !loading,
          }"
          @click="openAICaseCreation"
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
  </Dialog>
</template>

<style scoped></style>
