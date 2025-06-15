<script setup lang="ts">
import { ref } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import { WarningTriangleSolid } from '@iconoir/vue'
import { useVModel } from '@vueuse/core'
import type { Case } from '@/api'
import { useToast } from 'primevue'

const toast = useToast()
const dialog = ref()

interface Props {
  /** The title(s) of the case(s) to delete */
  cases: Case[]
  /** The function to call when the case is deleted */
  onDelete: (caseToDelete: Case) => Promise<void>
  /** The visibility of the dialog */
  visible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
})
const emit = defineEmits(['update:visible'])

const dialogVisible = useVModel(props, 'visible', emit)
const titles = ref<string[]>(props.cases.map((c) => `${c.title} (${c.id})`))
const confirm = ref(false)
const confirmMissing = ref(false)
const deleting = ref(false)

const deleteCase = async () => {
  if (!confirm.value) {
    confirmMissing.value = true
    return
  }

  deleting.value = true

  try {
    // Call the onDelete function for each case
    await Promise.all(props.cases.map(props.onDelete))

    toast.add({
      severity: 'success',
      summary: props.cases.length > 1 ? 'Cases Deleted' : 'Case Deleted',
      detail:
        props.cases.length > 1
          ? 'The cases have been successfully deleted.'
          : 'The case has been successfully deleted.',
      life: 3000,
    })
  } catch (_error) {
    deleting.value = false

    toast.add({
      severity: 'error',
      summary: 'Deletion Failed',
      detail: 'Failed to delete the case.',
      life: 3000,
    })
  }

  // Close the dialog
  dialogVisible.value = false
}
</script>

<template>
  <Dialog
    ref="dialog"
    v-model:visible="dialogVisible"
    :modal="true"
    :closable="false"
    class="p-6"
    :closeOnEscape="true"
    :dismissableMask="true"
  >
    <template #header>
      <div class="p-2 bg-surface-100 rounded-lg mx-auto">
        <WarningTriangleSolid class="text-slate-500 size-10" />
      </div>
    </template>

    <section class="max-w-sm flex flex-col gap-y-6 text-center">
      <div>
        <h3 class="font-semibold text-lg text-black">Confirm Deletion</h3>
        <p>Are you sure you want to delete the case{{ titles.length > 1 ? 's' : '' }}</p>
        <p>
          <strong>{{ titles.join(' & ') }}?</strong>
        </p>
        <p>This action is permanent and cannot be undone.</p>
      </div>

      <div class="flex flex-row gap-x-2 items-center justify-center">
        <Checkbox
          @click="confirmMissing = false"
          v-model="confirm"
          inputId="confirm"
          binary
          name="confirm"
          :invalid="confirmMissing"
        />
        <label for="confirm">I understand that this action is permanent</label>
      </div>
    </section>

    <template #footer>
      <div class="flex justify-center gap-2 w-full">
        <Button label="No, Cancel" @click="dialogVisible = false" severity="secondary" />
        <Button
          :disabled="deleting"
          :loading="deleting"
          label="Delete"
          @click="deleteCase"
          icon="pi pi-trash"
          loading-icon="pi pi-spin pi-spinner"
          class="bg-red-700 border-red-700 hover:enabled:bg-red-800 hover:enabled:border-red-800"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
:deep(.p-checkbox-checked) .p-checkbox-box {
  @apply bg-red-700 border-red-700;
}

:deep(.p-checkbox-checked:not(.p-disabled):has(.p-checkbox-input:hover)) .p-checkbox-box {
  @apply bg-red-700 border-red-800;
}

:deep(.p-checkbox:not(.p-disabled):has(.p-checkbox-input:focus-visible)) .p-checkbox-box {
  @apply outline-red-700;
}
</style>
