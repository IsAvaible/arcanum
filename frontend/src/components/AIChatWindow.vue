<script setup lang="ts">
/// Imports and Dependencies
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import {
  Avatar,
  Button,
  IconField,
  InputIcon,
  InputText,
  Textarea,
  SelectButton,
  ToggleSwitch,
  ContextMenu,
  Skeleton,
  useToast,
} from 'primevue'
import { useApi } from '@/composables/useApi'
import {
  type Attachment,
  type Case,
  type Chat,
  type ChatWithMessages,
  type Message,
  MessageRoleEnum,
  type ModelError,
} from '@/api'
import CaseReferenceComponent from '@/components/chat-view/CaseReference.vue'
import FileReferenceComponent from '@/components/chat-view/FileReference.vue'
import { useDebounceFn } from '@vueuse/core'
import type { AxiosError } from 'axios'
import { useConfirm } from 'primevue/useconfirm'
import AIChatSidebar from '@/components/ai-chat/AIChatSidebar.vue'
import AIChatHeader from '@/components/ai-chat/AIChatHeader.vue'
import { useRoute, useRouter } from 'vue-router'
import type { MenuItem } from 'primevue/menuitem'
import { io, Socket } from 'socket.io-client'
import { BASE_PATH as BACKEND_API_BASE_PATH } from '@/api/base'
import { MdPreview } from 'md-editor-v3'
import FilePreview from '@/components/file-handling/FilePreview.vue'
import { useAttachmentLoading } from '@/composables/useAttachmentLoading'

/// Reactive State Variables
const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

/// Chat Settings and Inputs
/** Reactive references for chat settings and inputs. */
const notification = ref(true)
const sound = ref(false)
const saveToDownloads = ref(false)
const media = ref('Media')
const mediaOptions = ['Media', 'Link', 'Docs']
const messageInput = ref('')
const activeChat = ref<ChatWithMessages | null>(null)

/// API Instance
/** API instance for fetching and validating case references. */
const api = useApi()

/// Socket Connection
/** Socket connection for real-time chat updates. */
const socket = ref<Socket | null>(null)

/// Regex Constants
/** Regular expression to match case references like [case:10] in messages. */
const caseReferenceRegex = /\[case:(\d+)]/g
type CaseReference = { id: number; case: Promise<Case> }
/** Regular expression to match file references like [file:10] in messages. */
const fileReferenceRegex = /\[file:(\d+)]/g
type FileReference = { id: number; attachment: Promise<Attachment> }

/// Chat Data Management
/** State variables for chat data. */
const chats = ref<Chat[] | null>(null)
const chatsLoading = ref(false)
const chatLoading = ref(false)
const chatsError = ref<string | null>(null)

/** Fetches and sets the chat data from the API. */
const fetchChats = async () => {
  chatsLoading.value = true
  try {
    chats.value = (await api.chatsGet()).data
    chatsError.value = null
  } catch (error) {
    console.error(error)
    chatsError.value =
      ((error as AxiosError).response?.data as ModelError)?.message ?? (error as AxiosError).message
  }
  chatsLoading.value = false
}

const registerSocket = async () => {
  if (socket.value) {
    // Disconnect the existing socket
    socket.value.disconnect()
  }
  socket.value = io(BACKEND_API_BASE_PATH.replace(/(.*?)(\/api)(.*)/, '$1$3'), {
    rejectUnauthorized: false,
  })

  // Return a promise that resolves when the socket is connected
  return new Promise<void>((resolve) => {
    socket.value!.on('connect', () => {
      socket.value!.on('llm_message', (data: { message: string }) => {
        // do not react to LLM messages if we are not in a generating state
        if (pendingLLMMessage.value == null) return
        pendingLLMMessage.value.content = data.message
      })

      socket.value!.on('llm_end', (_data: { message: string }) => {
        // pendingLLMMessage.value = null
      })

      resolve()
    })
  })
}

/**
 * Sets the active chat to the selected chat.
 * @param chatId - The ID of the chat to set as active.
 */
const setActiveChat = async (chatId: Chat['id'] | null) => {
  if (chatId === null) {
    activeChat.value = null
    if (route.params.chatId) {
      await router.push('/ai')
    }
    selectedFile.value = pendingMessage.value = pendingLLMMessage.value = null
  } else {
    chatLoading.value = true
    try {
      activeChat.value = (await api.chatsIdGet({ id: chatId })).data
      selectedFile.value = pendingMessage.value = pendingLLMMessage.value = null
      registerSocket()

      if (!route.params.chatId || Number(route.params.chatId) !== chatId) {
        await router.push(`/ai/${chatId}`)
      }

      await nextTick(() => {
        const messageInput = document.getElementById('message-input')
        messageInput?.focus()
      })
    } catch (error) {
      throw error
    } finally {
      chatLoading.value = false
    }
  }
}

