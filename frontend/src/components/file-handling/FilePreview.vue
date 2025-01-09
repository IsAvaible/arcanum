<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'

const props = defineProps<{
  file: File
}>()

const objectURL = computed(() => URL.createObjectURL(props.file))
const mediaComponent = useTemplateRef('media')

/**
 * Jump to a specific timestamp in the media file.
 * @param timestamp The timestamp to jump to.
 * @throws Error if the file type is not supported.
 */
const jumpToTimestamp = (timestamp: number) => {
  if (props.file.type.startsWith('video') || props.file.type.startsWith('audio')) {
    const media = mediaComponent.value as HTMLMediaElement
    media.currentTime = timestamp
    media.play()
  } else {
    throw new Error('Cannot jump to timestamp on ' + props.file.type + ' files.')
  }
}

defineExpose({ jumpToTimestamp: jumpToTimestamp })
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
  <video v-else-if="file.type.startsWith('video')" controls class="w-full" ref="media">
    <source :src="objectURL" />
    Your browser does not support the video tag.
  </video>

  <!-- Audio Preview -->
  <div v-else-if="file.type.startsWith('audio')" class="w-full !h-14">
    <audio controls class="w-full" ref="media">
      <source :src="objectURL" />
      Your browser does not support the audio tag.
    </audio>
  </div>

  <!-- Unsupported File Type -->
  <p v-else class="text-gray-500">Preview not available for this file type.</p>
</template>

<style scoped></style>
