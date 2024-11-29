<template>
  <div
    class="flex-1 h-full overflow-y-auto overflow-x-clip overflow-hidden flex border border-gray-300 rounded-2xl bg-white"
  >
    <!-- Left Sidebar -->
    <div class="w-4/12 xl:w-3/12 min-w-40 overflow-auto flex flex-col gap-6">
      <div class="flex flex-col gap-6 pt-3 pb-2 -mb-2 px-5 sticky top-0 bg-white z-10">
        <div class="flex items-center justify-between gap-6 text-gray-800">
          <div class="text-2xl font-medium lead">Chats</div>
          <Button icon="pi pi-plus" text />
        </div>
      </div>
      <div class="px-5">
        <div class="relative">
          <input
            v-model="search"
            type="text"
            placeholder="Placeholder"
            class="w-full py-2 px-4 text-gray-800 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
          v-for="chat in chats"
          :key="chat.name"
          class="flex items-center gap-4 p-3 cursor-pointer hover:bg-gray-100 transition-all"
          :class="{
            'bg-gray-200': chat.name === activeChat,
          }"
        >
          <div class="relative">
            <Avatar
              v-bind="chat.image ? { image: chat.image } : { label: chat.capName }"
              :class="{
                '!bg-gray-300 !text-gray-800': !chat.image,
              }"
              class="text-base font-medium flex"
              size="large"
              shape="circle"
            />
          </div>
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
    <div class="w-8/12 xl:w-6/12 border-x border-gray-300 flex flex-col bg-white">
      <div class="flex items-center justify-between p-4 gap-4 border-b border-gray-300">
        <div class="flex items-center cursor-pointer">
          <Avatar
            image="https://www.primefaces.org/cdn/primevue/images/landing/apps/avatar-primetek.png"
            class="mr-2 av"
            size="large"
            shape="circle"
          />
          <div class="flex-1">
            <div class="text-gray-800 font-medium leading-6">PrimeTek</div>
            <div class="text-gray-500 text-sm leading-5 line-clamp-1">
              Cody Fisher, Esther Howard...
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <i class="pi pi-phone text-gray-800" style="font-size: 1rem"></i>
          <i class="pi pi-search text-gray-800" style="font-size: 1rem"></i>
          <i class="pi pi-ellipsis-h text-gray-800" style="font-size: 1rem"></i>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto flex flex-col gap-4 py-4 px-6">
        <div
          v-for="message in chatMessages"
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
              message.type === 'received' ? 'bg-gray-100 text-gray-800' : 'bg-blue-500 text-white'
            "
            class="px-4 py-2 rounded-lg shadow-sm w-fit max-w-xs text-sm"
          >
            <p>{{ message.message }}</p>
          </div>
        </div>
      </div>

      <div class="p-4 border-t border-gray-300 flex items-center gap-3 bg-white">
        <i class="pi pi-face-smile" style="font-size: 1.5rem; color: black"></i>
        <i class="pi pi-paperclip" style="font-size: 1.5rem; color: black"></i>
        <input
          type="text"
          placeholder="Placeholder"
          class="flex-1 border border-gray-300 rounded-md py-2 px-4 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <i class="pi pi-send" style="font-size: 1.5rem; color: black"></i>
      </div>
    </div>

    <!-- User Details -->
    <!-- User Details -->
    <div class="w-3/12 min-w-[300px] px-4 py-6 bg-white">
      <div class="flex flex-col items-center">
        <!-- Avatar -->
        <Avatar
          image="https://www.primefaces.org/cdn/primevue/images/landing/apps/avatar-primetek.png"
          class="w-24 h-24 mb-4"
          shape="circle"
        />
        <!-- Name und Username -->
        <div class="text-gray-800 font-medium text-xl">PrimeTek</div>
        <div class="text-gray-500 text-sm">@primetek</div>
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
        <!-- Notification Toggle -->
        <div class="flex items-center justify-between mb-4">
          <!-- Icon und Label -->
          <div class="flex items-center gap-3">
            <i class="pi pi-bell" style="font-size: 1.2rem; color: #333"></i>
            <span class="text-gray-800 text-sm">Notification</span>
          </div>
          <!-- Schalter -->
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" class="sr-only peer" v-model="notification" />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer dark:bg-gray-700 peer-checked:bg-blue-600 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600"
            ></div>
          </label>
        </div>

        <!-- Sound Toggle -->
        <div class="flex items-center justify-between mb-4">
          <!-- Icon und Label -->
          <div class="flex items-center gap-3">
            <i class="pi pi-volume-up" style="font-size: 1.2rem; color: #333"></i>
            <span class="text-gray-800 text-sm">Sound</span>
          </div>
          <!-- Schalter -->
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" class="sr-only peer" v-model="sound" />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer dark:bg-gray-700 peer-checked:bg-blue-600 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600"
            ></div>
          </label>
        </div>

        <!-- Save to Downloads Toggle -->
        <div class="flex items-center justify-between mb-4">
          <!-- Icon und Label -->
          <div class="flex items-center gap-3">
            <i class="pi pi-download" style="font-size: 1.2rem; color: #333"></i>
            <span class="text-gray-800 text-sm">Save to downloads</span>
          </div>
          <!-- Schalter -->
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" class="sr-only peer" v-model="saveToDownloads" />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer dark:bg-gray-700 peer-checked:bg-blue-600 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600"
            ></div>
          </label>
        </div>
      </div>

      <!-- Members Section -->
      <div class="mt-6">
        <div class="flex justify-between items-center mb-4">
          <span class="text-gray-800 font-medium text-sm">Members</span>
          <a href="#" class="text-blue-500 hover:underline text-sm">See All</a>
        </div>
        <div
          v-for="(member, index) in members"
          :key="index"
          class="flex items-center justify-between mb-4"
        >
          <div class="flex items-center gap-3">
            <Avatar icon="pi pi-user" shape="circle" class="bg-gray-300 w-8 h-8" />
            <span class="text-gray-800 text-sm">{{ member }}</span>
          </div>
          <button class="p-button p-button-text">
            <i class="pi pi-angle-right" style="font-size: 1.2rem; color: #333"></i>
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="mt-6">
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

