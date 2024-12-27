<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import {
  Avatar,
  Button,
  IconField,
  InputIcon,
  InputText,
  SelectButton,
  ToggleSwitch,
  Menu,
  useToast,
} from 'primevue'
import { useApi } from '@/composables/useApi'
import { type Case, type Chat, type ChatWithMessages, type Message, MessageRoleEnum } from '@/api'
import CaseReference from '@/components/chat-view/CaseReference.vue'
import DynamicRouterLinkText from '@/components/misc/DynamicRouterLinkText.vue'
import { useDebounceFn } from '@vueuse/core'
import type { AxiosError } from 'axios'

const toast = useToast()

/**
 * Reactive references for chat settings and inputs.
 */
const notification = ref(true)
const sound = ref(false)
const saveToDownloads = ref(false)
const search = ref('')
const media = ref('Media')
const mediaOptions = ['Media', 'Link', 'Docs']
const messageInput = ref('')
const activeChat = ref<ChatWithMessages | null>(null)

/**
 * API instance for fetching and validating case references.
 */
const api = useApi()

/**
 * Regular expression to match case references like #10 in messages.
 */
const caseReferenceRegex = /#(\d+)(?:[,.\s]|$)/g

/**
 * Fetches and sets the chat data from the API.
 */
const chats = ref<Chat[] | null>(null)
const chatsLoading = ref(false)
const chatsError = ref<string | null>(null)
const fetchChats = async () => {
  chatsLoading.value = true
  try {
    chats.value = (await api.chatsGet()).data
  } catch (error) {
    chatsError.value = (error as AxiosError).message
  }
  chatsLoading.value = false
}

/**
 * Computed property for filtering chats based on the search input.
 */
const filteredChats = computed(() => {
  return chats.value?.filter(
    (chat: Chat) => chat.title?.toLowerCase().includes(search.value.toLowerCase()) ?? true,
  )
})

const filteredPinnedChats = computed(() => {
  // TODO
  return filteredChats.value?.filter((_chat: Chat) => false)
})

/**
 * Sets the active chat to the selected chat.
 * @param chatId - The ID of the chat to set as active.
 */
const setActiveChat = async (chatId: number) => {
  if (editingChatTitleList && selectedChatContextMenuChat.value?.id === chatId) {
    return
  }
  activeChat.value = (await api.chatsIdGet({ id: chatId })).data
}

/**
 * Deletes the active chat and resets the active chat state.
 */
const deleteChat = async (id: Chat['id']) => {
  try {
    await api.chatsIdDelete({ id })
    chats.value = chats.value?.filter((chat) => chat.id !== id) ?? []
    if (activeChat.value?.id === id) {
      activeChat.value = null
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Failed to delete chat',
      detail: (error as AxiosError).message,
      life: 3000,
    })
  }
}

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
      await deleteChat(selectedChatContextMenuChat.value!.id)
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

const saveChatTitle = async (id: Chat['id'], title: string): Promise<boolean> => {
  try {
    await api.chatsIdPut({ id, title })
    chats.value!.find((chat) => chat.id === id)!.title = title
    return true
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Failed to save chat title',
      detail: (error as AxiosError).message,
      life: 3000,
    })
    return false
  }
}

const invalidSubmissionAttempt = ref(false)
const pendingMessage = ref<(Message & { state: string }) | null>(null)
/**
 * Handles sending a message in the active chat.
 * Validates message input and appends it to the chat messages.
 */
const sendMessage = async () => {
  if (!messageInput.value.trim() || !activeChat.value || pendingMessage.value) {
    return
  }

  if (hasInvalidCaseReferences.value) {
    invalidSubmissionAttempt.value = false
    setTimeout(() => {
      invalidSubmissionAttempt.value = true
    }, 1)
    return
  }

  pendingMessage.value = {
    content: messageInput.value.trim(),
    state: 'pending',
    chatId: activeChat.value.id,
    role: MessageRoleEnum.User,
    timestamp: new Date().toISOString(),
    id: -1,
  }
  messageInput.value = ''
  await sendPendingMessage()
}

