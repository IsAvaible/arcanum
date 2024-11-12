<template>
  <div class="w-full p-6 space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold">Cases</h1>
      <button class="px-4 py-2 bg-green-400 hover:bg-green-500 text-black rounded-md">
        + New Case
      </button>
    </div>

    <div class="flex flex-wrap gap-4 items-center">
      <div class="flex rounded-full bg-green-100 p-1">
        <button
          v-for="tab in ['all', 'archived']"
          :key="tab"
          @click="activeTab = tab"
          :class="['px-4 py-2 rounded-full', activeTab === tab ? 'bg-white' : 'hover:bg-green-200']"
        >
          {{ tab === 'all' ? 'All Projects' : 'Archived' }}
        </button>
      </div>

      <input class="max-w-[200px] bg-green-100 px-3 py-2 rounded-md" placeholder="Search.." />

      <select v-model="filters.caseType" class="w-[160px] bg-green-100 px-3 py-2 rounded-md">
        <option value="">Case Type</option>
        <option value="servicecase">Servicecase</option>
        <option value="testcase">Testcase</option>
      </select>

      <select v-model="filters.status" class="w-[160px] bg-green-100 px-3 py-2 rounded-md">
        <option value="">Status</option>
        <option value="open">Open</option>
        <option value="closed">Closed</option>
        <option value="in-progress">In Progress</option>
      </select>

      <select v-model="filters.assignedTo" class="w-[160px] bg-green-100 px-3 py-2 rounded-md">
        <option value="">Assigned to</option>
        <option value="unassigned">Unassigned</option>
        <option value="assigned">Assigned</option>
      </select>

      <button class="px-4 py-2 bg-green-100 border border-gray-300 rounded-md">Last Updated</button>
    </div>

    <div>
      <div class="text-sm text-gray-500 mb-4">Number of Cases: {{ cases.length }}</div>
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
            <tr v-for="caseItem in cases" :key="caseItem.id">
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
                  class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
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
                      >Edit</a
                    >
                    <a
                      href="#"
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      >Delete</a
                    >
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

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
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import {
  MoreVerticalIcon,
  ChevronFirstIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronLastIcon,
} from 'lucide-vue-next'

const activeTab = ref('all')
const currentPage = ref(1)
const activeMenu = ref(null)
const filters = reactive({
  caseType: '',
  status: '',
  assignedTo: '',
})

const tableHeaders = [
  'Case ID',
  'Title ID',
  'Case Type',
  'Status',
  'Assigne',
  'Created by',
  'Updated on',
]

const cases = [
  {
    id: 1,
    titleId: 'Test 1',
    caseType: 'Servicecase',
    status: 'Open',
    assignee: 'Unassigned',
    createdBy: {
      initials: 'T',
      name: 'Toni',
      email: 'toni@gmail.com',
    },
    updatedOn: 'Nov 4, 2024 6:07 PM',
  },
  {
    id: 2,
    titleId: 'Test 2',
    caseType: 'Testcase',
    status: 'Closed',
    assignee: 'Unassigned',
    createdBy: {
      initials: 'OT',
      name: 'Owen Tate',
      email: 'owen@gmail.com',
    },
    updatedOn: 'Oct 25, 2024 5:09 PM',
  },
]

const getStatusBadgeColor = (status) => {
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

const setPage = (page) => {
  currentPage.value = page
}

const openMenu = (id) => {
  activeMenu.value = activeMenu.value === id ? null : id
}
</script>
