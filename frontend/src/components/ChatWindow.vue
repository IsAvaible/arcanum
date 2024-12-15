<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Button,
  InputText,
  Avatar,
  SelectButton,
  ToggleSwitch,
  IconField,
  InputIcon,
} from 'primevue'
import myImage from '@/assets/images/arcanum-ai.jpg'
import { useApi } from '@/composables/useApi'
import type { Case } from '@/api'
import CaseReference from '@/components/chat-view/CaseReference.vue'
import DynamicRouterLinkText from '@/components/misc/DynamicRouterLinkText.vue'
import { useDebounceFn } from '@vueuse/core'

/**
 * Reactive references for chat settings and inputs.
 */
const notification = ref(true)
const sound = ref(false)
const saveToDownloads = ref(false)
const search = ref('')
const chatTypeSelection = ref('Chat')
const chatTypeOptions = ['Chat', 'Call']
const media = ref('Media')
const mediaOptions = ['Media', 'Link', 'Docs']
const messageInput = ref('')
const activeChat = ref<Chat | null>(null)

/**
 * API instance for fetching and validating case references.
 */
const api = useApi()

/**
 * Regular expression to match case references like #10 in messages.
 */
const caseReferenceRegex = /#(\d+)(\s|$)/g

/**
 * Type definition for a Chat object.
 */
type Chat = {
  name: string
  image?: string
  capName: string
  time: string
  lastMessage: string
  unreadMessageCount?: number
  messages?: Array<{ id: number; type: string; message: string; capName?: string; image?: string }>
  isGroup?: boolean
  members?: { name: string; image: string }[]
}

/**
 * Sample chat data for the application.
 */
const chats = ref<Chat[]>([
  {
    name: 'ARCANUM AI',
    image: myImage,
    capName: 'AI',
    time: '',
    isGroup: false,
    members: [],
    lastMessage: 'Ask me about anything',
    messages: [
      {
        id: 1,
        type: 'received',
        message: 'Hello! How can I assist you today? #22 #9999',
        capName: 'AI',
      },
    ],
  },
  {
    name: 'Cody Fisher',
    image: 'https://www.primefaces.org/cdn/primevue/images/landing/apps/avatar12.jpg',
    capName: 'CF',
    time: '12:30',
    isGroup: false,
    members: [],
    lastMessage: "Hey there! I've heard about PrimeVue. Any cool tips for getting started?",
    messages: [
      { id: 1, type: 'received', message: 'Hi, how can I help you?', capName: 'CF' },
      { id: 2, type: 'sent', message: 'I have a question about PrimeVue.', capName: 'You' },
    ],
  },
  {
    image: 'https://www.primefaces.org/cdn/primevue/images/landing/apps/avatar-primetek.png',
    name: 'PrimeTek Team',
    capName: 'PT',
    unreadMessageCount: 0,
    time: '11.15',
    isGroup: true,
    members: [
      {
        name: 'Cody Fisher',
        image: 'https://www.primefaces.org/cdn/primevue/images/landing/apps/avatar12.jpg',
      },
      {
        name: 'Esther Howard',
        image: 'https://www.primefaces.org/cdn/primevue/images/landing/apps/avatar13.jpg',
      },
      {
        name: 'Darlene Robertson',
        image: 'https://www.primefaces.org/cdn/primevue/images/landing/apps/avatar11.jpg',
      },
    ],
    lastMessage: "Let's implement PrimeVue. Elevating our UI game! 🚀",
  },
  {
    name: 'Esther Howard',
    image: 'https://www.primefaces.org/cdn/primevue/images/landing/apps/avatar13.jpg',
    capName: 'EH',
    time: '12:30',
    isGroup: false,
    members: [],
    lastMessage: 'Do you have a moment to discuss our project?',
    messages: [
      { id: 1, type: 'received', message: 'Sure, what’s the issue?', capName: 'EH' },
      { id: 2, type: 'sent', message: "It's about the deadline.", capName: 'You' },
    ],
  },
  {
    name: 'Darlene Robertson',
    image: 'https://www.primefaces.org/cdn/primevue/images/landing/apps/avatar9.jpg',
    capName: 'DR',
    time: '12:30',
    isGroup: false,
    members: [],
    lastMessage: 'Just checking in for updates on our project!',
    messages: [],
  },
])

/**
 * Computed property for filtering chats based on the search input.
 */
const filteredChats = computed(() => {
  return chats.value.filter((chat) => chat.name.toLowerCase().includes(search.value.toLowerCase()))
})

/**
 * Sets the active chat to the selected chat.
 * @param chat - The chat object to be set as active.
 */
const setActiveChat = (chat: Chat) => {
  activeChat.value = chat
}
setActiveChat(chats.value[0])

const invalidSubmissionAttempt = ref(false)
/**
 * Handles sending a message in the active chat.
 * Validates message input and appends it to the chat messages.
 */
const sendMessage = () => {
  if (hasInvalidCaseReferences.value) {
    invalidSubmissionAttempt.value = false
    setTimeout(() => {
      invalidSubmissionAttempt.value = true
    }, 1)
    return
  }

  if (messageInput.value.trim() !== '' && activeChat.value) {
    if (!activeChat.value.messages || !Array.isArray(activeChat.value.messages)) {
      activeChat.value.messages = []
    }
    activeChat.value.messages.push({
      id: activeChat.value.messages.length + 1,
      type: 'sent',
      message: messageInput.value.trim(),
    })
    messageInput.value = ''
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
  const caseReferences = messageInput.value.match(caseReferenceRegex) || []
  const invalidRefs: number[] = []

  for (const ref of caseReferences) {
    const id = Number(ref.replace('#', ''))

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
      acc[message.id] = getCaseReferences(message.message)
      return acc
    },
    {} as Record<number, { id: number; case: Promise<Case> }[]>,
  )
})
</script>

