<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { ref, useTemplateRef } from 'vue'
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
const fileDropzone = useTemplateRef('fileDropzone')
const fileDropzone = useTemplateRef('fileDropzone')

// Methods
const openManualCaseCreation = () => {
  showDialog.value = false
  router.push({ name: 'case-create-manual' })
}

// Audio-Recorder
const isRecording = ref(false)
const mediaRecorder = ref<MediaRecorder | null>(null)
const audioChunks = ref<BlobPart[]>([])

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    isRecording.value = true
    audioChunks.value = []
    mediaRecorder.value = new MediaRecorder(stream)

    mediaRecorder.value.ondataavailable = (e) => {
      audioChunks.value.push(e.data)
    }

    mediaRecorder.value.onstop = () => {
      // Create a file from the audio chunks
      const file = new File(
        [new Blob(audioChunks.value, { type: 'audio/wav' })],
        `audio-recording_${new Date().toISOString()}.wav`,
        {
          type: 'audio/wav',
        },
      )

      // Add the file to the file dropzone
      fileDropzone.value?.addFile(file)
    }

    mediaRecorder.value.start()
  } catch (_err) {
    toast.add({
      severity: 'error',
      summary: 'Microphone Error',
      detail: 'Could not access the microphone.',
      life: 3000,
    })
  }
}

const stopRecording = () => {
  if (mediaRecorder.value) {
    mediaRecorder.value.stop()
    isRecording.value = false
  }
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
    return
  }

  loading.value = true

  try {
    const result = await api.createCaseFromFilesPost({
      files: files.value, // Original-File-Objekte werden gesendet
    })

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
        <FileDropzoneUpload v-model:files="files" ref="fileDropzone" />
        <FileDropzoneUpload v-model:files="files" ref="fileDropzone" />

        <!-- Audio Recording Section -->
        <div class="audio-recorder flex flex-col items-center gap-3 mb-4">
          <p class="text-gray-600 text-sm">Or record audio to describe your case</p>
          <button
            @click="isRecording ? stopRecording() : startRecording()"
            :aria-label="isRecording ? 'Stop Recording' : 'Start Recording'"
            class="mic-button flex items-center gap-2 px-4 py-2 border rounded-lg shadow hover:bg-gray-100"
          >
            <div class="w-4 flex items-center justify-center">
              <span v-if="isRecording" class="recording-indicator"></span>
              <i v-else class="pi pi-microphone"></i>
            </div>
            <div class="w-4 flex items-center justify-center">
              <span v-if="isRecording" class="recording-indicator"></span>
              <i v-else class="pi pi-microphone"></i>
            </div>
            <span>{{ isRecording ? 'Stop Recording' : 'Start Recording' }}</span>
          </button>
        </div>
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

<style scoped>
.mic-button {
  background: white;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: background 0.3s ease;
}

.mic-button:hover {
  background: #f3f4f6;
}

.recording-indicator {
  width: 10px;
  height: 10px;
  background: red;
  border-radius: 50%;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}
</style>
