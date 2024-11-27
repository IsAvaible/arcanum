<script setup lang="ts">
// Vue and PrimeVue imports
import { ref, reactive, computed } from 'vue'
import { FilterMatchMode, FilterOperator } from '@primevue/core/api'
import { useTimeAgo } from '@vueuse/core'
import { useToast } from 'primevue'
import { useRoute } from 'vue-router'
import router from '@/router'

// PrimeVue Component Imports
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Menu from 'primevue/menu'
import DatePicker from 'primevue/datepicker'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Card from 'primevue/card'

// Custom Components
import CaseDeleteDialog from '@/components/CaseDeleteDialog.vue'

// Type Definitions
type Case = {
  id: number
  titleId: string
  caseType: string
  status: string
  assignee: string
  createdBy: { initials: string; name: string; email: string }
  updatedOn: Date
  isArchived: boolean
}

// Reactive State and References
const menu = ref()
const loading = ref(false)
const toast = useToast()
const route = useRoute()
const filters = ref()
const cases = reactive<Case[]>([])
const selectedCase = ref<Case | null>(null)
const deleteDialogVisible = ref(false)

// Constants
const caseTypes = ['Servicecase', 'Testcase']
const statuses = ['Open', 'Closed', 'In-Progress']
const assignees = ['Unassigned', 'Assigned']
const names = [
  'Toni',
  'Owen Tate',
  'Alex',
  'Daniel',
  'Chris',
  'Pat',
  'Jordan',
  'Taylor',
  'Morgan',
  'Casey',
]

// Utility Functions
/**
 * Initializes the filter configuration.
 */
const initFilter = () => {
  filters.value = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    titleId: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
    },
    caseType: {
      operator: FilterOperator.OR,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
    status: {
      operator: FilterOperator.OR,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
    assignee: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
    'createdBy.name': { value: null, matchMode: FilterMatchMode.CONTAINS },
    updatedOn: {
      operator: FilterOperator.AND,
      constraints: [
        { value: null, matchMode: FilterMatchMode.DATE_AFTER },
        { value: null, matchMode: FilterMatchMode.DATE_BEFORE },
      ],
    },
  }
}
initFilter()

/**
 * Populates the cases array with mock data.
 */