const sendPendingMessage = async () => {
  if (!pendingMessage.value || !activeChat.value) {
    return
  }
  try {
    activeChat.value.messages = (
      await api.chatsIdMessagesPost({
        id: activeChat.value!.id,
        content: pendingMessage.value!.content,
        socketId: 'TODO',
      })
    ).data
    pendingMessage.value = null
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Failed to send message',
      detail: (error as AxiosError).message,
      life: 1500,
    })
    pendingMessage.value!.state = 'failed'
  }
}

const createChatLoading = ref(false)
/**
 * Creates a new chat with a message.
 */
const createChatWithMessage = async () => {
  if (!messageInput.value || createChatLoading.value) {
    return
  }
  createChatLoading.value = true
  try {
    const { chatId } = (await api.chatsPost()).data
    activeChat.value = (await api.chatsIdGet({ id: chatId })).data
    chats.value = [activeChat.value, ...(chats.value ?? [])]
    await sendMessage()
    createChatLoading.value = false
  } catch (error) {
    console.error(error)
  }
}

const displayedMessages = computed<(Message & { state: string })[]>(() => {
  return (
    pendingMessage.value
      ? [...(activeChat.value?.messages ?? []), pendingMessage.value]
      : (activeChat.value?.messages ?? [])
  ) as (Message & { state: string })[]
})

watch(displayedMessages, () => {
  nextTick(() => {
    const chatWindow = document.querySelector('#chat-window')
    chatWindow?.scrollTo({
      top: chatWindow.scrollHeight,
    })
  })
})

/**
 * Case reference validation logic.
 */
const invalidCaseReferences = ref<number[]>([])
const validatedCaseReferences = ref<Map<number, boolean>>(new Map())
const isValidationInProgress = ref(false)

/**
 * Validates case references in the message input against the API.
 */
const validateCaseReferences = async () => {
  if (!messageInput.value) {
    invalidSubmissionAttempt.value = false
    invalidCaseReferences.value = []
    isValidationInProgress.value = false
    return
  }

  isValidationInProgress.value = true
  const caseReferences =
    Array.from(messageInput.value.matchAll(caseReferenceRegex)).map((match) => match[1]) || []
  const invalidRefs: number[] = []

  for (const ref of caseReferences) {
    const id = Number(ref)

    if (validatedCaseReferences.value.has(id)) {
      if (!validatedCaseReferences.value.get(id)) {
        invalidRefs.push(id)
      }
      continue
    }

    try {
      await api.casesIdGet({ id })
      validatedCaseReferences.value.set(id, true)
    } catch {
      invalidRefs.push(id)
      validatedCaseReferences.value.set(id, false)
    }
  }

  invalidCaseReferences.value = invalidRefs
  isValidationInProgress.value = false
}

/**
 * Debounced validation for case references to avoid excessive API calls.
 */
const debouncedValidateCaseReferences = useDebounceFn(validateCaseReferences, 500, { maxWait: 700 })

/**
 * Watches for changes in the message input to reset or trigger validation.
 */
watch(messageInput, (newValue) => {
  if (!newValue) {
    validatedCaseReferences.value.clear()
    invalidCaseReferences.value = []
  }
})
watch(messageInput, debouncedValidateCaseReferences)

/**
 * Computed property to check if there are invalid case references.
 */
const hasInvalidCaseReferences = computed(() => invalidCaseReferences.value.length > 0)

/**
 * Extracts and resolves case references from a given message.
 * @param message - The message containing case references.
 * @returns Array of case reference objects.
 */
const getCaseReferences = (message: string): { id: number; case: Promise<Case> }[] => {
  const caseReferences = message.match(caseReferenceRegex)

  return (
    caseReferences?.map((reference) => {
      const id = Number(reference.replace('#', ''))
      return {
        id,
        case: api.casesIdGet({ id }).then((response) => response.data),
      }
    }) || []
  )
}

/**
 * Computed property to aggregate case references from all messages in the active chat.
 */
const caseReferences = computed(() => {
  return displayedMessages.value.reduce(
    (acc, message) => {
      acc[message.id] = getCaseReferences(message.content)
      return acc
    },
    {} as Record<number, { id: number; case: Promise<Case> }[]>,
  )
})

onMounted(fetchChats)
</script>