<template>
  <div class="flex h-screen bg-white neutral-primary">
    <!-- Sidebar -->
    <div class="w-4/12 xl:w-3/12 min-w-40 overflow-auto flex flex-col gap-6 border-r">
      <div class="flex flex-col gap-6 pt-3 pb-2 px-5 sticky top-0 bg-white z-10">
        <div class="flex items-center justify-between gap-6 text-gray-800">
          <div class="text-2xl font-medium lead">Chats</div>
          <Button icon="pi pi-plus" text />
        </div>
      </div>
      <div class="px-5">
        <IconField>
          <InputText v-model="search" type="text" placeholder="Search chats..." class="w-full" />
          <InputIcon class="pi pi-search" />
        </IconField>
      </div>
      <div class="w-full px-5 mt-4">
        <SelectButton
          v-model="chatTypeSelection"
          class="w-full flex [&>*]:w-full"
          :options="chatTypeOptions"
        />
      </div>
      <div class="flex-1 flex flex-col">
        <div
          v-for="chat in filteredChats"
          :key="chat.name"
          class="flex items-center gap-4 p-3 cursor-pointer hover:bg-gray-100 transition-all"
          :class="{
            'bg-gray-200': chat.name === activeChat?.name,
          }"
          @click="setActiveChat(chat)"
        >
          <Avatar
            v-bind="chat.image ? { image: chat.image } : { label: chat.capName }"
            class="text-base font-medium flex"
            size="large"
            shape="circle"
          />
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <div class="text-base font-medium text-gray-800">{{ chat.name }}</div>
              <div class="text-xs text-gray-500">{{ chat.time }}</div>
            </div>
            <div class="text-sm text-gray-500 line-clamp-1">{{ chat.lastMessage }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat Window -->
    <div class="w-8/12 xl:w-6/12 flex flex-col">
      <div
        v-if="activeChat"
        class="flex items-center justify-between p-4 gap-4 border-b border-gray-300"
      >
        <div class="flex items-center">
          <Avatar
            v-bind="activeChat.image ? { image: activeChat.image } : { label: activeChat.capName }"
            class="mr-2"
            size="large"
            shape="circle"
          />
          <div class="flex-1">
            <div class="text-gray-800 font-medium">{{ activeChat.name }}</div>
            <div class="text-gray-500 text-sm">{{ activeChat.lastMessage }}</div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <Button variant="text" severity="secondary" size="small">
            <i class="pi pi-phone text-gray-800"></i>
          </Button>
          <Button variant="text" severity="secondary" size="small" class="-ml-4">
            <i class="pi pi-search text-gray-800"></i>
          </Button>
          <Button variant="text" severity="secondary" size="small" class="-ml-4">
            <i class="pi pi-ellipsis-h text-gray-800"></i>
          </Button>
        </div>
      </div>
      <div v-else class="flex items-center justify-center h-full">
        <p class="text-gray-500">Select a chat to start messaging.</p>
      </div>
      <TransitionGroup
        v-if="activeChat"
        :key="activeChat.name"
        name="pop-in"
        tag="div"
        class="flex-1 overflow-y-auto flex flex-col gap-4 py-4 px-6"
      >
        <div
          v-for="message in activeChat.messages || []"
          :key="message.id"
          class="flex items-start gap-2"
          :class="{ 'flex-row-reverse self-end': message.type === 'sent' }"
        >
          <Avatar
            v-bind="message.image ? { image: message.image } : { label: message.capName }"
            class="w-10 h-10 bg-gray-300"
            shape="circle"
          />
          <div
            :class="
              message.type === 'received' ? 'bg-gray-50 text-gray-800' : 'bg-primary-500 text-white'
            "
            class="px-4 py-2 rounded-lg shadow-sm w-fit max-w-xs flex flex-col gap-y-2"
          >
            <p>
              <DynamicRouterLinkText
                :text="message.message"
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
                'bg-gray-100': message.type === 'received',
                'bg-white': message.type === 'sent',
              }"
            />
          </div>
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
          <i class="pi pi-send text-primary-700 text-xl" @click="sendMessage"></i>
        </Button>
      </div>
    </div>

    <!-- User Details -->
    <div class="w-3/12 min-w-[300px] border-l border-gray-300 bg-white px-4 py-6 flex flex-col">
      <div class="flex flex-col items-center">
        <!-- Avatar -->
        <Avatar
          v-bind="
            activeChat?.image ? { image: activeChat.image } : { label: activeChat?.capName || '?' }
          "
          class="w-24 h-24 mb-4"
          shape="circle"
        />

        <div v-if="activeChat" class="text-gray-800 font-medium text-xl">
          {{ activeChat.name }}
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

      <div v-if="activeChat?.isGroup" class="mt-6 flex-1 overflow-y-auto">
        <!-- Header -->
        <div class="flex justify-between items-center mb-4">
          <span class="text-gray-800 font-medium text-sm">Members</span>
          <a href="#" class="text-blue-500 hover:underline text-sm">See All</a>
        </div>

        <!-- Members List -->
        <div
          v-for="(member, index) in activeChat?.members || []"
          :key="index"
          class="flex items-center justify-between mb-4"
        >
          <div class="flex items-center gap-3">
            <Avatar
              v-bind="member.image ? { image: member.image } : { icon: 'pi pi-user' }"
              shape="circle"
              class="bg-gray-300 w-8 h-8"
            />

            <span class="text-gray-800 text-sm">{{ member.name }}</span>
          </div>
          <button class="p-button p-button-text">
            <i class="pi pi-angle-right" style="font-size: 1.2rem; color: #333"></i>
          </button>
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
