<script setup lang="ts">
import { Button, IconField, InputIcon, InputText, Menu } from 'primevue'
import { computed, ref, useTemplateRef, nextTick, toRefs } from 'vue'
import { type Chat } from '@/api'

interface Props {
  activeChat: Chat | null
  chats: Chat[] | null
  chatsLoading: boolean
  chatsError: string | null
  setActiveChat: (chatId: Chat['id'] | null) => Promise<void>
  displayDeleteChatDialog: (chatId: Chat['id']) => void
  saveChatTitle: (chatId: Chat['id'], title: string) => Promise<boolean>
}

const props = withDefaults(defineProps<Props>(), {
  activeChat: null,
  chats: null,
  chatsError: null,
  chatsLoading: true,
})

const { activeChat, chats, chatsError, chatsLoading } = toRefs(props)
const { setActiveChat: setActiveChatInner, displayDeleteChatDialog, saveChatTitle } = props

const emit = defineEmits(['refreshChats'])

const search = ref('')

/**
 * Computed property for filtering chats based on the search input.
 */
const filteredChats = computed(() => {
  return chats.value?.filter(
    (chat: Chat) => chat.title?.toLowerCase().includes(search.value?.toLowerCase()) ?? true,
  )
})

/**
 * Computed property for filtering pinned chats based on the search input.
 */
const filteredPinnedChats = computed(() => {
  // TODO
  return filteredChats.value?.filter((_chat: Chat) => false)
})

/**
 * Context menu items for chats.
 */
const chatContextMenuItems = ref([
  {
    label: 'Pin Chat',
    icon: 'pi pi-thumbtack',
  },
  {
    label: 'Edit Title',
    icon: 'pi pi-pencil',
    command: () => {
      const chat = selectedChatContextMenuChat.value
      newChatTitleList.value = chat!.title ?? ''
      editingChatTitleListLoading.value = false
      editingChatTitleList.value = true
      nextTick(() => {
        selectedChatContextMenuChat.value = chat
        nextTick(() => {
          const input = document.getElementById('editingChatTitleInput') as HTMLInputElement
          input?.focus()
        })
      })
    },
  },
  {
    label: 'Delete Chat',
    icon: 'pi pi-trash',
    command: async () => {
      chatContextMenuItems.value[2].icon = 'pi pi-spinner pi-spin'
      displayDeleteChatDialog(selectedChatContextMenuChat.value!.id)
      chatContextMenuItems.value[2].icon = 'pi pi-trash'
    },
  },
])
const chatContextMenu = useTemplateRef('chatContextMenu')
const selectedChatContextMenuChat = ref<Chat | null>(null)
const openChatContextMenu = (event: MouseEvent, selectedChat: Chat) => {
  editingChatTitleList.value = false
  selectedChatContextMenuChat.value = selectedChat
  chatContextMenu.value!.toggle(event)
}

/**
 * Reactive references for editing chat title in the list
 */
const editingChatTitleList = ref(false)
const editingChatTitleListLoading = ref(false)
const newChatTitleList = ref('')

/**
 * Saves the edited chat title in the list.
 */
const saveChatTitleList = async () => {
  editingChatTitleListLoading.value = true
  if (await saveChatTitle(selectedChatContextMenuChat.value!.id, newChatTitleList.value)) {
    editingChatTitleList.value = false
  }
  selectedChatContextMenuChat.value = null
  editingChatTitleListLoading.value = false
}

/**
 * Cancels the chat title edit in the list.
 */
const cancelChatTitleListEdit = () => {
  selectedChatContextMenuChat.value = null
  editingChatTitleList.value = false
}

/**
 * Wrapper for the setActiveChat function to prevent setting the active chat while editing the chat title.
 */
const setActiveChat = async (chatId: Chat['id'] | null) => {
  if (editingChatTitleList && selectedChatContextMenuChat.value?.id === chatId) {
    return
  }
  await setActiveChatInner(chatId)
}
</script>