/**
 * Deletes the active chat and resets the active chat state.
 */
const deleteChat = async (id: Chat['id']) => {
  try {
    await api.chatsIdDelete({ id })
    chats.value = chats.value?.filter((chat) => chat.id !== id) ?? []
    if (activeChat.value?.id === id) {
      await router.push('/ai')
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Failed to delete chat',
      detail:
        ((error as AxiosError).response?.data as ModelError)?.message ??
        (error as AxiosError).message,
      life: 3000,
    })
  }
}

/// Chat Deletion
/**
 * Displays a confirmation dialog before deleting a chat.
 * @param id - The ID of the chat to delete.
 */
const displayDeleteChatDialog = (id: Chat['id']) => {
  const chat = chats.value?.find((chat) => chat.id === id)
  confirm.require({
    message:
      'Are you sure you want to permanently delete ' +
      (chat?.title ? `the chat called "${chat?.title}"?` : 'this chat?'),
    header: 'Confirm Deletion',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancel',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Delete',
      severity: 'danger',
    },
    accept: async () => {
      await deleteChat(id)
    },
    reject: () => {},
  })
}

/// Chat Title Management
/**
 * Saves the chat title to the API and updates the local state.
 * @param id - The ID of the chat to update.
 * @param title - The new title for the chat.
 * @returns True if the chat title was saved successfully.
 */
const saveChatTitle = async (id: Chat['id'], title: string): Promise<boolean> => {
  try {
    await api.chatsIdPut({ id, title })
    chats.value!.find((chat) => chat.id === id)!.title = title
    if (activeChat.value?.id === id) {
      activeChat.value!.title = title
    }
    return true
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Failed to save chat title',
      detail:
        ((error as AxiosError).response?.data as ModelError)?.message ??
        (error as AxiosError).message,
      life: 3000,
    })
    return false
  }
}

/// Message Context Menu
/** Context menu items for messages. */
const messageContextMenuCopyItem = ref<MenuItem>({
  label: 'Copy',
  icon: 'pi pi-copy',
  command: () => {
    navigator.clipboard.writeText(selectedContextMenuMessage.value!.content)
  },
})
const messageContextMenuDeleteItem = ref<MenuItem>({
  label: 'Delete',
  icon: 'pi pi-trash',
  command: () => {
    deleteMessage(selectedContextMenuMessage.value!.id)
  },
})
const messageContextMenuEditItem = ref<MenuItem>({
  label: 'Edit',
  icon: 'pi pi-pencil',
  command: () => {
    startEditingMessage(selectedContextMenuMessage.value!)
  },
})
const messageContextMenuItems = computed<MenuItem[]>(() => [
  messageContextMenuCopyItem.value,
  messageContextMenuDeleteItem.value,
  messageContextMenuEditItem.value,
])
const messageContextMenu = useTemplateRef('messageContextMenu')
const selectedContextMenuMessage = ref<Message | null>(null)

/**
 * Opens the message context menu.
 */
const openMessageContextMenu = (event: MouseEvent, message: Message) => {
  selectedContextMenuMessage.value = message
  messageContextMenuEditItem.value.visible = message.role === MessageRoleEnum.User
  messageContextMenu.value!.show(event)
}

/// Message Sending
const invalidSubmissionAttempt = ref(false)
const pendingMessage = ref<(Message & { state: string }) | null>(null)
const pendingLLMMessage = ref<(Message & { state: string }) | null>(null)
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

  if (!editingMessage.value) {
    // Sending a new message
    pendingMessage.value = {
      content: messageInput.value.trim(),
      state: 'pending',
      chatId: activeChat.value.id,
      role: MessageRoleEnum.User,
      timestamp: new Date().toISOString(),
      id: -1,
    }
    messageInput.value = ''
    pendingLLMMessage.value = {
      content: '',
      state: 'generating',
      chatId: activeChat.value!.id,
      role: MessageRoleEnum.Assistant,
      timestamp: new Date().toISOString(),
      id: -2,
    }
    await sendPendingMessage()
  } else {
    // Editing a message
    const editedMessage = editingMessage.value
    const originalContent = editedMessage.content
    const editedContent = messageInput.value
    try {
      // Update the UI
      messageInput.value = messageInput.value.trim()
      editingMessage.value.content = messageInput.value
      editingMessage.value.state = 'pending'
      editingMessage.value = null
      showEditPopup.value = false
      messageInput.value = originalMessageInput.value

      // Send the edited message to the API
      activeChat.value.messages = (
        await api.chatsChatIdMessagesMessageIdPut({
          chatId: activeChat.value.id,
          messageId: editedMessage.id,
          content: editedContent,
        })
      ).data
      pendingMessage.value = pendingLLMMessage.value = null

      // Remove the pending state if the message was sent successfully
      editedMessage.state = undefined
    } catch (error) {
      // Handle errors and revert the changes
      toast.add({
        severity: 'error',
        summary: 'Failed to edit message',
        detail:
          ((error as AxiosError).response?.data as ModelError)?.message ??
          (error as AxiosError).message,
        life: 3000,
      })
      startEditingMessage(editedMessage)
      editingMessage.value!.content = originalContent
    }
  }
}

