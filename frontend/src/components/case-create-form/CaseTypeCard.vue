<script setup lang="ts">
const props = defineProps<{
  title: string
  description: string
  selected: boolean
}>()
</script>

<template>
  <div
    class="flex gap-x-6 group border-none border-0 flex-1 min-w-60 hover:cursor-pointer outline-none"
    @click="$emit('click')"
    @keyup.enter="$emit('click')"
    role="button"
    tabindex="0"
    :aria-selected="props.selected"
  >
    <div
      :class="[
        'flex flex-col justify-between p-4 gap-y-4 bg-white rounded-lg ring-[1.5px] ring-inset transition-colors',
        props.selected
          ? 'ring-blue-500 group-hover:ring-blue-700 group-focus-within:ring-blue-700'
          : 'ring-slate-200 group-hover:ring-slate-300 group-focus-within:ring-slate-500',
      ]"
    >
      <header class="flex items-start justify-between w-full">
        <div
          :class="[
            'inline-flex items-center gap-2.5 p-2.5 rounded-lg ring-1',
            props.selected
              ? 'bg-blue-500 ring-blue-500 text-white'
              : 'ring-slate-200 text-slate-800',
          ]"
        >
          <slot />
        </div>

        <div
          :class="[
            'rounded-full ring-1 size-6 p-0.5 transition-colors',
            props.selected
              ? 'ring-blue-500 group-hover:ring-blue-600 group-focus-within:ring-blue-600'
              : 'ring-slate-200 group-hover:ring-slate-300 group-focus-within:ring-slate-300',
          ]"
        >
          <div
            class="rounded-full size-full transition-colors"
            :class="[
              'rounded-full size-full transition-colors',
              props.selected ? 'bg-blue-500 group-hover:bg-blue-600' : 'bg-white',
            ]"
          ></div>
        </div>
      </header>

      <div class="flex flex-col items-start w-full">
        <h3 class="font-semibold text-black text-base leading-6">{{ props.title }}</h3>

        <p class="font-normal text-black text-xs text-start">
          {{ props.description }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
