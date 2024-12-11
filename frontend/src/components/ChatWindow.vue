<script setup lang="ts">
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Avatar from 'primevue/avatar'
import myImage from '@/assets/images/arcanum-ai.jpg'
import { useApi } from '@/composables/useApi'
import type { Case } from '@/api'
import CaseReference from '@/components/chat-view/CaseReference.vue'
import DynamicRouterLinkText from '@/components/misc/DynamicRouterLinkText.vue'

const notification = ref(true)
const sound = ref(false)
const saveToDownloads = ref(false)
const search = ref('')
const value = ref('Chat')
const options = ['Chat', 'Call']
const media = ref('Media')
const mediaOptions = ['Media', 'Link', 'Docs']
const messageInput = ref('')
const activeChat = ref<Chat | null>(null)

const api = useApi()

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
    lastMessage: "Let's implement PrimeVue. Elevating our UI game! \ud83d\ude80",
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

const filteredChats = computed(() => {
  return chats.value.filter((chat) => chat.name.toLowerCase().includes(search.value.toLowerCase()))
})

const setActiveChat = (chat: Chat) => {
  activeChat.value = chat
}
setActiveChat(chats.value[0])

const sendMessage = () => {
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

const getCaseReferences = (message: string): { id: number; case: Promise<Case> }[] => {
  const caseReferences = message.match(/#(\d+)/g)

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
</script>

<template>
  <div class="flex h-screen bg-white">
    <!-- Sidebar -->
    <div class="w-4/12 xl:w-3/12 min-w-40 overflow-auto flex flex-col gap-6 border-r">
      <div class="flex flex-col gap-6 pt-3 pb-2 px-5 sticky top-0 bg-white z-10">
        <div class="flex items-center justify-between gap-6 text-gray-800">
          <div class="text-2xl font-medium lead">Chats</div>
          <Button icon="pi pi-plus" text />
        </div>
      </div>
      <div class="px-5">
        <div class="relative">
          <InputText
            v-model="search"
            type="text"
            placeholder="Search chats..."
            class="w-full py-2 px-4 text-gray-800 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <i
            class="pi pi-search absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
          ></i>
        </div>
      </div>
      <div class="w-full px-5 mt-4">
        <div class="flex border border-gray-300 rounded-md overflow-hidden">
          <button
            v-for="option in options"
            :key="option"
            @click="value = option"
            class="flex-1 py-2 text-center text-sm font-medium"
            :class="{
              'bg-gray-300 text-gray-800': value === option,
              'bg-gray-100 text-gray-600': value !== option,
            }"
          >
            {{ option }}
          </button>
        </div>
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
          <i class="pi pi-phone text-gray-800"></i>
          <i class="pi pi-search text-gray-800"></i>
          <i class="pi pi-ellipsis-h text-gray-800"></i>
        </div>
      </div>
      <div v-else class="flex items-center justify-center h-full">
        <p class="text-gray-500">Select a chat to start messaging.</p>
      </div>
      <div v-if="activeChat" class="flex-1 overflow-y-auto flex flex-col gap-4 py-4 px-6">
        <div
          v-for="message in activeChat.messages || []"
          :key="message.id"
          class="flex items-start gap-2"
          :class="{ 'flex-row-reverse': message.type === 'sent' }"
        >
          <Avatar
            v-bind="message.image ? { image: message.image } : { label: message.capName }"
            class="w-10 h-10 bg-gray-300"
            shape="circle"
          />
          <div
            :class="
              message.type === 'received' ? 'bg-gray-50 text-gray-800' : 'bg-blue-500 text-white'
            "
            class="px-4 py-2 rounded-lg shadow-sm w-fit max-w-xs flex flex-col gap-y-2"
          >
            <p>
              <DynamicRouterLinkText :text="message.message" :regex="/#(\d+)/g" to="/cases/" />
            </p>
            <CaseReference
              v-for="caseReference in getCaseReferences(message.message)"
              :reference="caseReference"
              class="min-w-40"
              :class="{
                'bg-gray-100': message.type === 'received',
                'bg-white': message.type === 'sent',
              }"
            />
          </div>
        </div>
      </div>
      <div v-if="activeChat" class="p-4 border-t border-gray-300 flex items-center gap-3 bg-white">
        <!-- Smiley Icon -->
        <i class="pi pi-face-smile" style="font-size: 1.2rem; color: black"></i>

        <!-- Paperclip Icon -->
        <i class="pi pi-paperclip" style="font-size: 1.2rem; color: black"></i>
        <!-- Inputfield -->
        <input
          v-model="messageInput"
          type="text"
          placeholder="Type a message"
          class="flex-1 border border-gray-300 rounded-md py-2 px-4 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          @keyup.enter="sendMessage"
        />

        <!-- Send-Icon -->
        <i
          class="pi pi-send"
          style="font-size: 1.3rem; color: blue; cursor: pointer"
          @click="sendMessage"
        ></i>
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
        <button class="p-button p-button-text">
          <i class="pi pi-phone" style="font-size: 1.2rem; color: #333"></i>
        </button>
        <button class="p-button p-button-text">
          <i class="pi pi-video" style="font-size: 1.2rem; color: #333"></i>
        </button>
        <button class="p-button p-button-text">
          <i class="pi pi-sign-out" style="font-size: 1.2rem; color: #333"></i>
        </button>
        <button class="p-button p-button-text">
          <i class="pi pi-info-circle" style="font-size: 1.2rem; color: #333"></i>
        </button>
        <button class="p-button p-button-text">
          <i class="pi pi-ellipsis-h" style="font-size: 1.2rem; color: #333"></i>
        </button>
      </div>

      <!-- Toggles -->
      <div class="mt-4">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <i class="pi pi-bell" style="font-size: 1.2rem; color: #333"></i>
            <span class="text-gray-800 text-sm">Notification</span>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" class="sr-only peer" v-model="notification" />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer dark:bg-gray-700 peer-checked:bg-blue-600 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600"
            ></div>
          </label>
        </div>

        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <i class="pi pi-volume-up" style="font-size: 1.2rem; color: #333"></i>
            <span class="text-gray-800 text-sm">Sound</span>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" class="sr-only peer" v-model="sound" />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer dark:bg-gray-700 peer-checked:bg-blue-600 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600"
            ></div>
          </label>
        </div>

        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <i class="pi pi-download" style="font-size: 1.2rem; color: #333"></i>
            <span class="text-gray-800 text-sm">Save to downloads</span>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" class="sr-only peer" v-model="saveToDownloads" />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer dark:bg-gray-700 peer-checked:bg-blue-600 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600"
            ></div>
          </label>
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
        <div class="flex border border-gray-300 rounded-md overflow-hidden text-sm">
          <button
            v-for="tab in mediaOptions"
            :key="tab"
            class="flex-1 py-2 text-center"
            :class="{
              'bg-gray-300 text-gray-800': media === tab,
              'bg-gray-100 text-gray-600': media !== tab,
            }"
            @click="media = tab"
          >
            {{ tab }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
