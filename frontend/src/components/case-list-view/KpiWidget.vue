<script setup lang="ts">
import Card from 'primevue/card'

interface Props {
  title: string
  value: string | number
  trend: number
  trendDescription: string
  icon: string
}

const _props = defineProps<Props>()
</script>

<template>
  <Card>
    <template #content>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-600">{{ title }}</h3>
          <p class="text-3xl font-bold text-primary-600">{{ value }}</p>
        </div>
        <i :class="`${icon} text-4xl text-primary-600`"></i>
      </div>
      <div class="mt-2 text-sm text-gray-500">
        <span v-if="!isNaN(trend)" :class="trend >= 0 ? 'text-green-500' : 'text-red-500'">
          {{ trend >= 0 ? '▲' : '▼' }} {{ Math.abs(trend) }}%
        </span>
        <span v-else> <i class="pi pi-spin pi-spinner text-xs"></i> 0% </span>
        {{ trendDescription }}
      </div>
    </template>
  </Card>
</template>

<style scoped></style>
