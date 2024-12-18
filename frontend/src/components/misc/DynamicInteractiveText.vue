<template>
  <span>
    <template v-for="(part, index) in parsedText" :key="index">
      <router-link
        v-if="part.matched && to !== undefined"
        :to="`${to}${part.match!}`"
        :target="target"
        @click="emit('match-click', $event, part.match!)"
        class="hover:underline"
      >
        {{ part.text }}
      </router-link>
      <!-- Case 2: The part was matched but no to prop was provided -->
      <button v-else-if="part.matched" @click="emit('match-click', $event, part.match!)">
        {{ part.text }}
      </button>
      <!-- Case 3: The part was not matched -->
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
   * The regex to match, the first group should be the match
   */
  regex: RegExp
  /**
   * The base path to append the match to
   */
  to?: string
  /**
   * The target to open the link in
   */
  target?: '_self' | '_blank' | '_parent' | '_top' | '_unfencedTop'
  /**
   * The validator function to check if the match is valid
   */
  validate?: (match: string) => Promise<boolean>
}

const props = withDefaults(defineProps<Props>(), {
  target: '_self',
})

const emit = defineEmits<{
  'match-click': [event: MouseEvent, match: string]
}>()

const { text, regex, to, target, validate } = toRefs(props)

// Ref to hold the parsed and validated text parts
const parsedText = ref<{ text: string; match?: string; matched: boolean }[]>([])

// Watch the text and regex inputs for changes
watch(
  [text, regex],
  async () => {
    const result: typeof parsedText.value = []
    const matches = [...text.value.matchAll(regex.value)]

    let lastIndex = 0
    for (const matchObject of matches) {
      const matchIndex = matchObject.index || 0

      // Add normal text before match
      if (matchIndex > lastIndex) {
        result.push({
          text: text.value.slice(lastIndex, matchIndex),
          matched: false,
        })
      }

      const match = matchObject[1]

      // Push the match to the result
      const index = result.push({ text: matchObject[0], match, matched: !validate?.value }) - 1
      if (validate.value) {
        // Validate the match async if a validator is provided
        validate.value(match).then((isValid: boolean) => {
          if (isValid) {
            // Update the matched property if the match is valid
            parsedText.value[index].matched = true
            result[index].matched = true
          }
        })
      }

      // Update lastIndex
      lastIndex = matchIndex + matchObject[0].length
    }

    // Add any remaining text after the last match
    if (lastIndex < text.value.length) {
      result.push({ text: text.value.slice(lastIndex), matched: false })
    }

    parsedText.value = result
  },
  { immediate: true },
)
</script>

<style scoped>
/* Add any styles if needed */
</style>
