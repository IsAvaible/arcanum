<template>
  <div class="flex">
    <!-- Sidebar -->
    <div
      :class="[
        'fixed left-0 top-0 z-30 flex h-screen flex-col bg-black text-white transition-all duration-300',
        isCollapsed ? 'w-0' : 'w-64',
      ]"
    >
      <div v-if="!isCollapsed">
        <!-- Logo -->
        <div class="p-6">
          <h1 class="text-2xl font-bold text-green-500">ARCANUM</h1>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 space-y-2 p-4">
          <a
            v-for="item in menuItems"
            :key="item.name"
            :href="item.href"
            class="flex items-center space-x-4 rounded-lg px-4 py-3 text-lg hover:bg-white/10"
          >
            <component :is="item.icon" class="h-6 w-6" />
            <span>{{ item.name }}</span>
          </a>
        </nav>

        <!-- User Profile -->
        <div class="border-t border-white/20 p-4">
          <div class="flex items-center space-x-4">
            <div class="h-10 w-10 rounded-full bg-gray-600"></div>
            <span>Name</span>
          </div>
          <button
            class="mt-4 flex w-full items-center space-x-4 rounded-lg border border-white/20 px-4 py-2 hover:bg-white/10"
          >
            <LogOut class="h-6 w-6" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div :class="['transition-all duration-300 p-6 space-y-6', isCollapsed ? 'w-full' : 'ml-64']">
      <div class="flex items-center justify-between">
        <div class="flex gap-4">
          <button
            @click="toggleSidebar"
            class="rounded-full bg-black p-2 text-white hover:bg-gray-800"
          >
            <ChevronsLeft v-if="!isCollapsed" class="h-6 w-6" />
            <ChevronsRight v-else class="h-6 w-6" />
          </button>
          <h1 class="text-3xl font-bold">Cases</h1>
        </div>
        <button class="px-4 py-2 bg-green-400 hover:bg-green-500 text-black rounded-md">
          + New Case
        </button>
      </div>

      <!-- Filters and Last Updated Dropdown -->
      <div class="flex flex-wrap gap-4 items-center">
        <div class="flex rounded-full bg-green-100 p-1">
          <button
            v-for="tab in ['all', 'archived']"
            :key="tab"
            @click="activeTab = tab"
            :class="[
              'px-4 py-2 rounded-full',
              activeTab === tab ? 'bg-white' : 'hover:bg-green-200',
            ]"
          >
            {{ tab === 'all' ? 'All Projects' : 'Archived' }}
          </button>
        </div>

        <input
          v-model="filters.search"
          class="max-w-[200px] bg-green-100 px-3 py-2 rounded-md"
          placeholder="Search.."
        />

        <select v-model="filters.caseType" class="w-[160px] bg-green-100 px-3 py-2 rounded-md">
          <option value="">Case Type</option>
          <option value="Servicecase">Servicecase</option>
          <option value="Testcase">Testcase</option>
        </select>

        <select v-model="filters.status" class="w-[160px] bg-green-100 px-3 py-2 rounded-md">
          <option value="">Status</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
          <option value="In-Progress">In Progress</option>
        </select>

        <select v-model="filters.assignedTo" class="w-[160px] bg-green-100 px-3 py-2 rounded-md">
          <option value="">Assigned to</option>
          <option value="Unassigned">Unassigned</option>
          <option value="Assigned">Assigned</option>
        </select>

        <div class="relative">
          <button
            @click="showDropdown = !showDropdown"
            class="px-4 py-2 bg-green-100 text-black rounded-md"
          >
            Last Updated
          </button>

          <div
            v-if="showDropdown"
            class="absolute mt-2 w-48 rounded-md shadow-lg bg-white border border-gray-300 z-10"
          >
            <ul class="py-2">
              <li
                v-for="option in lastUpdatedOptions"
                :key="option"
                class="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                @click="selectLastUpdated(option)"
              >
                {{ option }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Cases Table -->
      <div>
        <div class="text-sm text-gray-500 mb-4">Number of Cases: {{ filteredCases.length }}</div>
        <div class="border rounded-lg overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  v-for="header in tableHeaders"
                  :key="header"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ header }}
                </th>
                <th class="w-[50px]"></th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="caseItem in filteredCases" :key="caseItem.id">
                <td class="px-6 py-4 whitespace-nowrap">{{ caseItem.id }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ caseItem.titleId }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ caseItem.caseType }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                      getStatusBadgeColor(caseItem.status),
                    ]"
                  >
                    {{ caseItem.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">{{ caseItem.assignee }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div
                        class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center"
                      >
                        {{ caseItem.createdBy.initials }}
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {{ caseItem.createdBy.name }}
                      </div>
                      <div class="text-sm text-gray-500">{{ caseItem.createdBy.email }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">{{ caseItem.updatedOn }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    @click="openMenu(caseItem.id)"
                    class="text-indigo-600 hover:text-indigo-900"
                  >
                    <MoreVerticalIcon class="h-5 w-5" />
                  </button>
                  <div
                    v-if="activeMenu === caseItem.id"
                    class="absolute right-72 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
                  >
                    <div
                      class="py-1"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="options-menu"
                    >
                      <a
                        href="#"
                        class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                        @click.prevent="toggleArchive(caseItem.id)"
                      >
                        {{ caseItem.isArchived ? 'Unarchive Item' : 'Archive Item' }}
                      </a>
                      <a
                        href="#"
                        class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                        @click.prevent="deleteCase(caseItem.id)"
                      >
                        Delete Item
                      </a>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div class="flex justify-center gap-2 mt-4">
        <button @click="setPage(1)" class="px-3 py-2 border rounded-md">
          <ChevronFirstIcon class="h-4 w-4" />
        </button>
        <button @click="setPage(Math.max(1, currentPage - 1))" class="px-3 py-2 border rounded-md">
          <ChevronLeftIcon class="h-4 w-4" />
        </button>
        <button
          v-for="page in 5"
          :key="page"
          @click="setPage(page)"
          :class="[
            'px-3 py-2 border rounded-md',
            currentPage === page ? 'bg-green-400 text-white' : 'hover:bg-gray-50',
          ]"
        >
          {{ page }}
        </button>
        <button @click="setPage(Math.min(5, currentPage + 1))" class="px-3 py-2 border rounded-md">
          <ChevronRightIcon class="h-4 w-4" />
        </button>
        <button @click="setPage(5)" class="px-3 py-2 border rounded-md">
          <ChevronLastIcon class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {
  MoreVerticalIcon,
  ChevronFirstIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronLastIcon,
  LayoutDashboard,
  Bell,
  MessageCircle,
  Archive,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-vue-next'

const activeTab = ref('all')
const currentPage = ref(1)
const activeMenu = ref<number | null>(null)
const showDropdown = ref(false)
const isCollapsed = ref(false)

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '#' },
  { name: 'Notifications', icon: Bell, href: '#' },
  { name: 'Chat-Bot', icon: MessageCircle, href: '#' },
  { name: 'Call-Archiv', icon: Archive, href: '#' },
  { name: 'Settings', icon: Settings, href: '#' },
]

const filters = reactive({
  caseType: '',
  status: '',
  assignedTo: '',
  search: '',
  lastUpdated: '',
})

const lastUpdatedOptions = [
  'Last 24 hours',
  'Last 7 days',
  'Last 30 days',
  'Q4 (Oct - Dec 2024)',
  'Q3 (Jul - Sep 2024)',
  'Q2 (Apr - Jun 2024)',
  'Q1 (Jan - Mar 2024)',
  '2024',
  '2023',
]

const cases = reactive([
  {
    id: 1,
    titleId: 'Test 1',
    caseType: 'Servicecase',
    status: 'Open',
    assignee: 'Unassigned',
    createdBy: { initials: 'T', name: 'Toni', email: 'toni@gmail.com' },
    updatedOn: '2024-11-04T18:07:00',
    isArchived: false,
  },
  {
    id: 2,
    titleId: 'Test 2',
    caseType: 'Testcase',
    status: 'Closed',
    assignee: 'Unassigned',
    createdBy: { initials: 'OT', name: 'Owen Tate', email: 'owen@gmail.com' },
    updatedOn: '2024-10-25T17:09:00',
    isArchived: false,
  },
  {
    id: 3,
    titleId: 'Test 3',
    caseType: 'Testcase',
    status: 'In-Progress',
    assignee: 'Assigned',
    createdBy: { initials: 'A', name: 'Alex', email: 'alex@gmail.com' },
    updatedOn: '2023-10-25T17:09:00',
    isArchived: false,
  },
  {
    id: 4,
    titleId: 'Test 4',
    caseType: 'Servicecase',
    status: 'Open',
    assignee: 'Assigned',
    createdBy: { initials: 'D', name: 'Daniel', email: 'daniel@gmail.com' },
    updatedOn: '2024-01-25T17:09:00',
    isArchived: false,
  },
])

const tableHeaders = [
  'Case ID',
  'Title ID',
  'Case Type',
  'Status',
  'Assignee',
  'Created by',
  'Updated on',
]

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}
const selectLastUpdated = (option: string) => {
  filters.lastUpdated = option
  showDropdown.value = false
}

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'Open':
      return 'bg-gray-200 text-gray-900'
    case 'Closed':
      return 'bg-yellow-100 text-yellow-800'
    case 'In Progress':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-200'
  }
}