for (let i = 1; i <= 20; i++) {
  const randomName = names[Math.floor(Math.random() * names.length)]
  cases.push({
    id: i,
    titleId: `Test ${i}`,
    caseType: caseTypes[Math.floor(Math.random() * caseTypes.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    assignee: assignees[Math.floor(Math.random() * assignees.length)],
    createdBy: {
      initials: randomName.charAt(0),
      name: randomName,
      email: `${randomName.toLowerCase().replace(' ', '')}@gmail.com`,
    },
    updatedOn: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
    isArchived: Math.random() < 0.5,
  })
}

// Route Initialization for Case Deletion Dialog
if (route.path.match(/^\/cases\/\d+\/delete\/?$/g)) {
  selectedCase.value = cases.find((item) => item.id === Number(route.params.id)) || null
  deleteDialogVisible.value = true
}

// Helper Functions
/**
 * Determines the severity for a case status.
 * @param status - The status string.
 * @returns - The severity level.
 */
const getStatusSeverity = (status: string) => {
  switch (status) {
    case 'Open':
      return 'warning'
    case 'Closed':
      return 'success'
    case 'In-Progress':
      return 'info'
    default:
      return undefined
  }
}

/**
 * Toggles the menu visibility.
 * @param event - The DOM event.
 */
const toggleMenu = (event: Event) => {
  menu.value?.toggle(event)
}

/**
 * Retrieves menu items for a case.
 * @param caseItem - The case object.
 * @returns - Menu item configuration.
 */
const getMenuItems = (caseItem: Case) => [
  {
    label: caseItem.isArchived ? 'Unarchive Item' : 'Archive Item',
    icon: 'pi pi-inbox',
    command: () => toggleArchive(caseItem.id),
  },
  {
    label: 'Delete Item',
    icon: 'pi pi-trash',
    command: () => openDeleteDialog(caseItem),
  },
]

/**
 * Toggles the archived status of a case.
 * @param id - The case ID.
 */
const toggleArchive = (id: number) => {
  const caseItem = cases.find((item) => item.id === id)
  if (caseItem) {
    caseItem.isArchived = !caseItem.isArchived
  }
}

/**
 * Opens the delete dialog for a case.
 * @param caseItem - The case to delete.
 */
const openDeleteDialog = (caseItem: Case) => {
  selectedCase.value = caseItem
  deleteDialogVisible.value = true
  router.push(`/cases/${caseItem.id}/delete`)
}

/**
 * Closes the delete dialog and navigates back.
 */
const onDeleteDialogClose = () => {
  router.push('/cases')
}

/**
 * Deletes a case by title IDs.
 * @param titles - The list of title IDs to delete.
 */
const deleteCase = async (titles: string[]) => {
  try {
    const index = cases.findIndex((item) => titles.includes(item.titleId))
    if (index !== -1) cases.splice(index, 1)
    toast.add({
      severity: 'success',
      summary: 'Case Deleted',
      detail: 'The case has been successfully deleted.',
      life: 3000,
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Deletion Failed',
      detail: 'Failed to delete the case.',
      life: 3000,
    })
  } finally {
    deleteDialogVisible.value = false
    selectedCase.value = null
  }
}

/**
 * Clears all filters.
 */
const clearFilters = () => {
  initFilter()
}

/**
 * Formats a date.
 * @param date - The date to format.
 * @param ago - Whether to use "time ago" formatting.
 * @returns - The formatted date.
 */
const formatDate = (date: Date, ago: boolean = false) => {
  return ago ? useTimeAgo(date) : date.toLocaleDateString()
}

// Computed Properties for KPI Metrics
const totalCases = computed(() => cases.length)
const resolvedCases = computed(() => cases.filter((c) => c.status === 'Closed').length)
const totalCasesTrend = ref(15) // Example: 15% increase
const resolvedCasesTrend = ref(10) // Example: 10% increase
const averageResolutionTime = ref(24) // Example: 24 hours
const resolutionTimeTrend = ref(-5) // Example: 5% decrease
</script>

<template>
  <div class="flex flex-1 my-auto">
    <div class="transition-all duration-300 p-6 space-y-6 mx-auto">
      <div class="flex items-center justify-between">
        <div class="flex gap-4">
          <h1 class="text-3xl font-bold">Cases</h1>
        </div>
        <Button label="Case Create" icon="pi pi-plus" @click="$router.push('/cases/create')" />
      </div>

      <!-- KPI Widgets Row -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-gray-600">Total Cases</h3>
                <p class="text-3xl font-bold text-primary-600">{{ totalCases }}</p>
              </div>
              <i class="pi pi-file text-4xl text-primary-600"></i>
            </div>
            <div class="mt-2 text-sm text-gray-500">
              <span :class="totalCasesTrend > 0 ? 'text-green-500' : 'text-red-500'">
                {{ totalCasesTrend > 0 ? '▲' : '▼' }} {{ Math.abs(totalCasesTrend) }}%
              </span>
              from last month
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-gray-600">Resolved Cases</h3>
                <p class="text-3xl font-bold text-primary-600">{{ resolvedCases }}</p>
              </div>
              <i class="pi pi-check-circle text-4xl text-primary-600"></i>
            </div>
            <div class="mt-2 text-sm text-gray-500">
              <span :class="resolvedCasesTrend > 0 ? 'text-green-500' : 'text-red-500'">
                {{ resolvedCasesTrend > 0 ? '▲' : '▼' }} {{ Math.abs(resolvedCasesTrend) }}%
              </span>
              resolution rate this month
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-gray-600">Avg. Resolution Time</h3>
                <p class="text-3xl font-bold text-primary-600">{{ averageResolutionTime }} hrs</p>
              </div>
              <i class="pi pi-clock text-4xl text-primary-600"></i>
            </div>
            <div class="mt-2 text-sm text-gray-500">
              <span :class="resolutionTimeTrend > 0 ? 'text-red-500' : 'text-green-500'">
                {{ resolutionTimeTrend > 0 ? '▲' : '▼' }} {{ Math.abs(resolutionTimeTrend) }}%
              </span>
              from previous period
            </div>
          </template>
        </Card>
      </div>

      <DataTable
        v-model:filters="filters"
        :value="cases"
        :paginator="true"
        :rows="20"
        :rowsPerPageOptions="[20, 50, 100]"
        :rowHover="true"
        scrollable
        scrollHeight="600px"
        responsiveLayout="scroll"
        @row-click="$router.push({ path: '/cases/' + $event.data.id })"
        dataKey="id"
        :loading="loading"
        filterDisplay="menu"
        selection-mode="single"
        :globalFilterFields="['titleId', 'assignee', 'caseType', 'status', 'createdBy.name']"
      >
        <template #header>
          <div class="flex justify-between items-center">
            <Button
              type="button"
              icon="pi pi-filter-slash"
              label="Clear"
              severity="secondary"
              @click="clearFilters()"
            />
            <IconField>
              <InputIcon>
                <i class="pi pi-search" />
              </InputIcon>
              <InputText v-model="filters['global'].value" placeholder="Global Search" />
            </IconField>
          </div>
        </template>

        <Column field="id" header="Case ID" :sortable="true" />

        <Column field="titleId" header="Title ID" :sortable="true">
          <template #filter="{ filterModel }">
            <InputText v-model="filterModel.value" type="text" placeholder="Search Title ID" />
          </template>
        </Column>

        <Column field="caseType" header="Case Type" :sortable="true">
          <template #body="slotProps">
            <Tag :value="slotProps.data.caseType" :severity="'secondary'" />
          </template>
          <template #filter="{ filterModel }">
            <Select
              v-model="filterModel.value"
              :options="[
                { label: 'Servicecase', value: 'Servicecase' },
                { label: 'Testcase', value: 'Testcase' },
              ]"
              optionLabel="label"
              optionValue="value"
              placeholder="Select Case Type"
            />
          </template>
        </Column>

        <Column
          field="createdBy.name"
          header="Created by"
          :showFilterMatchModes="false"
          :sortable="true"
        >
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <img
                :alt="data.createdBy.name"
                src="https://placecats.com/50/50"
                class="rounded-full w-8"
              />
              <span>{{ data.createdBy.name }}</span>
            </div>
          </template>
          <template #filter="{ filterModel }">
            <Select
              v-model="filterModel.value"
              :options="[
                { label: 'Unassigned', value: 'Unassigned' },
                { label: 'Assigned', value: 'Assigned' },
              ]"
              optionLabel="label"
              optionValue="value"
              placeholder="Select Creator"
            />
          </template>
        </Column>

        <Column field="status" header="Status" :sortable="true">
          <template #body="slotProps">
            <Tag
              :severity="getStatusSeverity(slotProps.data.status)"
              :value="slotProps.data.status"
            />
          </template>
          <template #filter="{ filterModel }">
            <Select
              v-model="filterModel.value"
              :options="[
                { label: 'Open', value: 'Open' },
                { label: 'Closed', value: 'Closed' },
                { label: 'In-Progress', value: 'In-Progress' },
              ]"
              optionLabel="label"
              optionValue="value"
              placeholder="Select Status"
            />
          </template>
        </Column>

        <Column
          field="updatedOn"
          header="Updated"
          data-type="date"
          :sortable="true"
          :show-filter-operator="false"
        >
          <template #body="slotProps">
            {{ formatDate(slotProps.data.updatedOn, true) }}
          </template>
          <template #filter="{ filterModel }">
            <DatePicker
              v-model="filterModel.value"
              dateFormat="mm/dd/yy"
              placeholder="Select Date"
            />
          </template>
        </Column>

        <Column :exportable="false" style="min-width: 4rem">
          <template #body="slotProps">
            <Menu ref="menu" :model="getMenuItems(slotProps.data)" :popup="true" appendTo="body" />
            <Button icon="pi pi-ellipsis-v" @click="toggleMenu($event)" text rounded />
          </template>
        </Column>

        <template #empty>
          <div class="flex flex-col items-center">
            <span>No cases found. Try another search query or adjust the filters.</span>
            <Button
              variant="text"
              label="Clear Filters"
              icon="pi pi-filter"
              @click="clearFilters()"
            />
          </div>
        </template>
      </DataTable>
    </div>
  </div>

  <CaseDeleteDialog
    v-if="deleteDialogVisible"
    v-model:visible="deleteDialogVisible"
    :titles="selectedCase?.titleId || ''"
    :on-delete="deleteCase"
    @update:visible="onDeleteDialogClose()"
  />
</template>
