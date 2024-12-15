<template>
  <span>
    <template v-for="(part, index) in parsedText" :key="index">
      <router-link class="hover:underline" v-if="part.isLink" :to="`${to}${part.linkId!}`"
        >{{ part.text }}
      </router-link>
      <span v-else>{{ part.text }}</span>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue'

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
}

const props = defineProps<Props>()

const { text, regex, to } = toRefs(props)

const parsedText = computed(() => {
  const result: {
    text: string
    linkId?: string
    isLink: boolean
  }[] = []
  const matches = [...text.value.matchAll(regex.value)]

  let lastIndex = 0
  matches.forEach((match) => {
    const matchIndex = match.index
    if (matchIndex > lastIndex) {
      // Add text before the match as a normal span
      result.push({ text: text.value.slice(lastIndex, matchIndex), isLink: false })
    }

    // Add the matched text as a router-link
    result.push({ text: match[0], linkId: match[1], isLink: true })

    // Update the lastIndex to the end of the match
    lastIndex = matchIndex + match[0].length
  })

  // Add any remaining text after the last match
  if (lastIndex < text.value.length) {
    result.push({ text: text.value.slice(lastIndex), isLink: false })
  }

  return result
})
</script>

<style scoped>
/* Add any styles if needed */
</style>
