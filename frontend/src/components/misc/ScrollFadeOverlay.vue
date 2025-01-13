<script setup lang="ts">
/**
 * Component that fades out the edges of a scrollable container until the edge is reached.
 *
 * @param axis - The axis to apply the fade effect to.
 *
 * @example
 * ```vue
 * <FadeOverlay axis="horizontal">
 *   <!-- Scrollable content -->
 * </FadeOverlay>
 * ```
 */

import { onMounted, ref } from 'vue'
import { useScroll } from '@vueuse/core'

const props = withDefaults(
  defineProps<{
    axis: 'horizontal' | 'vertical'
    contentClass?: string
    fadeFrom?: string
  }>(),
  {
    contentClass: '',
    fadeFrom: 'from-white',
  },
)

const axis = props.axis

const containerRef = ref<HTMLElement | null>(null)
const { arrivedState } = useScroll(containerRef)

onMounted(() => {
  // Update scroll state on window resize
  window.addEventListener('resize', () => containerRef.value?.dispatchEvent(new Event('scroll')))

  // Dispatch an initial scroll event to update the scroll state
  setTimeout(() => containerRef.value?.dispatchEvent(new Event('scroll')), 100)
})
</script>

<template>
  <div class="relative">
    <!-- Fade overlay -->
    <div
      v-if="axis === 'horizontal'"
      :class="[
        'absolute top-0 left-0 h-full w-10 bg-gradient-to-r to-transparent pointer-events-none transition-opacity z-10',
        arrivedState.left ? 'opacity-0' : 'opacity-100',
        fadeFrom,
      ]"
    ></div>
    <div
      v-if="axis === 'horizontal'"
      :class="[
        'absolute top-0 right-0 h-full w-10 bg-gradient-to-l to-transparent pointer-events-none transition-opacity z-10',
        arrivedState.right ? 'opacity-0' : 'opacity-100',
        fadeFrom,
      ]"
    ></div>
    <div
      v-if="axis === 'vertical'"
      :class="[
        'absolute top-0 left-0 w-full h-10 bg-gradient-to-b to-transparent pointer-events-none transition-opacity z-10',
        arrivedState.top ? 'opacity-0' : 'opacity-100',
        fadeFrom,
      ]"
    ></div>
    <div
      v-if="axis === 'vertical'"
      :class="[
        'absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t to-transparent pointer-events-none transition-opacity z-10',
        arrivedState.bottom ? 'opacity-0' : 'opacity-100',
        fadeFrom,
      ]"
    ></div>

    <!-- Slot content -->
    <div
      ref="containerRef"
      class="overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 scroll-smooth"
      :class="props.contentClass"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped></style>