<script lang="ts">
import Dialog from 'primevue/dialog'
import ToggleSwitch from 'primevue/toggleswitch' // Neuer Import

export default {
  name: 'Chat',
  components: Dialog,
  ToggleSwitch,
  data() {
    return {
      notification: true, // Anfangswert für Notification
      sound: false, // Anfangswert für Sound
      saveToDownloads: false, // Anfangswert für Save to Downloads
      search: '',
      download: false,
      value: 'Chat',
      value2: '',
      options: ['Chat', 'Call'],
      media: 'Media',
      mediaOptions: ['Media', 'Link', 'Docs'],
      activeChat: 'PrimeTek Team',
      members: ['Cody Fisher', 'Jerome Bell', 'Robert Fox'], // Mitgliederliste
      menuItems: [
        {
          label: 'Group Info',
          icon: 'pi pi-info-circle',
        },
        {
          label: 'Leave group',
          icon: 'pi pi-sign-out',
        },
      ],
      chats: [
        {
          image: 'https://www.primefaces.org/cdn/primevue/images/landing/apps/avatar11.jpg',
          name: 'Cody Fisher',
          capName: 'CF',
          active: true,
          unreadMessageCount: 8,
          time: '12.30',
          lastMessage: "Hey there! I've heard about PrimeVue. Any cool tips for getting started?",
        },
        {
          image: 'https://www.primefaces.org/cdn/primevue/images/landing/apps/avatar-primetek.png',
          name: 'PrimeTek Team',
          capName: 'PT',
          active: undefined,
          unreadMessageCount: 0,
          time: '11.15',
          lastMessage: "Let's implement PrimeVue. Elevating our UI game! 🚀",
        },
        {
          image: 'https://www.primefaces.org/cdn/primevue/images/landing/apps/avatar2.png',
          name: 'Jerome Bell',
          capName: 'JB',
          active: true,
          unreadMessageCount: 4,
          time: '11.15',
          lastMessage: "Absolutely! PrimeVue's documentation is gold—simplifies our UI work.",
        },
        {
          image: 'https://www.primefaces.org/cdn/primevue/images/landing/apps/avatar12.jpg',
          name: 'Robert Fox',
          capName: 'RF',
          active: false,
          unreadMessageCount: 0,
          time: '11.15',
          lastMessage: "Interesting! PrimeVue sounds amazing. What's your favorite feature?",
        },
        {
          image: 'https://www.primefaces.org/cdn/primevue/images/landing/apps/avatar13.jpg',
          name: 'Esther Howard',
          capName: 'EH',
          active: true,
          unreadMessageCount: 9,
          time: '11.15',
          lastMessage: 'Quick one, team! Anyone using PrimeVue for mobile app development?',
        },
        {
          image: 'https://www.primefaces.org/cdn/primevue/images/landing/apps/avatar9.jpg',
          name: 'Darlene Robertson',
          capName: 'DR',
          active: false,
          unreadMessageCount: 0,
          time: '11.15',
          lastMessage:
            "Just explored PrimeVue's themes. Can we talk about those stunning designs? 😍",
        },
        {
          image: 'https://www.primefaces.org/cdn/primevue/images/landing/apps/avatar6.png',
          name: 'Ralph Edwards',
          capName: 'RE',
          active: false,
          unreadMessageCount: 0,
          time: '11.15',
          lastMessage: 'PrimeVue is a game-changer, right? What are your thoughts, folks?',
        },
        {
          image: '',
          name: 'Ronald Richards',
          capName: 'RR',
          active: false,
          unreadMessageCount: 0,
          time: '11.15',
          lastMessage:
            "Jumping in! PrimeVue's community forum is buzzing. Any engaging discussions?",
        },
        {
          image: '',
          name: 'Kristin Watson',
          capName: 'KW',
          active: false,
          unreadMessageCount: 0,
          time: '11.15',
          lastMessage: 'Sharing a quick win-PrimeVue tutorials are leveling up my UI skills. 👩‍💻',
        },
        {
          image: 'https://www.primefaces.org/cdn/primevue/images/landing/apps/avatar7.png',
          name: 'Darrell Steward',
          capName: 'DS',
          active: false,
          unreadMessageCount: 0,
          time: '11.15',
          lastMessage: "Reflecting on PrimeVue's impact on our workflow. What's your take?",
        },
      ],
      chatMessages: [
        {
          id: 1,
          attachment: '',
          name: '',
          image: '',
          capName: 'OS',
          type: 'received',
          message: "Awesome! What's the standout feature?",
        },
        {
          id: 2,
          attachment: '',
          name: '',
          image: 'https://www.primefaces.org/cdn/primevue/images/landing/apps/avatar8.png',
          capName: 'A',
          type: 'received',
          message: 'PrimeVue rocks! Simplifies UI dev with versatile components.',
        },
        {
          id: 3,
          attachment: '',
          name: '',
          image: 'https://www.primefaces.org/cdn/primevue/images/landing/apps/avatar11.jpg',
          capName: 'A',
          type: 'received',
          message: 'Intriguing! Tell us more about its impact.',
        },
        {
          id: 4,
          attachment:
            'https://www.primefaces.org/cdn/primevue/images/landing/apps/message-image.png',
          name: '',
          image: 'https://www.primefaces.org/cdn/primevue/images/landing/apps/avatar2.png',
          capName: 'A',
          type: 'received',
          message:
            "It's design-neutral and compatible with Tailwind. Features accessible, high-grade components!",
        },
        {
          id: 5,
          attachment: '',
          name: '',
          image: 'https://www.primefaces.org/cdn/primevue/images/landing/apps/avatar5.png',
          capName: 'A',
          type: 'sent',
          message: 'Customizable themes, responsive design – UI excellence!',
        },
        {
          id: 6,
          attachment: '',
          name: '',
          image: 'https://www.primefaces.org/cdn/primevue/images/landing/apps/avatar8.png',
          capName: 'A',
          type: 'received',
          message: 'Love it! Fast-tracking our development is key.',
        },
        {
          id: 7,
          attachment: '',
          name: '',
          image: 'https://www.primefaces.org/cdn/primevue/images/landing/apps/avatar6.png',
          capName: 'A',
          type: 'received',
          message: 'Documentation rocks too – smooth integration for all.',
        },
      ],
    }
  },
}
</script>
