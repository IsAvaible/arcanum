<script setup lang="ts">
import ListTable from '@/components/ListTable.vue'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import CaseCreateDialog from '@/components/CaseCreateDialog.vue'
import CaseFromFileModal from '@/components/CaseFromFileModal.vue'

const route = useRoute()
const createDialogVisible = ref(false)
const createManualDialogVisible = ref(false)

watch(
  () => route.name,
  (name) => {
    switch (name) {
      case 'case-create':
        createDialogVisible.value = true
        break
      case 'case-create-manual':
        createManualDialogVisible.value = true
        break
    }
  },
  { immediate: true },
)
</script>

<template>
  <ListTable />
  <CaseFromFileModal
    v-model:visible="createDialogVisible"
    @update:visible="$router.push({ name: 'cases' })"
  />
  <CaseCreateDialog
    v-model:visible="createManualDialogVisible"
    @update:visible="$router.push({ name: 'cases' })"
  />
</template>

<style scoped></style>
