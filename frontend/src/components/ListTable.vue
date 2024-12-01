<script setup lang="ts">
// Vue and PrimeVue imports
import { ref, useTemplateRef, reactive, computed, onMounted, watch } from 'vue'
import { FilterMatchMode, FilterOperator } from '@primevue/core/api'
import { useTimeAgo } from '@vueuse/core'
import { type SelectChangeEvent, useToast } from 'primevue'
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
import Skeleton from 'primevue/skeleton'
import Divider from 'primevue/divider'
import FloatLabel from 'primevue/floatlabel'

// Custom Components
import CaseDeleteDialog from '@/components/CaseDeleteDialog.vue'

// API imports
import { useApi } from '@/composables/useApi'
import type { Case } from '@/api/api'
import { CaseCaseTypeEnum } from '@/api/api'
import type { AxiosError } from 'axios'
import KpiWidget from '@/components/case-list-view/KpiWidget.vue'

// Reactive State and References
const api = useApi()
const menu = useTemplateRef('menu')
const toast = useToast()
const route = useRoute()
const filters = ref()
const cases = reactive<Case[]>([])
const selectedCase = ref<Case | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const deleteDialogVisible = ref(false)

// Constants
const caseTypes = ref(
  Object.entries(CaseCaseTypeEnum).map(([_key, value]) => ({
    label: value,
    value: value,
  })),
)

// Date Range Preset Configuration
const dateRangePresets = ref([
  {
    label: 'All Time',
    value: [],
  },
  {
    label: 'Today',
    value: [new Date(new Date().setHours(0, 0, 0, 0)), new Date()],
  },
  {
    label: 'Last 7 Days',
    value: [new Date(new Date().setDate(new Date().getDate() - 7)), new Date()],
  },
  {
    label: 'Last 30 Days',
    value: [new Date(new Date().setDate(new Date().getDate() - 30)), new Date()],
  },
  {
    label: 'This Month',
    value: [new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date()],
  },
  {
    label: 'Last Month',
    value: [
      new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      new Date(new Date().getFullYear(), new Date().getMonth(), 0),
    ],
  },
  {
    label: 'This Year',
    value: [new Date(new Date().getFullYear(), 0, 1), new Date()],
  },
])

// Utility Functions
/**
 * Initializes the filter configuration.
 */
const initFilter = () => {
  filters.value = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    title: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
    },
    case_type: {
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
    updatedAt: { value: null, matchMode: FilterMatchMode.BETWEEN },
  }
}
initFilter()

const selectedUpdatedPreset = ref<{ label: string; value: Date[] } | null>(
  dateRangePresets.value[0],
)
const onUpdatedPresetChange = (event: SelectChangeEvent) => {
  selectedUpdatedPreset.value = event.value
  filters.value.updatedAt.value = event.value.value

  // Remove the custom range if a preset is selected
  if (event.value.label !== 'Custom Range') {
    const customRangeIndex = dateRangePresets.value.findIndex(
      (preset) => preset.label === 'Custom Range',
    )
    if (customRangeIndex !== -1) {
      dateRangePresets.value.splice(customRangeIndex, 1)
    }
  }
}
const onUpdatedRangeChange = (_event: Date) => {
  selectedUpdatedPreset.value = {
    label: 'Custom Range',
    value: [],
  }
  // Add to options if not already present
  if (!dateRangePresets.value.find((preset) => preset.label === 'Custom Range')) {
    dateRangePresets.value.push(selectedUpdatedPreset.value)
  }
}

const onUpdatedClear = () => {
  onUpdatedPresetChange({ value: dateRangePresets.value[0] } as SelectChangeEvent)
}

// Route Initialization for Case Deletion Dialog
if (route.path.match(/^\/cases\/\d+\/delete\/?$/g)) {
  ;(async () => {
    try {
      selectedCase.value = (await api.casesIdGet({ id: Number(route.params.id) })).data
      deleteDialogVisible.value = true
    } catch (error) {
      console.error(error)

      toast.add({
        severity: 'error',
        summary: 'Failed to Load Case',
        detail: 'Failed to load the case for deletion.',
        life: 3000,
      })

      await router.push('/cases')
    }
  })()
}