const setPage = (page: number) => {
  currentPage.value = page
}
const openMenu = (id: number | null) => {
  activeMenu.value = activeMenu.value === id ? null : id
}

const toggleArchive = (id: number) => {
  const caseItem = cases.find((item) => item.id === id)
  if (caseItem) {
    caseItem.isArchived = !caseItem.isArchived
    activeMenu.value = null
  }
}

const deleteCase = (id: number) => {
  const index = cases.findIndex((item) => item.id === id)
  if (index !== -1) {
    cases.splice(index, 1)
    activeMenu.value = null
  }
}

const filteredCases = computed(() => {
  return cases.filter((caseItem) => {
    const matchCaseType = filters.caseType ? caseItem.caseType === filters.caseType : true
    const matchStatus = filters.status ? caseItem.status === filters.status : true
    const matchAssignedTo = filters.assignedTo
      ? filters.assignedTo === 'Unassigned'
        ? caseItem.assignee === 'Unassigned'
        : caseItem.assignee !== 'Unassigned'
      : true
    const matchSearch = filters.search
      ? caseItem.titleId.toLowerCase().includes(filters.search.toLowerCase()) ||
        caseItem.assignee.toLowerCase().includes(filters.search.toLowerCase())
      : true
    const matchArchived =
      activeTab.value === 'archived' ? caseItem.isArchived : !caseItem.isArchived
    return matchCaseType && matchStatus && matchAssignedTo && matchSearch && matchArchived
  })
})
</script>
