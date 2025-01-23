<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { Dialog, Button, Divider, Select, useToast } from 'primevue'
import FileDropzoneUpload from '@/components/file-handling/FileDropzoneUpload.vue'
import { useDevicesList, useVModel } from '@vueuse/core'
import { useApi } from '@/composables/useApi'
import { AxiosError } from 'axios'
import { io, Socket } from 'socket.io-client'
import { BASE_PATH as BACKEND_API_BASE_PATH } from '@/api/base'
import { type ModelError } from '@/api'

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

const generateButtonLabel = ref<string | ''>('Generate Case From Files')

// Types
interface StatusMessage {
  /**
   * Content of the message.
   * @type {string}
   */
  content: string
}

// Methods
const openManualCaseCreation = () => {
  showDialog.value = false
  router.push({ name: 'case-create-manual' })
}

const socket = ref<Socket | null>(null)
const pendingLLMMessage = ref<(StatusMessage & {}) | null>(null)
/// Socket Connection
/** Socket connection for real-time chat updates. */
const registerSocket = () => {
  if (socket.value) {
    // Disconnect the existing socket
    socket.value.disconnect()
  }
  socket.value = io(BACKEND_API_BASE_PATH.replace(/(.*?)(\/api)(.*)/, '$1$3'), {
    rejectUnauthorized: false,
  })

  socket.value.on('connect', () => {
    socket.value!.on('llm_message', (data: { message: string }) => {
      pendingLLMMessage.value = {
        content: data.message,
      }
      generateButtonLabel.value = pendingLLMMessage.value.content
    })
  })
}

// Device List
const { videoInputs: cameras, audioInputs: microphones } = useDevicesList({
  requestPermissions: true,
})
const cameraOptions = computed(() =>
  cameras.value.map((camera: MediaDeviceInfo) => ({
    label: camera.label || `Camera ${camera.deviceId}`,
    value: camera.deviceId,
  })),
)
const microphoneOptions = computed(() =>
  microphones.value.map((microphone: MediaDeviceInfo) => ({
    label: microphone.label || `Microphone ${microphone.deviceId}`,
    value: microphone.deviceId,
  })),
)
const selectedCamera = ref<string | null>(null)
const selectedMicrophone = ref<string | null>(null)

// Set the first camera and microphone as the default selected devices once they are available
watch(cameras, () => {
  if (cameras.value.length > 0 && !selectedCamera.value) {
    selectedCamera.value = cameras.value[0].deviceId
  }
  if (microphones.value.length > 0 && !selectedMicrophone.value) {
    selectedMicrophone.value = microphones.value[0].deviceId
  }
})

// Audio Recording
const isAudioRecording = ref(false)
const mediaRecorder = ref<MediaRecorder | null>(null)
const audioChunks = ref<BlobPart[]>([])

const startAudioRecording = async () => {
  if (mediaRecorder.value) {
    mediaRecorder.value.stop()
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: selectedMicrophone.value ? { exact: selectedMicrophone.value } : undefined,
      },
    })
    isAudioRecording.value = true
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
  } catch (error) {
    console.error(error)
    toast.add({
      severity: 'error',
      summary: 'Microphone Error',
      detail: 'Could not access the microphone.',
      life: 3000,
    })
  }
}

const stopAudioRecording = () => {
  if (mediaRecorder.value) {
    mediaRecorder.value.stop()
    isAudioRecording.value = false
  }
}

// Video Recording
const isVideoRecording = ref(false)
const videoStream = ref<MediaStream | null>(null)
const videoChunks = ref<BlobPart[]>([])
const videoRecordingPreview = useTemplateRef('videoRecordingPreview')