<template>
  <div class="w-4/12 xl:w-3/12 min-w-40 overflow-auto flex flex-col gap-6 border-r px-5">
    <div class="flex flex-col gap-6 pt-3 pb-2 sticky top-0 bg-white z-10">
      <div class="flex items-center justify-between gap-6 text-gray-800">
        <h2 class="text-2xl font-medium lead">Chats</h2>
        <Button
          icon="pi pi-plus"
          text
          @click="setActiveChat(null)"
          :class="{
            'invisible pointer-events-none': activeChat === null,
          }"
        />
      </div>
    </div>
    <IconField>
      <InputText v-model="search" type="text" placeholder="Search for chats..." class="w-full" />
      <InputIcon class="pi pi-search" />
    </IconField>
    <div class="flex flex-col" v-if="!chatsError && !chatsLoading">
      <h3 class="uppercase text-slate-400 mb-4">Pinned</h3>
      <button
        v-for="chat in filteredPinnedChats"
        :key="chat.title"
        class="truncate w-full p-3 cursor-pointer hover:bg-gray-100 rounded-lg transition-all"
        :class="{
          'bg-gray-200': chat.id === activeChat?.id,
        }"
        @click="setActiveChat(chat.id)"
      >
        {{ chat.title ?? 'Untitled Chat' }}
      </button>
      <p v-if="filteredPinnedChats?.length == 0" class="text-gray-500 text-center">
        No pinned chats.
      </p>
    </div>
    <div class="flex-1 flex flex-col">
      <h3 class="uppercase text-slate-400 mb-4">Chat History</h3>
      <button
        v-for="chat in filteredChats"
        :key="chat.title"
        class="w-full p-3 cursor-pointer rounded-lg transition-all flex items-center justify-between group gap-x-1"
        :class="{
          'hover:bg-gray-100': chat.id !== activeChat?.id,
          'bg-gray-200': chat.id === activeChat?.id,
          'bg-gray-100': chat.id !== activeChat?.id && chat.id === selectedChatContextMenuChat?.id,
        }"
        @click="setActiveChat(chat.id)"
      >
        <template v-if="!editingChatTitleList || chat.id !== selectedChatContextMenuChat?.id">
          <span class="truncate">
            {{ chat.title || 'Untitled Chat' }}
          </span>
          <button
            :class="{
              'opacity-0 group-hover:opacity-30 hover:!opacity-100': chat.id !== activeChat?.id,
              'opacity-100': selectedChatContextMenuChat?.id === chat.id,
            }"
            @click.stop="openChatContextMenu($event, chat)"
            class="pi pi-ellipsis-h text-gray-500 hover:text-gray-800 transition-opacity"
          ></button>
        </template>
        <template v-else>
          <input
            placeholder="Type a title"
            v-model="newChatTitleList"
            id="editingChatTitleInput"
            class="focus:outline-none focus:border-gray-700 border-b border-gray-300 flex-1 min-w-0"
            @keyup.enter="saveChatTitleList"
            @keyup.esc="cancelChatTitleListEdit"
          />
          <button
            @click.stop="saveChatTitleList"
            :class="{
              'pi pi-spinner pi-spin': editingChatTitleListLoading,
              'pi pi-check': !editingChatTitleListLoading,
            }"
            class="text-gray-500 hover:text-gray-700 transition-colors px-1"
          />
          <button
            @click.stop="cancelChatTitleListEdit"
            class="pi pi-times text-gray-500 hover:text-gray-700 transition-colors"
          />
        </template>
      </button>
      <p v-if="chatsLoading" class="text-gray-500 text-center animate-pulse">Loading chats...</p>
      <div class="flex flex-col gap-y-2" v-else-if="chatsError">
        <div class="text-center bg-red-50 rounded-lg p-4">
          <p class="text-red-500 font-semibold">Failed to load chats.</p>
          <p class="text-slate-700 text-sm">Please check your connection and try again.</p>
        </div>
        <Button
          label="Retry"
          icon="pi pi-refresh"
          @click="emit('refreshChats')"
          outlined
          severity="secondary"
        />
      </div>
      <p v-else-if="filteredChats?.length == 0" class="text-gray-500 text-center">
        No chats found.
      </p>
    </div>
    <Menu
      ref="chatContextMenu"
      popup
      :model="chatContextMenuItems"
      @hide="selectedChatContextMenuChat = null"
    />
  </div>
</template>

<style scoped></style>