<template>
  <div class="flex h-screen bg-white neutral-primary">
    <!-- Sidebar -->
    <div class="w-4/12 xl:w-3/12 min-w-40 overflow-auto flex flex-col gap-6 border-r px-5">
      <div class="flex flex-col gap-6 pt-3 pb-2 sticky top-0 bg-white z-10">
        <div class="flex items-center justify-between gap-6 text-gray-800">
          <h2 class="text-2xl font-medium lead">Chats</h2>
          <Button icon="pi pi-plus" text @click="activeChat = null" />
        </div>
      </div>
      <IconField>
        <InputText v-model="search" type="text" placeholder="Search for chats..." class="w-full" />
        <InputIcon class="pi pi-search" />
      </IconField>
      <div class="flex flex-col">
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
        <p v-if="chatsLoading" class="text-gray-500 text-center">Loading chats...</p>
        <p v-else-if="filteredPinnedChats?.length == 0" class="text-gray-500 text-center">
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
            'bg-gray-100':
              chat.id !== activeChat?.id && chat.id === selectedChatContextMenuChat?.id,
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
        <p v-if="chatsLoading" class="text-gray-500 text-center">Loading chats...</p>
        <p v-else-if="chatsError" class="text-red-500 text-center">{{ chatsError }}</p>
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

    <div class="w-8/12 xl:w-6/12 flex flex-col">
      <!-- Header -->
      <div
        v-if="activeChat"
        class="flex items-center justify-between p-4 gap-4 border-b border-gray-300 w-full"
      >
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
            {{ activeChat.title || 'Untitled Chat' }}
            <Button
              icon="pi pi-pencil"
              text
              size="small"
              severity="secondary"
              class="ml-2"
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
            v-for="icon in ['cog', 'trash', 'inbox']"
            :key="icon"
            variant="text"
            severity="secondary"
            size="small"
            :class="icon !== 'cog' ? '-ml-4' : ''"
          >
            <i :class="`pi pi-${icon} text-gray-800`"></i>
          </Button>
        </div>
      </div>
      <div v-else class="flex flex-col gap-y-4 p-4 items-center justify-center h-full">
        <h2 class="text-gray-700 text-2xl font-semibold">What can I help you with?</h2>
        <IconField class="w-full max-w-lg">
          <InputText
            v-model="messageInput"
            placeholder="Type a message"
            class="w-full"
            :disabled="createChatLoading"
            @keyup.enter="createChatWithMessage"
          />
          <InputIcon
            class="pi"
            :class="{
              'pi-spinner pi-spin': createChatLoading,
              'pi-send': !createChatLoading,
            }"
            @click="createChatWithMessage"
          />
        </IconField>
      </div>
      <!-- Chat Window -->
      <TransitionGroup
        v-if="activeChat"
        :key="activeChat?.id"
        name="pop-in"
        tag="div"
        id="chat-window"
        class="flex-1 overflow-y-auto flex flex-col gap-4 py-4 px-6"
      >
        <div
          v-for="message in displayedMessages"
          :key="message.id"
          class="flex items-center gap-2"
          :class="{ 'flex-row-reverse self-end': message.role === MessageRoleEnum.User }"
        >
          <Avatar
            :label="message.role === MessageRoleEnum.User ? 'You' : 'AI'"
            class="w-10 h-10 bg-gray-300"
            shape="circle"
          />
          <div
            :class="{
              'bg-gray-50 text-gray-800': message.role === MessageRoleEnum.Assistant,
              'bg-primary-500 text-white': message.role === MessageRoleEnum.User,
              'bg-red-700': message.state === 'failed',
            }"
            class="px-4 py-2 rounded-lg shadow-sm w-fit max-w-xs flex flex-col gap-y-2"
          >
            <p>
              <DynamicRouterLinkText
                :text="message.content"
                :regex="caseReferenceRegex"
                to="/cases/"
              />
            </p>
            <CaseReference
              v-for="caseReference in caseReferences[message.id] || []"
              :key="caseReference.id"
              :reference="caseReference"
              class="min-w-40"
              :class="{
                'bg-gray-100': message.role === MessageRoleEnum.Assistant,
                'bg-white': message.role === MessageRoleEnum.User,
              }"
            />
          </div>
          <button
            v-if="message.state === 'failed'"
            @click="sendPendingMessage"
            class="pi pi-undo"
          ></button>
        </div>
      </TransitionGroup>
      <div
        v-if="activeChat"
        class="p-4 border-t border-gray-300 flex items-center gap-1 bg-white relative"
      >
        <Button variant="text" severity="secondary" rounded size="small" class="-ml-2">
          <i class="pi pi-face-smile" style="font-size: 1.2rem; color: black"></i>
        </Button>

        <Button variant="text" severity="secondary" rounded size="small" class="-ml-2">
          <i class="pi pi-paperclip" style="font-size: 1.2rem; color: black"></i>
        </Button>

        <InputText
          v-model="messageInput"
          placeholder="Type a message"
          class="w-full"
          @keyup.enter="sendMessage"
        />

        <!-- Case Reference Validation Overlay -->
        <Transition name="fade">
          <div
            v-if="hasInvalidCaseReferences"
            class="absolute bottom-full left-0 right-0 mx-8 mb-2 z-10"
            :class="{ shake: invalidSubmissionAttempt }"
          >
            <div
              class="bg-red-50 border border-red-400 text-red-900 px-4 py-2 rounded shadow-md flex items-center"
            >
              <i class="pi pi-exclamation-triangle mr-2"></i>
              <span>
                Your message contains{{ invalidCaseReferences.length > 1 ? '' : ' an' }} invalid
                case reference{{ invalidCaseReferences.length > 1 ? 's' : '' }}: #{{
                  invalidCaseReferences.join(', #')
                }}
              </span>
            </div>
          </div>
        </Transition>

        <!-- Send-Icon -->
        <Button variant="text" class="ml-2">
          <i class="pi text-primary-700 text-xl pi-send" @click="sendMessage"></i>
        </Button>
      </div>
    </div>

    <!-- User Details -->
    <div class="w-3/12 min-w-[300px] border-l border-gray-300 bg-white px-4 py-6 flex flex-col">
      <div class="flex flex-col items-center">
        <!-- Avatar -->
        <Avatar label="AI" class="w-24 h-24 mb-4" shape="circle" />

        <div v-if="activeChat" class="text-gray-800 font-medium text-xl">
          {{ activeChat.title }}
        </div>
        <div v-else class="text-gray-500 text-center">No chat selected.</div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-center gap-3 my-6">
        <Button variant="text" severity="secondary">
          <i class="pi pi-phone" style="font-size: 1.2rem; color: #333"></i>
        </Button>
        <Button variant="text" severity="secondary">
          <i class="pi pi-video" style="font-size: 1.2rem; color: #333"></i>
        </Button>
        <Button variant="text" severity="secondary">
          <i class="pi pi-sign-out" style="font-size: 1.2rem; color: #333"></i>
        </Button>
        <Button variant="text" severity="secondary">
          <i class="pi pi-info-circle" style="font-size: 1.2rem; color: #333"></i>
        </Button>
        <Button variant="text" severity="secondary">
          <i class="pi pi-ellipsis-h" style="font-size: 1.2rem; color: #333"></i>
        </Button>
      </div>

      <!-- Toggles -->
      <div class="mt-4">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <i class="pi pi-bell" style="font-size: 1.2rem; color: #333"></i>
            <span class="text-gray-800 text-sm">Notification</span>
          </div>
          <ToggleSwitch v-model="notification" />
        </div>

        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <i class="pi pi-volume-up" style="font-size: 1.2rem; color: #333"></i>
            <span class="text-gray-800 text-sm">Sound</span>
          </div>
          <ToggleSwitch v-model="sound" />
        </div>

        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <i class="pi pi-download" style="font-size: 1.2rem; color: #333"></i>
            <span class="text-gray-800 text-sm">Save to downloads</span>
          </div>
          <ToggleSwitch v-model="saveToDownloads" />
        </div>
      </div>

      <!-- Tabs -->
      <div class="mt-4">
        <SelectButton v-model="media" class="w-full flex [&>*]:w-full" :options="mediaOptions" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
  opacity: 1;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }

  25% {
    transform: translateX(-5px);
  }

  50% {
    transform: translateX(5px);
  }

  75% {
    transform: translateX(-5px);
  }
}

.shake {
  animation: shake 0.5s ease-in-out;
}

.pop-in-enter-active,
.pop-in-leave-active {
  transition: all 0.3s ease;
}

.pop-in-enter-from,
.pop-in-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.pop-in-enter-to,
.pop-in-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
