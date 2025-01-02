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

// Audio Recording
const isRecording = ref(false)
const mediaRecorder = ref<MediaRecorder | null>(null)
const audioChunks = ref<BlobPart[]>([])
const audioBlob = ref<Blob | null>(null)
const audioUrl = ref<string>('')

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
      audioBlob.value = new Blob(audioChunks.value, { type: 'audio/wav' })
      audioUrl.value = URL.createObjectURL(audioBlob.value)
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

const deleteRecording = () => {
  audioBlob.value = null
  audioUrl.value = ''
}

// Video Recording
const isVideoRecording = ref(false)
const videoStream = ref<MediaStream | null>(null)
const videoChunks = ref<BlobPart[]>([])
const videoBlob = ref<Blob | null>(null)
const videoUrl = ref<string>('')

const startVideoRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    isVideoRecording.value = true
    videoStream.value = stream
    mediaRecorder.value = new MediaRecorder(stream)

    mediaRecorder.value.ondataavailable = (e) => {
      videoChunks.value.push(e.data)
    }

    mediaRecorder.value.onstop = () => {
      videoBlob.value = new Blob(videoChunks.value, { type: 'video/webm' })
      videoUrl.value = URL.createObjectURL(videoBlob.value)
    }

    mediaRecorder.value.start()
  } catch (_err) {
    toast.add({
      severity: 'error',
      summary: 'Camera Error',
      detail: 'Could not access the camera.',
      life: 3000,
    })
  }
}

const stopVideoRecording = () => {
  if (mediaRecorder.value) {
    mediaRecorder.value.stop()
    isVideoRecording.value = false
    if (videoStream.value) {
      videoStream.value.getTracks().forEach((track) => track.stop())
      videoStream.value = null
    }
  }
}

const deleteVideoRecording = () => {
  videoBlob.value = null
  videoUrl.value = ''
  if (videoStream.value) {
    videoStream.value.getTracks().forEach((track) => track.stop())
    videoStream.value = null
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
        <!-- Audio Recording Section -->
        <div class="audio-recorder flex flex-col items-center gap-3 mb-4">
          <p class="text-gray-600 text-sm">Or record audio or video to describe your case</p>
          <div class="flex gap-4">
            <button
              @click="isRecording ? stopRecording() : startRecording()"
              :aria-label="isRecording ? 'Stop Recording' : 'Start Recording'"
              class="mic-button flex items-center gap-2 px-4 py-2 border rounded-lg shadow hover:bg-gray-100"
            >
              <span v-if="isRecording" class="recording-indicator"></span>
              <i class="pi pi-microphone"></i>
              <span>{{ isRecording ? 'Stop Recording' : 'Start Recording' }}</span>
            </button>
            <button
              @click="isVideoRecording ? stopVideoRecording() : startVideoRecording()"
              :aria-label="isVideoRecording ? 'Stop Video Recording' : 'Start Video Recording'"
              class="mic-button flex items-center gap-2 px-4 py-2 border rounded-lg shadow hover:bg-gray-100"
            >
              <span v-if="isVideoRecording" class="recording-indicator"></span>
              <i class="pi pi-video"></i>
              <span>{{ isVideoRecording ? 'Stop Video Recording' : 'Start Video Recording' }}</span>
            </button>
          </div>

          <div v-if="audioBlob" class="audio-controls mt-2">
            <audio :src="audioUrl" controls class="w-full"></audio>
            <button @click="deleteRecording" class="delete-button text-red-600 mt-2">
              Delete Recording
            </button>
          </div>

          <div v-if="videoBlob" class="video-controls mt-2">
            <video :src="videoUrl" controls class="w-full"></video>
            <button @click="deleteVideoRecording" class="delete-button text-red-600 mt-2">
              Delete Video
            </button>
          </div>
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