/** Sends the pending message to the API. */
const sendPendingMessage = async () => {
  if (!pendingMessage.value || !activeChat.value) {
    return
  }
  try {
    const { userMessage, assistantMessage } = (
      await api.chatsIdMessagesPost({
        id: activeChat.value!.id,
        content: pendingMessage.value!.content,
        socketId: socket.value?.connected ? socket.value!.id! : '-1',
      })
    ).data
    activeChat.value.messages.push(userMessage, assistantMessage)
    pendingMessage.value = pendingLLMMessage.value = null
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Failed to send message',
      detail:
        ((error as AxiosError).response?.data as ModelError)?.message ??
        (error as AxiosError).message,
      life: 1500,
    })
    pendingMessage.value!.state = 'failed'
  }
}

/// Message Deletion
const deletingMessage = ref(false)
/**
 * Deletes a message from the active chat.
 * @param id - The ID of the message to delete.
 */
const deleteMessage = async (id: Message['id']) => {
  if (!activeChat.value) {
    return
  }
  deletingMessage.value = true
  try {
    await api.chatsChatIdMessagesMessageIdDelete({ chatId: activeChat.value.id, messageId: id })
    activeChat.value.messages = activeChat.value.messages.filter((message) => message.id !== id)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Failed to delete message',
      detail:
        ((error as AxiosError).response?.data as ModelError)?.message ??
        (error as AxiosError).message,
      life: 1500,
    })
  } finally {
    deletingMessage.value = false
  }
}

/// Chat Creation
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
    const chat = (await api.chatsPost()).data
    chats.value = [chat, ...(chats.value ?? [])]
    await router.push(`/ai/${chat.id}`)
    activeChat.value = { ...chat, messages: [] }
    await registerSocket()
    await sendMessage()
    createChatLoading.value = false
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Failed to create chat',
      detail:
        ((error as AxiosError).response?.data as ModelError)?.message ??
        (error as AxiosError).message,
      life: 3000,
    })
    console.error(error)
    createChatLoading.value = false
  }
}

/// Displayed Messages
/** Computed property to display messages including pending ones. */
const displayedMessages = computed<(Message & { state: string })[]>(() => {
  return [
    ...(activeChat.value?.messages ?? []),
    ...(pendingMessage.value ? [pendingMessage.value] : []),
    ...(pendingLLMMessage.value?.content ? [pendingLLMMessage.value] : []),
  ] as (Message & { state: string })[]
})

watch(displayedMessages, () => {
  nextTick(() => {
    const chatWindow = document.querySelector('#chat-window')
    chatWindow?.scrollTo({
      top: chatWindow.scrollHeight,
    })
  })
})

/// Message Editing
const originalMessageInput = ref('')
const editingMessage = ref<(Message & { state?: string }) | null>(null)
const showEditPopup = ref(false)

/**
 * Starts editing a message in the chat.
 * @param message The message to edit.
 */
const startEditingMessage = (message: Message) => {
  originalMessageInput.value = messageInput.value
  messageInput.value = message.content
  editingMessage.value = message
  showEditPopup.value = true
}

/**
 * Cancels editing a message and reverts the changes.
 */
const cancelEditingMessage = () => {
  messageInput.value = originalMessageInput.value
  editingMessage.value = null
  showEditPopup.value = false
}

/// Case Reference Validation
/** Case reference validation logic. */
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

/** Computed property to check if there are invalid case references. */
const hasInvalidCaseReferences = computed(() => invalidCaseReferences.value.length > 0)