// Helper Functions
/**
 * Fetches cases data from the API.
 */
const fetchCases = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await api.casesGet()
    cases.splice(0, cases.length, ...response.data) // Replace cases data
  } catch (err) {
    error.value = (err as AxiosError).message
    console.error(err)
  } finally {
    loading.value = false
  }
}

/**
 * Handles a retry action in case of errors.
 */
const retryFetch = () => {
  fetchCases()
}

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
      return 'secondary'
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
    label: caseItem.id == 0 ? 'Unarchive Item' : 'Archive Item',
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
  const _caseItem = cases.find((item) => item.id === id)

  toast.add({
    severity: 'warn',
    summary: 'Backend Functionality Missing',
    detail: `Toggling archive status for cases is not implemented.`,
    life: 3000,
  })
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
 * @param caseToDelete - The case to delete.
 *
 * @returns - Whether the deletion was successful.
 */
const deleteCase = async (caseToDelete: Case) => {
  try {
    await api.casesIdDelete({ id: caseToDelete.id })

    // Remove the case from the list
    cases.splice(
      cases.findIndex((c) => c.id === caseToDelete.id),
      1,
    )

    toast.add({
      severity: 'success',
      summary: 'Case Deleted',
      detail: 'The case has been successfully deleted.',
      life: 3000,
    })
  } catch (error) {
    console.error(error)

    toast.add({
      severity: 'error',
      summary: 'Deletion Failed',
      detail: 'Failed to delete the case.',
      life: 3000,
    })

    // Rethrow the error to signal failure
    throw error
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

// Lifecycle Hooks
onMounted(fetchCases)

const path = computed(() => route.path)
watch(path, (newPath, oldPath) => {
  if (oldPath === '/cases/create' && newPath !== '/cases/create') {
    fetchCases()
  }
})
</script>

<template>
  <div class="flex flex-1 my-auto">
    <div class="transition-all duration-300 p-6 space-y-6 mx-auto">
      <div class="flex items-center justify-between">
        <div class="flex gap-4">
          <h1 class="text-3xl font-bold">Cases</h1>
        </div>
        <Button label="Create Case" icon="pi pi-pencil" @click="$router.push('/cases/create')" />
      </div>

      <!-- KPI Widgets Row -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KpiWidget
          title="Total Cases"
          :value="totalCases"
          :trend="totalCasesTrend"
          trend-description="from last month"
          icon="pi pi-file"
        />

        <KpiWidget
          title="Resolved Cases"
          :value="resolvedCases"
          :trend="resolvedCasesTrend"
          trend-description="resolution rate this month"
          icon="pi pi-check-circle"
        />

        <KpiWidget
          title="Avg. Resolution Time"
          :value="averageResolutionTime"
          :trend="resolutionTimeTrend"
          trend-description="from previous period"
          icon="pi pi-clock"
        />
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
        filterDisplay="menu"
        selection-mode="single"
        :class="{
          '[&_tbody]:animate-pulse': loading && cases.length > 0,
        }"
        :globalFilterFields="['title', 'assignee', 'case_type', 'status', 'createdBy.name']"
        sortField="updatedAt"
        :sortOrder="-1"
      >
        <template #header>
          <div class="flex justify-between items-center gap-x-5">
            <div class="flex items-center gap-x-2">
              <Button
                type="button"
                icon="pi pi-filter-slash"
                label="Clear"
                severity="secondary"
                @click="clearFilters()"
              />
              <Button
                severity="secondary"
                label="Refresh"
                :icon="`pi pi-refresh ${loading ? 'pi-spin' : ''}`"
                @click="fetchCases()"
                :disabled="loading"
              />
            </div>

            <IconField>
              <InputIcon>
                <i class="pi pi-search" />
              </InputIcon>
              <InputText v-model="filters['global'].value" placeholder="Global Search" />
            </IconField>
          </div>
        </template>

        <Column field="id" header="Case ID" :sortable="true" />

        <Column field="title" header="Title" :sortable="true">
          <template #filter="{ filterModel }">
            <InputText v-model="filterModel.value" type="text" placeholder="Search Title" />
          </template>
        </Column>

        <Column field="case_type" header="Case Type" :sortable="true">
          <template #body="slotProps">
            <Tag :value="slotProps.data.case_type" :severity="'secondary'" />
          </template>
          <template #filter="{ filterModel }">
            <Select
              v-model="filterModel.value"
              :options="caseTypes"
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
                alt="Placeholder Image"
                src="https://placecats.com/50/50"
                class="rounded-full w-8"
              />
              <span>Unknown Cat</span>
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
              :value="slotProps.data.status || 'Unknown'"
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
          field="updatedAt"
          header="Last Updated"
          data-type="date"
          :sortable="true"
          :show-filter-operator="false"
          :show-filter-match-modes="false"
        >
          <template #body="slotProps">
            {{ formatDate(slotProps.data.updatedAt, true) }}
          </template>
          <template #filter="{ filterModel }">
            <FloatLabel class="w-full mt-3">
              <Select
                :options="dateRangePresets"
                optionLabel="label"
                :model-value="selectedUpdatedPreset"
                @change="onUpdatedPresetChange"
                class="w-full"
                id="updated-preset"
              />
              <label for="updated-preset"> Select Date Range </label>
            </FloatLabel>
            <Divider class="my-1.5">
              <span class="text-gray-500">or</span>
            </Divider>
            <FloatLabel>
              <DatePicker
                v-model="filterModel.value"
                dateFormat="dd/mm/yy"
                selectionMode="range"
                :hideOnRangeSelection="true"
                :manualInput="false"
                @date-select="onUpdatedRangeChange"
                id="updated-range"
              />
              <label for="updated-range" class="z-10">Set Date Range</label>
            </FloatLabel>
          </template>
          <template #filterclear>
            <Button size="small" variant="outlined" type="button" @click="onUpdatedClear">
              Clear
            </Button>
          </template>
        </Column>

        <Column :exportable="false" style="min-width: 4rem">
          <template #body="slotProps">
            <Menu ref="menu" :model="getMenuItems(slotProps.data)" :popup="true" appendTo="body" />
            <Button icon="pi pi-ellipsis-v" @click="toggleMenu($event)" text rounded />
          </template>
        </Column>

        <template #empty>
          <div v-if="loading" class="space-y-4 relative">
            <Skeleton width="100%" height="3rem" />
            <Skeleton width="100%" height="3rem" />
            <Skeleton width="100%" height="3rem" />
            <Skeleton width="100%" height="3rem" />
            <Skeleton width="100%" height="3rem" />

            <div
              class="absolute text-lg pulse text-gray-700 inset-0 flex items-center justify-center !mt-0"
            >
              Loading...
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="flex flex-col items-center gap-y-3">
            <div class="bg-red-50 p-4 rounded-lg border-x-4 border-red-500 w-full">
              <h2 class="text-lg font-semibold mb-2">Error</h2>
              <p class="text-red-800">Failed to load cases. Please try again.</p>
            </div>
            <div>
              <Button
                label="Retry"
                icon="pi pi-refresh"
                @click="retryFetch"
                class="p-button-outlined"
              />
            </div>
          </div>

          <div v-else class="flex flex-col items-center">
            <span> No cases found. Try another search query, adjust the filters or refresh. </span>
            <div class="flex gap-x-3">
              <Button
                variant="text"
                label="Clear Filters"
                icon="pi pi-filter"
                @click="clearFilters()"
              />
              <Button
                variant="text"
                label="Refresh"
                icon="pi pi-refresh"
                @click="fetchCases()"
                :disabled="loading"
              />
            </div>
          </div>
        </template>
      </DataTable>
    </div>
  </div>

  <CaseDeleteDialog
    v-if="deleteDialogVisible"
    v-model:visible="deleteDialogVisible"
    :cases="[selectedCase!]"
    :on-delete="deleteCase"
    @update:visible="onDeleteDialogClose()"
  />
</template>
