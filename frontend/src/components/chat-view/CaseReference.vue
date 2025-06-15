<script setup lang="ts">
import { ref, onMounted, useTemplateRef } from 'vue'

import Skeleton from 'primevue/skeleton'
import Popover from 'primevue/popover'
import Button from 'primevue/button'

import type { Case } from '@/api'
import type { AxiosError } from 'axios'
import { useTimeAgo } from '@vueuse/core'

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

const popover = useTemplateRef('popover')

const timer = ref<number | null>(null)

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

/**
 * Show the popover
 * @param event The mouse event of the trigger
 */
const showPopover = (event: MouseEvent) => {
  if (!caseData.value) return
  clearHideTimer()
  popover.value!.show(event)
}

/**
 * Hide the popover after 100ms if the mouse is neither on the popover nor the component
 */
const hidePopover = () => {
  if (!caseData.value) return
  startHideTimer()
}

/**
 * Start a timer to hide the popover after 100ms
 */
const startHideTimer = () => {
  timer.value = window.setTimeout(() => {
    popover.value!.hide()
  }, 100)
}

/**
 * Clear the hide timer if it is set
 */
const clearHideTimer = () => {
  if (timer.value) {
    clearTimeout(timer.value)
    timer.value = null
  }
}
</script>

<template>
  <component
    :is="caseData ? 'router-link' : 'div'"
    :to="`/cases/${caseID}`"
    target="_blank"
    ref="component"
    @mouseenter="showPopover"
    @mouseleave="hidePopover"
    class="flex items-center gap-2 h-12 w-full rounded-md px-2 border-l-2"
    :class="{
      'text-gray-500': loading || error,
      'text-gray-800': !loading && !error,
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

    <Popover ref="popover" @mouseenter="showPopover" @mouseleave="hidePopover">
      <div class="max-w-md">
        <h4 class="text-lg font-bold mb-2 max-w-[95%] truncate">
          Case Details - {{ caseData!.title }}
        </h4>

        <div class="grid grid-cols-[auto,1fr,auto,1fr] gap-x-2 gap-y-1">
          <span class="font-semibold">Assignees:</span>
          <span>{{ caseData!.assignees?.join(', ') || 'Unassigned' }}</span>

          <span class="font-semibold">Case Type:</span>
          <span>{{ caseData!.case_type || 'Not specified' }}</span>

          <span class="font-semibold">Status:</span>
          <span>{{ caseData!.status || 'Not specified' }}</span>

          <span class="font-semibold">Priority:</span>
          <span>{{ caseData!.priority || 'Not specified' }}</span>

          <span class="font-semibold">Updated:</span>
          <span>{{ useTimeAgo(caseData!.updatedAt) }}</span>

          <span class="font-semibold">Attachments:</span>
          <span>{{ caseData!.attachments.length }} file(s)</span>
        </div>

        <div v-if="caseData!.description" class="mt-4">
          <strong>Description:</strong>
          <p class="text-sm text-gray-700">{{ caseData!.description }}</p>
        </div>

        <div v-if="caseData!.solution" class="mt-4">
          <strong>Solution:</strong>
          <p class="text-sm text-gray-700">{{ caseData!.solution }}</p>
        </div>

        <div class="mt-4">
          <router-link :to="`/cases/${caseData!.id}`" target="_blank">
            <Button
              class="w-full"
              severity="secondary"
              icon="pi pi-external-link"
              label="View Case"
            />
          </router-link>
        </div>
      </div>
    </Popover>
  </component>
</template>

<style scoped></style>
