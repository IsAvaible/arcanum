<template>
  <span>
    <template v-for="(part, index) in parsedText" :key="index">
      <router-link v-if="part.isLink" :to="`${to}${part.linkId!}`" class="hover:underline">
        {{ part.text }}
      </router-link>
      <span v-else>{{ part.text }}</span>
    </template>
  </span>
</template>

<script setup lang="ts">
/**
 * A component to parse text and create router links for specific parts of the text
 */

import { ref, watch, toRefs } from 'vue'

interface Props {
  /**
   * The text to parse
   */
  text: string
  /**
   * The regex to match the linkId, the first group should be the linkId
   */
  regex: RegExp
  /**
   * The base path to append the linkId to
   */
  to: string
  /**
   * The validator function to check if the linkId is valid
   */
  validate?: (linkId: string) => Promise<boolean>
}

const props = defineProps<Props>()
const { text, regex, to, validate } = toRefs(props)

// Ref to hold the parsed and validated text parts
const parsedText = ref<{ text: string; linkId?: string; isLink: boolean }[]>([])

// Watch the text and regex inputs for changes
watch(
  [text, regex],
  async () => {
    const result: typeof parsedText.value = []
    const matches = [...text.value.matchAll(regex.value)]

    let lastIndex = 0
    for (const match of matches) {
      const matchIndex = match.index || 0

      // Add normal text before match
      if (matchIndex > lastIndex) {
        result.push({
          text: text.value.slice(lastIndex, matchIndex),
          isLink: false,
        })
      }

      const linkId = match[1]

      // Push the match to the result
      const index = result.push({ text: match[0], linkId, isLink: !validate?.value }) - 1
      if (validate.value) {
        // Validate the linkId async if a validator is provided
        validate.value(linkId).then((isValid: boolean) => {
          if (isValid) {
            // Update the isLink property if the linkId is valid
            parsedText.value[index].isLink = true
            result[index].isLink = true
          }
        })
      }

      // Update lastIndex
      lastIndex = matchIndex + match[0].length
    }

    // Add any remaining text after the last match
    if (lastIndex < text.value.length) {
      result.push({ text: text.value.slice(lastIndex), isLink: false })
    }

    parsedText.value = result
  },
  { immediate: true },
)
</script>

<style scoped>
/* Add any styles if needed */
</style>