/// Case References in Messages
/**
 * Extracts and resolves case references from a given message.
 * @param message - The message containing case references.
 * @returns Array of case reference objects.
 */
const getCaseReferences = (message: string): CaseReference[] => {
  const caseReferences = message.matchAll(caseReferenceRegex)

  const caseIds = [...new Set([...caseReferences].map((match) => Number(match[1])))]
  return caseIds.map((id) => ({
    id,
    case: api.casesIdGet({ id }).then((response) => response.data),
  }))
}

/**
 * Computed property to aggregate case references from all messages in the active chat.
 */
const caseReferences = computed<Record<number, CaseReference[]>>(() => {
  return displayedMessages.value.reduce((acc: Record<number, CaseReference[]>, message) => {
    acc[message.id] = getCaseReferences(message.content)
    return acc
  }, {})
})

/** Extracts and resolves file references from a given message. */
const getFileReferences = (message: string): FileReference[] => {
  const fileRefs = message.matchAll(fileReferenceRegex)
  const fileIds = [...new Set([...fileRefs].map((match) => Number(match[1])))]
  return fileIds.map((id) => ({
    id,
    attachment: api
      .casesAttachmentsAttachmentIdGet({ attachmentId: id })
      .then((response) => response.data),
  }))
}

/** Computed property to aggregate file references from all messages in the active chat. */
const fileReferences = computed<Record<number, FileReference[]>>(() => {
  return displayedMessages.value.reduce((acc: Record<number, FileReference[]>, message) => {
    acc[message.id] = getFileReferences(message.content)
    return acc
  }, {})
})

/// File Preview Drawer Logic
const { selectedFile, filePreviewVisible, loadingAttachmentId, openAttachmentPreview } =
  useAttachmentLoading()

/// Lifecycle Hooks
onMounted(async () => {
  if (route.params.chatId) {
    chatLoading.value = true
  } else {
    nextTick(() => {
      const newChatInput = document.getElementById('new-chat-input')
      newChatInput?.focus()
    })
  }
  await fetchChats()

  /**
   * Watches for route changes and loads the chat based on the route parameter
   */
  watch(
    () => route.params.chatId,
    async (newChatId) => {
      if (createChatLoading.value) return
      if (newChatId) {
        try {
          await setActiveChat(Number(newChatId))
        } catch (error) {
          toast.add({
            severity: 'error',
            summary: 'Failed to load chat',
            detail: 'The requested chat could not be found',
            life: 3000,
          })
          console.error(error)
          await router.push('/ai')
        }
      } else {
        activeChat.value = null
        await nextTick(() => {
          const newChatInput = document.getElementById('new-chat-input')
          newChatInput?.focus()
        })
      }
    },
    { immediate: true },
  )
})
</script>

