<script setup lang="ts">
const _props = defineProps<{
  file: File
}>()

const objectURL = URL.createObjectURL(_props.file)
</script>

<template>
  <!-- PDF Preview -->
  <iframe
    v-if="file.type == 'application/pdf'"
    :src="objectURL"
    class="w-full border rounded"
  ></iframe>

  <!-- Image Preview -->
  <img
    v-else-if="file.type.startsWith('image')"
    :src="objectURL"
    alt="Image Preview"
    class="w-full object-contain"
  />

  <!-- Video Preview -->
  <video v-else-if="file.type.startsWith('video')" controls class="w-full">
    <source :src="objectURL" />
    Your browser does not support the video tag.
  </video>

  <!-- Audio Preview -->
  <audio v-else-if="file.type.startsWith('audio')" controls class="w-full">
    <source :src="objectURL" />
    Your browser does not support the audio tag.
  </audio>

  <!-- Unsupported File Type -->
  <p v-else class="text-gray-500">Preview not available for this file type.</p>
</template>

<style scoped></style>
