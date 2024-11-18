<script setup lang="ts">
const props = defineProps<{
  for: string
  label: string
  description: string
}>()
</script>

<template>
  <div class="flex items-center gap-x-2">
    <label :for="props.for" class="text-md font-semibold">{{ props.label }}</label>
    <span class="rounded-full size-0.75 bg-black" aria-hidden="true"></span>
    <p class="text-slate-600">{{ props.description }}</p>
  </div>
</template>

<style scoped></style>
