<template>
  <RouterLink to="/case-create">Case Create</RouterLink>

  <div class="flex">
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
          <RouterLink to="/case-create">Case Create</RouterLink>
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

        <!-- Last Updated Dropdown -->
        <select v-model="filters.lastUpdated" class="w-[160px] bg-green-100 px-3 py-2 rounded-md">
          <option value="">Last Updated</option>
          <option v-for="option in lastUpdatedOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
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
              <tr
                v-for="caseItem in filteredCases"
                :key="caseItem.id"
                :class="hoveredRow === caseItem.id ? 'bg-green-100 cursor-pointer' : ''"
                @mouseenter="hoveredRow = caseItem.id"
                @mouseleave="hoveredRow = null"
                @click="$router.push({ name: 'case-detail' })"
              >
                <!-- Case ID -->
                <td class="px-6 py-4 whitespace-nowrap">{{ caseItem.id }}</td>

                <!-- Title -->
                <td class="px-6 py-4 whitespace-nowrap">{{ caseItem.titleId }}</td>

                <!-- Case Type -->
                <td class="px-6 py-4 whitespace-nowrap">{{ caseItem.caseType }}</td>

                <!-- Status -->
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

                <!-- Assignee -->
                <td class="px-6 py-4 whitespace-nowrap">{{ caseItem.assignee }}</td>

                <!-- Created By -->
                <td class="px-6 py-4 whitespace-nowrap">{{ caseItem.createdBy.name }}</td>

                <!-- Updated On -->
                <td class="px-6 py-4 whitespace-nowrap">{{ caseItem.updatedOn }}</td>

                <!-- Dropdown for Archive/Delete -->
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    @click.stop="openMenu(caseItem.id)"
                    class="text-indigo-600 hover:text-indigo-900"
                  >
                    <MoreVerticalIcon class="h-5 w-5" />
                  </button>
                  <div
                    v-if="activeMenu === caseItem.id"
                    class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
                  >
                    <a
                      href="#"
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      @click.stop.prevent="toggleArchive(caseItem.id)"
                    >
                      {{ caseItem.isArchived ? 'Unarchive Item' : 'Archive Item' }}
                    </a>
                    <a
                      href="#"
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      @click.stop.prevent="deleteCase(caseItem.id)"
                    >
                      Delete Item
                    </a>
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
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-vue-next'

const hoveredRow = ref<number | null>(null)
const activeTab = ref('all')
const currentPage = ref(1)
const activeMenu = ref<number | null>(null)
const isCollapsed = ref(false)

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

const isWithinRange = (date: string, range: string) => {
  const caseDate = new Date(date),
    now = new Date()
  switch (range) {
    case 'Last 24 hours':
      return caseDate >= new Date(now.getTime() - 24 * 60 * 60 * 1000)
    case 'Last 7 days':
      return caseDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case 'Last 30 days':
      return caseDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case 'Q4 (Oct - Dec 2024)':
      return caseDate >= new Date('2024-10-01') && caseDate <= new Date('2024-12-31')
    case 'Q3 (Jul - Sep 2024)':
      return caseDate >= new Date('2024-07-01') && caseDate <= new Date('2024-09-30')
    case 'Q2 (Apr - Jun 2024)':
      return caseDate >= new Date('2024-04-01') && caseDate <= new Date('2024-06-30')
    case 'Q1 (Jan - Mar 2024)':
      return caseDate >= new Date('2024-01-01') && caseDate <= new Date('2024-03-31')
    case '2024':
      return caseDate.getFullYear() === 2024
    case '2023':
      return caseDate.getFullYear() === 2023
    default:
      return true
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
    const matchLastUpdated = filters.lastUpdated
      ? isWithinRange(caseItem.updatedOn, filters.lastUpdated)
      : true
    const matchArchived =
      activeTab.value === 'archived' ? caseItem.isArchived : !caseItem.isArchived
    return (
      matchCaseType &&
      matchStatus &&
      matchAssignedTo &&
      matchSearch &&
      matchLastUpdated &&
      matchArchived
    )
  })
})
</script>
