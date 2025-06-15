<script setup lang="ts">
interface Props {
  /** The ID of the input element this label is for */
  for: string
  /** The leading label text (semibold) */
  label: string
  /** The trailing description text */
  description: string
  /** The icon to display before the label */
  icon?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div class="flex items-center gap-x-2">
    <i v-if="icon" :class="`pi ${icon} ml-1 mt-[1.5px]`"></i>
    <label :for="props.for" class="text-md font-semibold">{{ props.label }}</label>
    <span class="rounded-full size-0.75 bg-black" aria-hidden="true"></span>
    <p class="text-slate-600">{{ props.description }}</p>
  </div>
</template>

<style scoped></style>
