<script setup lang="ts">
import { CheckCircle } from '@iconoir/vue'
import { computed } from 'vue'

const props = defineProps<{
  type: StepProgressIndicatorType
}>()

enum StepProgressIndicatorType {
  Active = 0,
  ActiveInvalid = 1,
  ActiveValid = 2,
  Completed = 3,
  Inactive = 4,
}

const active = computed(
  () =>
    props.type === StepProgressIndicatorType.Active ||
    props.type === StepProgressIndicatorType.ActiveInvalid ||
    props.type === StepProgressIndicatorType.ActiveValid,
)
</script>

<template>
  <div
    :class="{
      'size-6 rounded-full overflow-clip ring-inset': true,
      'ring-2 ring-slate-300': props.type === StepProgressIndicatorType.Inactive,
      'ring-2 flex items-center justify-center': active,
      'ring-blue-500': props.type === StepProgressIndicatorType.Active,
      'ring-red-500': props.type === StepProgressIndicatorType.ActiveInvalid,
      'ring-green-500': props.type === StepProgressIndicatorType.ActiveValid,
      'text-white bg-green-500': props.type === StepProgressIndicatorType.Completed,
    }"
  >
    <div
      v-if="active"
      class="rounded-full size-1.5"
      :class="{
        'bg-blue-500': props.type === StepProgressIndicatorType.Active,
        'bg-red-500': props.type === StepProgressIndicatorType.ActiveInvalid,
        'bg-green-500': props.type === StepProgressIndicatorType.ActiveValid,
      }"
    ></div>
    <CheckCircle v-else-if="props.type === StepProgressIndicatorType.Completed" />
  </div>
</template>

<style scoped></style>
