<script setup lang="ts">
import { ref, onMounted } from 'vue'

import Skeleton from 'primevue/skeleton'

import type { Attachment } from '@/api'
import type { AxiosError } from 'axios'

interface Props {
  reference: { id: number; attachment: Promise<Attachment> }
  fileLoading: boolean
}

const props = defineProps<Props>()

interface Emit {
  (event: 'click', attachment: Attachment): void
}
const emit = defineEmits<Emit>()

const loading = ref(true)

const error = ref<string | null>(null)
const errorStatus = ref<number | null>(null)
const errorCode = ref<string | null>(null)

const attachmentData = ref<Attachment | null>(null)
const attachmentID = ref<number | null>(null)

onMounted(async () => {
  try {
    attachmentID.value = props.reference.id
    attachmentData.value = await props.reference.attachment
  } catch (err) {
    error.value = 'Failed to load attachment #' + attachmentID.value
    errorStatus.value = (err as AxiosError)?.status ?? null
    errorCode.value = (err as AxiosError)?.code ?? null
    console.error(err)
  } finally {
    loading.value = false
  }
})

/**
 * Emit the click event with the attachment data
 */
const onClick = () => {
  if (!loading.value && !error.value && attachmentData.value) {
    emit('click', attachmentData.value)
  }
}
</script>

<template>
  <component
    @click="onClick"
    :is="attachmentData ? 'button' : 'div'"
    ref="component"
    class="flex items-center gap-2 h-12 w-full rounded-md px-2 border-l-2"
    :class="{
      'text-gray-500': loading || error,
      'text-gray-800': !loading && !error,
    }"
  >
    <i
      class="pi"
      :class="{
        'pi-spin pi-spinner': loading || fileLoading,
        'pi-times': error,
        'pi-file': !loading && !error,
      }"
    ></i>
    <Skeleton v-if="loading" class="h-full flex-1" />
    <span v-else-if="error" class="text-sm text-nowrap truncate text-start"
      >{{ error }} ({{ errorStatus ?? errorCode }})</span
    >
    <span
      v-if="attachmentData"
      class="text-sm flex-1 text-nowrap truncate text-start"
      :class="{
        'animate-pulse': fileLoading,
      }"
    >
      File {{ attachmentData?.id }}: {{ attachmentData?.filename }}
    </span>
  </component>
</template>

<style scoped></style>
