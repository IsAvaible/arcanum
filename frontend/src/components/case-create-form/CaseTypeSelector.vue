<script setup lang="ts">
import CaseTypeCard from '@/components/case-create-form/CaseTypeCard.vue'
import { ref } from 'vue'
import { useScroll } from '@vueuse/core'

const props = defineProps<{
  caseTypes: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: any
    title: string
    description: string
  }[]
  modelValue: string | undefined
}>()

// emit selected case type
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// Monitor case type selector scroll state to show/hide fading effect overlays
const caseTypeSelector = ref<HTMLElement | null>(null)
const { arrivedState: caseTypeSelectorScrollState } = useScroll(caseTypeSelector)
// Trigger scroll event to populate initial scroll state
setTimeout(() => caseTypeSelector.value?.dispatchEvent(new Event('scroll')), 0)

// On resize, trigger scroll event to update scroll state
window.addEventListener('resize', () => caseTypeSelector.value?.dispatchEvent(new Event('scroll')))
</script>

<template>
  <!-- Select for screen readers-->
  <select
    id="case-type"
    :value="props.modelValue"
    @input="emit('update:modelValue', ($event.target! as HTMLSelectElement).value)"
    class="sr-only"
  >
    <option
      v-for="(caseType, index) in props.caseTypes"
      :key="index"
      :value="caseType.title"
      :aria-label="caseType.description"
    >
      {{ caseType.title }}
    </option>
  </select>
  <div class="relative">
    <!-- Fading effect overlay left -->
    <div
      :class="[
        'absolute top-0 left-0 h-full w-10 bg-gradient-to-r from-white to-transparent pointer-events-none transition-opacity',
        caseTypeSelectorScrollState.left ? 'opacity-0' : 'opacity-100',
      ]"
    ></div>
    <!-- Fading effect overlay right -->
    <div
      :class="[
        'absolute top-0 right-0 h-full w-10 bg-gradient-to-l from-white to-transparent pointer-events-none transition-opacity',
        caseTypeSelectorScrollState.right ? 'opacity-0' : 'opacity-100',
      ]"
    ></div>
    <!-- Actual content -->
    <div
      class="flex items-stretch gap-x-6 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-2 scroll-smooth"
      aria-hidden="true"
      ref="caseTypeSelector"
    >
      <CaseTypeCard
        v-for="(caseType, index) in caseTypes"
        :key="index"
        v-bind="caseType"
        :selected="props.modelValue === caseType.title"
        @click="emit('update:modelValue', caseType.title)"
      >
        <Component :is="caseType.icon" />
      </CaseTypeCard>
    </div>
  </div>
</template>

<style scoped></style>
