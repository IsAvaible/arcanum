<script setup lang="ts">
import CaseTypeCard from '@/components/case-create-form/CaseTypeCard.vue'
import ScrollFadeOverlay from '@/components/misc/ScrollFadeOverlay.vue'

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
  <ScrollFadeOverlay axis="horizontal">
    <div class="flex items-stretch gap-x-6 pb-2" aria-hidden="true" ref="caseTypeSelector">
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
  </ScrollFadeOverlay>
</template>

<style scoped></style>
