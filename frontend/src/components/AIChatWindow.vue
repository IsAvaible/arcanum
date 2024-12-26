<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  Avatar,
  Button,
  IconField,
  InputIcon,
  InputText,
  SelectButton,
  ToggleSwitch,
} from 'primevue'
import { useApi } from '@/composables/useApi'
import { type Case, type Chat, type ChatWithMessages, MessageRoleEnum } from '@/api'
import CaseReference from '@/components/chat-view/CaseReference.vue'
import DynamicRouterLinkText from '@/components/misc/DynamicRouterLinkText.vue'
import { useDebounceFn } from '@vueuse/core'
import type { AxiosError } from 'axios'

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
  console.log(chats.value)
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
  activeChat.value = (await api.chatsIdGet({ id: chatId })).data
}

const invalidSubmissionAttempt = ref(false)
const pendingMessage = ref<{ content: string; state: string } | null>(null)
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

  pendingMessage.value = { content: messageInput.value.trim(), state: 'pending' }
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
  } catch {
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
    sendMessage()
    createChatLoading.value = false
  } catch (error) {
    console.error(error)
  }
}

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
    console.log(ref)
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
  return (activeChat.value?.messages || []).reduce(
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
        </div>
      </div>
      <IconField>
        <InputText v-model="search" type="text" placeholder="Search for chats..." class="w-full" />
        <InputIcon class="pi pi-search" />
      </IconField>
      <div class="flex flex-col">
        <h3 class="uppercase text-slate-400 mb-4">Pinned</h3>
        <div
          v-for="chat in filteredPinnedChats"
          :key="chat.title"
          class="truncate w-full p-3 cursor-pointer hover:bg-gray-100 rounded-lg transition-all"
          :class="{
            'bg-gray-200': chat.id === activeChat?.id,
          }"
          @click="setActiveChat(chat.id)"
        >
          {{ chat.title }}
        </div>
        <div v-if="!!filteredPinnedChats" class="text-gray-500 text-center">No pinned chats.</div>
      </div>
      <div class="flex-1 flex flex-col">
        <h3 class="uppercase text-slate-400 mb-4">Chat History</h3>
        <button
          v-for="chat in filteredChats"
          :key="chat.title"
          class="truncate w-full p-3 cursor-pointer hover:bg-gray-100 rounded-lg transition-all flex items-center justify-between"
          :class="{
            'bg-gray-200': chat.id === activeChat?.id,
          }"
          @click="setActiveChat(chat.id)"
        >
          <span>
            {{ chat.title || 'Untitled Chat' }}
          </span>
          <button v-if="chat.id === activeChat?.id" class="pi pi-ellipsis-h text-gray-500"></button>
        </button>
      </div>
    </div>

    <!-- Chat Window -->
    <div class="w-8/12 xl:w-6/12 flex flex-col">
      <div
        v-if="activeChat"
        class="flex items-center justify-between p-4 gap-4 border-b border-gray-300"
      >
        <div class="text-gray-800 font-medium">{{ activeChat.title }}</div>
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
      <TransitionGroup
        v-if="activeChat"
        :key="activeChat.id"
        name="pop-in"
        tag="div"
        class="flex-1 overflow-y-auto flex flex-col gap-4 py-4 px-6"
      >
        <div
          v-for="message in activeChat.messages || []"
          :key="message.id"
          class="flex items-start gap-2"
          :class="{ 'flex-row-reverse self-end': message.role === MessageRoleEnum.User }"
        >
          <Avatar
            :label="message.role === MessageRoleEnum.User ? 'You' : 'AI'"
            class="w-10 h-10 bg-gray-300"
            shape="circle"
          />
          <div
            :class="
              message.role === MessageRoleEnum.Assistant
                ? 'bg-gray-50 text-gray-800'
                : 'bg-primary-500 text-white'
            "
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
        </div>
        <div v-if="pendingMessage" class="flex items-center gap-2 flex-row-reverse self-end">
          <Avatar label="You" class="w-10 h-10 bg-gray-300" shape="circle" />
          <div
            :class="{
              '': pendingMessage.state === 'pending',
              'bg-red-700': pendingMessage.state === 'failed',
            }"
            class="px-4 py-2 rounded-lg shadow-sm w-fit max-w-xs flex flex-col gap-y-2 bg-primary-500 text-white transition-all"
          >
            <p>{{ pendingMessage.content }}</p>
          </div>
          <button
            v-if="pendingMessage.state === 'failed'"
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
