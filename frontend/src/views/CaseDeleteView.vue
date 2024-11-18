<script setup lang="ts">
import CaseDeleteDialog from '@/components/CaseDeleteDialog.vue'

const deleteCase = async (title: string[]) => {
  console.log('Deleting case:', title)
}
</script>

<template>
  <CaseDeleteDialog titles="CRX-1" :onDelete="deleteCase" />
</template>

<style scoped></style>
