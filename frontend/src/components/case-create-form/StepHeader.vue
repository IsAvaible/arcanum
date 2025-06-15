<script setup lang="ts">
import { computed } from 'vue'
import StepProgressIndicator from '@/components/case-create-form/StepProgressIndicator.vue'
import AccordionHeader from 'primevue/accordionheader'

interface Props {
  /** The index of this step (0-based) */
  step: number
  /** The currently active step */
  activeStep: number
  /** Function to check if the step is valid */
  stepValid: (step: number) => boolean
  /** Function to check if the step has been interacted with */
  stepInteracted: (step: number) => boolean
  /** The title of the step */
  title: string
  /** Optional description text */
  description?: string
  /** Whether to disable the header */
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  disabled: false,
})

/**
 * Compute the progress indicator type based on the step's state
 */
const progressType = computed(() => {
  if (props.activeStep === props.step) {
    // Current step
    return !props.stepInteracted(props.step)
      ? 0 // In progress
      : 1 + +props.stepValid(props.step) // Has Errors (1) or Valid (2)
  } else if (props.activeStep > props.step || props.stepInteracted(props.step)) {
    // Completed step
    return 3
  } else {
    // Locked step
    return 4
  }
})
</script>

<template>
  <AccordionHeader>
    <div :class="['flex items-center gap-x-4']">
      <StepProgressIndicator :type="progressType" />
      <div class="flex flex-col">
        <span class="font-semibold">{{ title }}</span>
        <span v-if="description" class="text-sm text-gray-500">{{ description }}</span>
      </div>

      <!-- Optional error indicator -->
      <div v-if="progressType === 1" class="ml-auto flex items-center gap-x-2 text-red-500">
        <i class="pi pi-exclamation-circle" />
        <span class="text-sm">Please fix all errors</span>
      </div>
    </div>
  </AccordionHeader>
</template>

<style scoped></style>
