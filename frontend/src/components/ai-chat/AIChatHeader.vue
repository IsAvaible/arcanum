<script setup lang="ts">
import { Button, InputText } from 'primevue'
import { ref, toRefs } from 'vue'
import { type Chat } from '@/api'

interface Props {
  activeChat: Chat | null
  displayDeleteChatDialog: (chatId: Chat['id']) => void
  saveChatTitle: (chatId: Chat['id'], title: string) => Promise<boolean>
}

const props = withDefaults(defineProps<Props>(), {
  activeChat: null,
})

const { activeChat } = toRefs(props)
const { displayDeleteChatDialog, saveChatTitle } = props

/**
 * Reactive references for editing chat title in the header
 */
const editingChatTitleHeader = ref(false)
const editingChatTitleHeaderLoading = ref(false)
const newChatTitleHeader = ref('')

/**
 * Saves the edited chat title in the header.
 */
const saveChatTitleHeader = async () => {
  if (!activeChat.value) return
  editingChatTitleHeaderLoading.value = true
  if (await saveChatTitle(activeChat.value.id, newChatTitleHeader.value)) {
    editingChatTitleHeader.value = false
  }
  editingChatTitleHeaderLoading.value = false
}
</script>

<template>
  <div class="flex items-center justify-between p-4 gap-4 border-b border-gray-300 w-full">
    <div class="text-gray-800 font-medium flex items-center">
      <template v-if="editingChatTitleHeader">
        <InputText
          v-model="newChatTitleHeader"
          placeholder="Type a title"
          class="mr-2 min-w-0"
          size="small"
          @keyup.enter="saveChatTitleHeader"
        />
        <Button
          :icon="editingChatTitleHeaderLoading ? 'pi pi-spinner pi-spin' : 'pi pi-check'"
          @click="saveChatTitleHeader"
          text
          size="small"
          severity="secondary"
        />
        <Button
          icon="pi pi-times"
          @click="editingChatTitleHeader = false"
          text
          size="small"
          severity="secondary"
        />
      </template>
      <template v-else>
        {{ activeChat ? activeChat!.title || 'Untitled Chat' : 'Loading...' }}
        <Button
          icon="pi pi-pencil"
          text
          size="small"
          severity="secondary"
          class="ml-2"
          v-if="activeChat !== null"
          @click="
            () => {
              editingChatTitleHeader = true
              editingChatTitleHeaderLoading = false
              newChatTitleHeader = activeChat?.title ?? ''
            }
          "
        />
      </template>
    </div>
    <div class="flex items-center gap-3">
      <Button
        v-for="(button, index) in [
          { icon: 'pi-share-alt', description: 'Share Chat' },
          {
            icon: 'pi-trash',
            action: () => displayDeleteChatDialog(activeChat!.id),
            description: 'Delete Chat',
          },
          { icon: 'pi-cog', description: 'Settings' },
        ]"
        :key="button.icon"
        variant="text"
        severity="secondary"
        size="small"
        @click="button.action"
        :disabled="activeChat === null"
        class="[&:not(:first-child)]:-ml-4"
        :aria-label="button.description"
        v-tooltip.bottom="{ value: button.description, showDelay: 1000 }"
      >
        <i :class="`pi ${button.icon} text-gray-800`"></i>
      </Button>
    </div>
  </div>
</template>

<style scoped></style>
