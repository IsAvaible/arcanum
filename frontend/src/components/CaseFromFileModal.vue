<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Dialog, Button, Divider } from 'primevue'
import FileDropzoneUpload from '@/components/file-handling/FileDropzoneUpload.vue'

// References and State
const router = useRouter()
const showDialog = ref(true)

const files = ref<File[]>([])

// Methods
const openManualCaseCreation = () => {
  showDialog.value = false
  router.push({ name: 'ManualCaseCreation' })
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
          <FileDropzoneUpload v-model:files="files" />
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
    </Dialog>
  </div>
</template>

<style scoped></style>
