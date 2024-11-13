<script setup lang="ts">
import { CheckCircle } from '@iconoir/vue'

const props = defineProps<{
  type?: StepProgressIndicatorType
}>()

enum StepProgressIndicatorType {
  Inactive = 0,
  Active = 1,
  Completed = 2,
}
</script>

<template>
  <div
    :class="[
      'size-6 rounded-full overflow-clip ring-inset',
      props.type === StepProgressIndicatorType.Inactive ? 'ring-2 ring-slate-300' : '',
      props.type === StepProgressIndicatorType.Active
        ? 'ring-2 ring-blue-500 flex items-center justify-center'
        : '',
      props.type === StepProgressIndicatorType.Completed ? 'text-white bg-green-500' : '',
    ]"
  >
    <div
      v-if="props.type === StepProgressIndicatorType.Active"
      class="rounded-full size-1.5 bg-blue-500"
    ></div>
    <CheckCircle v-else-if="props.type === StepProgressIndicatorType.Completed" />
  </div>
</template>

<style scoped></style>
