<script setup lang="ts">
import { ref, onMounted } from 'vue'

import Skeleton from 'primevue/skeleton'

import type { Case } from '@/api'
import type { AxiosError } from 'axios'

interface Props {
  reference: { id: number; case: Promise<Case> }
}

const props = defineProps<Props>()

const loading = ref(true)
const error = ref<string | null>(null)
const errorStatus = ref<number | null>(null)
const errorCode = ref<string | null>(null)
const caseData = ref<Case | null>(null)
const caseID = ref<number | null>(null)

onMounted(async () => {
  try {
    caseID.value = props.reference.id
    caseData.value = await props.reference.case
  } catch (err) {
    error.value = 'Failed to load case #' + caseID.value
    errorStatus.value = (err as AxiosError)?.status ?? null
    errorCode.value = (err as AxiosError)?.code ?? null
    console.error(err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <component
    :is="caseData ? 'router-link' : 'div'"
    :to="`/cases/${caseID}`"
    class="flex items-center gap-2 h-12 w-full rounded-md px-2 border-l-2"
    :class="{
      'text-gray-500': loading || error,
      'text-gray-700': !loading && !error,
    }"
  >
    <i
      class="pi"
      :class="{
        'pi-spin pi-spinner': loading,
        'pi-times': error,
        'pi-file': !loading && !error,
      }"
    ></i>
    <Skeleton v-if="loading" class="h-full flex-1" />
    <span v-else-if="error" class="text-sm text-nowrap truncate"
      >{{ error }} ({{ errorStatus ?? errorCode }})</span
    >

    <span v-if="caseData" class="text-sm flex-1 text-nowrap truncate">
      Case {{ caseData?.id }}: {{ caseData?.title }}
    </span>
  </component>
</template>

<style scoped></style>