const startVideoRecording = async () => {
  if (mediaRecorder.value) {
    mediaRecorder.value.stop()
  }
  try {
    videoStream.value = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: selectedMicrophone.value ? { exact: selectedMicrophone.value } : undefined,
      },
      video: { deviceId: selectedCamera.value ? { exact: selectedCamera.value } : undefined },
    })
    isVideoRecording.value = true
    videoChunks.value = []
    mediaRecorder.value = new MediaRecorder(videoStream.value, { mimeType: 'video/mp4' })

    mediaRecorder.value.ondataavailable = (e) => {
      videoChunks.value.push(e.data)
    }

    mediaRecorder.value.onstop = () => {
      const audioFile = new File(
        [new Blob(videoChunks.value, { type: 'video/mp4' })],
        `video-recording_${new Date().toISOString()}.mp4`,
        { type: 'video/mp4' },
      )
      fileDropzone.value?.addFile(audioFile)
    }

    mediaRecorder.value.start()
  } catch (_err) {
    toast.add({
      severity: 'error',
      summary: 'Recording Error',
      detail: 'Could not access the microphone.',
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

watchEffect(() => {
  if (isVideoRecording.value && videoRecordingPreview.value) {
    videoRecordingPreview.value.srcObject = videoStream.value
  }
})
onMounted(async () => {
  registerSocket()
})

const buttonDevices = ref([
  {
    type: 'microphone',
    label: 'Microphone',
    output: 'Audio',
    icon: 'microphone',
    selected: selectedMicrophone,
    options: microphoneOptions,
    isRecording: isAudioRecording,
    startRecording: startAudioRecording,
    stopRecording: stopAudioRecording,
  },
  {
    type: 'camera',
    label: 'Camera',
    output: 'Video',
    icon: 'video',
    selected: selectedCamera,
    options: cameraOptions,
    isRecording: isVideoRecording,
    startRecording: startVideoRecording,
    stopRecording: stopVideoRecording,
  },
])

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
      files: files.value,
      socketId: socket.value?.connected ? socket.value!.id! : '-1',
    })

    await router.push('/cases/' + result.data[0].id)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail:
        'An error occurred while creating the case:\n\t' +
        (((error as AxiosError).response?.data as ModelError)?.message ??
          (error as AxiosError).message),
      life: 3000,
    })
    console.error(error)
  } finally {
    loading.value = false
    generateButtonLabel.value = 'Generate Case From Files'
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
    <div class="p-4 relative">
      <!-- Content -->
      <div class="flex flex-col space-y-4" :class="{ invisible: isVideoRecording }">
        <FileDropzoneUpload
          v-model:files="files"
          ref="fileDropzone"
          accept="image/*, audio/*, video/*, application/pdf, text/*"
        />

        <!-- Audio and Video Recording Section -->
        <div class="flex flex-col items-center gap-3 mb-4">
          <p class="text-gray-600 text-sm">or record an audio or a video to describe your case</p>
          <div class="flex gap-4">
            <template v-for="device in buttonDevices" :key="device.type">
              <Select
                v-if="device.type === 'camera' ? cameras.length : true"
                v-model="device.selected"
                :options="device.options"
                optionLabel="label"
                optionValue="value"
                :placeholder="`Select ${device.label}`"
                class="border-none shadow"
                :pt="{
                  label: {
                    class: 'hover:bg-gray-50 rounded-tl-md rounded-bl-md transition-colors',
                  },
                  dropdown: {
                    class: 'hover:bg-gray-50 rounded-tr-md rounded-br-md transition-colors',
                  },
                  overlay: {
                    class: 'neutral-primary',
                  },
                }"
              >
                <template #value>
                  <button
                    @click.stop="
                      device.isRecording ? device.stopRecording() : device.startRecording()
                    "
                    class="flex items-center text-gray-600 gap-2 h-full pl-1"
                  >
                    <div class="w-4 flex items-center justify-center">
                      <span v-if="device.isRecording" class="recording-indicator"></span>
                      <i v-else :class="`pi pi-${device.icon}`"></i>
                    </div>
                    <span>{{
                      device.isRecording
                        ? `Stop ${device.output} Recording`
                        : `Start ${device.output} Recording`
                    }}</span>
                  </button>
                </template>
              </Select>
            </template>
          </div>
        </div>

        <Button
          :loading="loading"
          :disabled="loading"
          :label="generateButtonLabel"
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
      <!-- Video Recording Preview -->
      <div
        class="absolute top-0 left-0 h-full w-full rounded-lg flex flex-col space-y-4 items-center justify-center"
        v-if="isVideoRecording"
      >
        <div class="w-full flex-1 rounded-lg">
          <video
            ref="videoRecordingPreview"
            muted
            autoplay
            class="flex-1 max-w-full max-h-full h-full rounded-lg mx-auto"
            v-if="isVideoRecording"
          />
        </div>
        <button
          @click="isVideoRecording ? stopVideoRecording() : startVideoRecording()"
          class="mic-button flex items-center gap-2 px-4 py-2 border rounded-lg shadow hover:bg-gray-100"
        >
          <div class="w-4 flex items-center justify-center">
            <span v-if="isVideoRecording" class="recording-indicator"></span>
            <i v-else class="pi pi-video"></i>
          </div>
          <span>{{ isVideoRecording ? 'Stop Video Recording' : 'Start Video Recording' }}</span>
        </button>
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
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
