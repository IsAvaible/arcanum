<template>
  <span>
    <template v-for="(part, index) in parsedText" :key="index">
      <!-- Case 1: The part was matched and a slot named match was provided -->
      <slot
        v-if="part.matched"
        name="match"
        :part="part"
        :to="to"
        :target="target"
        :clickCallback="(event) => emit('match-click', event, part.match!)"
        :index="index"
      >
        <!-- Case 2: The part was matched and a to prop was provided -->
        <router-link
          v-if="part.matched && to !== undefined"
          :to="`${to}${part.match!}`"
          :target="target"
          @click="emit('match-click', $event, part.match!)"
          class="hover:underline"
        >
          {{ part.text }}
        </router-link>
        <!-- Case 3: The part was matched but no to prop was provided -->
        <button v-else-if="part.matched" @click="emit('match-click', $event, part.match!)">
          {{ part.text }}
        </button>
      </slot>
      <!-- Case 4: The part was not matched -->
      <template v-else>{{ part.text }}</template>
    </template>
  </span>
</template>

<script setup lang="ts">
/**
 * A component to parse text and create router links for specific parts of the text
 */

import { ref, watch, toRefs, type VNode } from 'vue'

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

interface Slots {
  match(scope: {
    part: {
      text: string
      match?: string
      matched: boolean
    }
    to?: string
    target: string
    clickCallback: (event: MouseEvent) => void
    index: number
  }): VNode[]
}

const props = withDefaults(defineProps<Props>(), {
  target: '_self',
})

const emit = defineEmits<{
  'match-click': [event: MouseEvent, match: string]
}>()

defineSlots<Slots>()

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