<template>
  <div class="flex h-screen bg-white">
    <!-- Sidebar -->
    <AIChatSidebar
      :active-chat="activeChat"
      :chats="chats"
      :chats-loading="chatsLoading"
      :chats-error="chatsError"
      :fetch-chats="fetchChats"
      :set-active-chat="setActiveChat"
      :display-delete-chat-dialog="displayDeleteChatDialog"
      :save-chat-title="saveChatTitle"
      @refresh-chats="fetchChats"
    />

    <div class="w-8/12 xl:w-6/12 flex flex-col">
      <!-- Header -->
      <AIChatHeader
        v-if="activeChat || chatLoading"
        :active-chat="activeChat"
        :save-chat-title="saveChatTitle"
        :display-delete-chat-dialog="displayDeleteChatDialog"
      />
      <!-- No Chat Selected -->
      <div v-else class="flex flex-col gap-y-4 p-4 items-center justify-center h-full">
        <h2 class="text-gray-700 text-2xl font-semibold">What can I help you with?</h2>
        <IconField class="w-full max-w-lg">
          <InputText
            id="new-chat-input"
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
        class="flex-1 overflow-y-auto flex flex-col gap-4 py-4 px-6 @container"
      >
        <!-- We use the index as the key for messages to avoid re-animating on state change. -->
        <div
          v-for="(message, index) in displayedMessages"
          :key="index"
          class="flex gap-2"
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
            class="px-4 py-2 rounded-lg shadow-sm w-fit max-w-xs @lg:max-w-sm @xl:max-w-md flex flex-col gap-y-2"
            @contextmenu.prevent="
              (event) => {
                if (message.id !== -1) openMessageContextMenu(event, message)
              }
            "
          >
            <!-- @vue-ignore class recognized as prop instead of html attribute -->
            <MdPreview
              :model-value="message.content"
              language="en-US"
              class="!bg-transparent [&>*]:!p-0 text-pretty [&_p]:!break-normal"
              :class="{
                '[&_*]:!text-gray-800': message.role === MessageRoleEnum.Assistant,
                '[&_*]:!text-white': message.role === MessageRoleEnum.User,
              }"
            />
            <CaseReferenceComponent
              v-for="caseReference in caseReferences[message.id] || []"
              :key="caseReference.id"
              :reference="caseReference"
              class="min-w-60"
              :class="{
                'bg-gray-100': message.role === MessageRoleEnum.Assistant,
                'bg-white': message.role === MessageRoleEnum.User,
              }"
            />
            <FileReferenceComponent
              v-for="fileReference in fileReferences[message.id] || []"
              :key="fileReference.id"
              :reference="fileReference"
              :fileLoading="loadingAttachmentId === fileReference.id"
              @click="openAttachmentPreview"
              class="min-w-60"
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
      <!-- Skeleton loader -->
      <div
        v-else-if="chatsLoading"
        class="flex-1 overflow-y-auto flex flex-col gap-4 py-4 px-6 @container"
      >
        <div
          class="flex gap-2"
          v-for="i in 6"
          :class="{
            'flex-row-reverse self-end': i % 2 !== 0,
          }"
        >
          <Avatar class="w-10 h-10 bg-gray-300" shape="circle" />
          <Skeleton
            :height="i % 2 !== 0 ? '2.5rem' : Math.floor(Math.random() * 10) + 5 + 'rem'"
            :width="i % 2 !== 0 ? Math.floor(Math.random() * 10) + 15 + 'rem' : '20rem'"
            class="rounded-lg shadow-sm max-w-xs @lg:max-w-sm @xl:max-w-md"
          />
        </div>
      </div>
      <ContextMenu
        ref="messageContextMenu"
        :model="messageContextMenuItems"
        @hide="selectedContextMenuMessage = null"
      />
      <!-- Message Input -->
      <div
        v-if="activeChat"
        class="p-4 border-t border-gray-300 flex items-center gap-1 bg-white relative"
      >
        <Button variant="text" severity="secondary" rounded size="small" class="-ml-2">
          <i class="pi pi-paperclip" style="font-size: 1.2rem; color: black"></i>
        </Button>

        <Textarea
          id="message-input"
          v-model="messageInput"
          placeholder="Type a message"
          class="w-full max-h-24"
          rows="1"
          autoResize
          @keydown.enter.prevent
          @keyup.enter="
            (event) => {
              if (!event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
                sendMessage()
              } else {
                messageInput += '\n'
              }
            }
          "
        />

        <div class="absolute bottom-full left-0 right-0 mb-2 z-10 mx-8">
          <div class="flex flex-wrap justify-center items-center gap-2">
            <!-- Edit Popup -->
            <Transition name="fade">
              <div
                v-if="showEditPopup"
                class="bg-primary-50 border border-primary-400 text-primary-900 px-4 py-2 rounded shadow-md flex items-center gap-2"
              >
                <i class="pi pi-pencil"></i>
                Editing message: "{{ editingMessage?.content }}"
                <button
                  @click="cancelEditingMessage"
                  class="flex items-center justify-center text-primary-600 hover:text-primary-900"
                >
                  <i class="pi pi-times text-sm"></i>
                </button>
              </div>
            </Transition>

            <!-- Case Reference Validation Overlay -->
            <Transition name="fade">
              <div
                v-if="hasInvalidCaseReferences"
                class=""
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
          </div>
        </div>

        <!-- Send-Icon -->
        <Button variant="text" class="ml-2">
          <i class="pi text-primary-700 text-xl pi-send" @click="sendMessage"></i>
        </Button>
      </div>
    </div>

    <!-- User Details -->
    <div
      class="w-3/12 min-w-[300px] border-l border-gray-300 bg-white px-4 py-6 hidden xl:flex flex-col h-full"
    >
      <div class="flex flex-col items-center">
        <!-- Avatar -->
        <Avatar label="AI" class="w-24 h-24 mb-4" shape="circle" />

        <div v-if="activeChat" class="text-gray-800 font-medium text-xl">
          {{ activeChat.title || 'Untitled Chat' }}
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
      <FilePreview class="flex-1 mt-4" :file="selectedFile!" v-if="filePreviewVisible" />
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

.pop-in-enter-active {
  transition: all 0.3s ease;
}

.pop-in-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.pop-in-enter-to {
  opacity: 1;
  transform: scale(1);
}
</style>
