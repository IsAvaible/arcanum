<script setup lang="ts">
import ListTable from '@/components/ListTable.vue'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import CaseCreateDialog from '@/components/CaseCreateDialog.vue'

const route = useRoute()
const createDialogVisible = ref(false)

watch(
  () => route.path,
  (newPath) => {
    if (newPath === '/cases/create') {
      console.log('Opening create dialog')
      createDialogVisible.value = true
    }
  },
  { immediate: true },
)
</script>

<template>
  <ListTable />
  <CaseCreateDialog
    v-model:visible="createDialogVisible"
    @update:visible="$router.push('/cases')"
  />
</template>

<style scoped></style>
