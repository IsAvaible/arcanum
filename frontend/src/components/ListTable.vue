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
import type { MenuItem } from 'primevue/menuitem'
import { userOptions } from '@/api/mockdata'
import UserSelector from '@/components/case-create-form/UserSelector.vue'
import CaseStatusSelect from '@/components/case-form-fields/CaseStatusSelect/CaseStatusSelect.vue'

// Reactive State and References
const api = useApi()
const menu = useTemplateRef('menu')
const menuModel = ref<MenuItem[] | undefined>(undefined)
const toast = useToast()
const route = useRoute()
const filters = ref()
const cases = reactive<Case[]>([])
const selectedCases = ref<Case[]>([])
const selectedCasesToDelete = ref<Case[]>([])
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
    assignees: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
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
if (route.name == 'case-delete') {
  ;(async () => {
    try {
      selectedCasesToDelete.value = [(await api.casesIdGet({ id: Number(route.params.id) })).data]
      deleteDialogVisible.value = true
    } catch (error) {
      console.error(error)

      toast.add({
        severity: 'error',
        summary: 'Failed to Load Case',
        detail: 'Failed to load the case for deletion.',
        life: 3000,
      })

      await router.push({ name: 'cases' })
    }
  })()
}
if (route.name == 'case-delete-all') {
  router.push({ name: 'cases' })
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
      return 'info'
    case 'Solved':
    case 'Closed':
      return 'success'
    case 'In Progress':
      return 'warn'
    default:
      return 'secondary'
  }
}

/**
 * Toggles the menu visibility.
 * @param event - The DOM event.
 * @param caseItem - The case object.
 */
const toggleMenu = (event: Event, caseItem: Case) => {
  menuModel.value = getMenuItems(caseItem)
  menu.value?.toggle(event)
}

/**
 * Retrieves menu items for a case.
 * @param caseItem - The case object.
 * @returns - Menu item configuration.
 */
const getMenuItems = (caseItem: Case) => [
  {
    label: 'View Case',
    icon: 'pi pi-eye',
    command: () => router.push({ name: 'case-detail', params: { id: caseItem.id.toString() } }),
  },
  {
    label: caseItem.id == 0 ? 'Unarchive Case' : 'Archive Case',
    icon: 'pi pi-inbox',
    command: () => toggleArchive(caseItem.id),
  },
  {
    label: 'Delete Case',
    icon: 'pi pi-trash',
    command: () => openDeleteDialog([caseItem]),
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
 * Opens the delete dialog for one or more cases.
 * @param cases - The cases to delete.
 */
const openDeleteDialog = (cases: Case[]) => {
  selectedCasesToDelete.value = cases
  deleteDialogVisible.value = true
  if (cases.length === 1) {
    router.push({ name: 'case-delete', params: { id: cases[0].id } })
  } else {
    router.push({ name: 'case-delete-all' })
  }
}

/**
 * Closes the delete dialog and navigates back.
 */
const onDeleteDialogClose = () => {
  router.push({ name: 'cases' })
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
  } catch (error) {
    console.error(error)

    // Rethrow the error to signal failure
    throw error
  } finally {
    deleteDialogVisible.value = false
    selectedCasesToDelete.value = []
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
    <div class="transition-all duration-300 p-6 space-y-6 mx-auto max-w-full">
      <div class="flex items-center justify-between">
        <div class="flex gap-4">
          <h1 class="text-3xl font-bold">Cases</h1>
        </div>
        <Button
          label="Create Case"
          icon="pi pi-pencil"
          @click="router.push({ name: 'case-create' })"
        />
      </div>

      <!-- KPI Widgets Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
        :value="cases"
        v-model:filters="filters"
        v-model:selection="selectedCases"
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
        class="cursor-pointer"
        :class="{
          '[&_tbody]:animate-pulse': loading && cases.length > 0,
        }"
        :globalFilterFields="['title', 'assignees', 'case_type', 'status', 'assignees']"
        sortField="updatedAt"
        :sortOrder="-1"
      >
        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
        <template #header>
          <div class="flex justify-between items-center gap-x-5">
            <div class="flex items-center gap-x-2">
              <Button
                class="-ml-2"
                type="button"
                icon="pi pi-trash"
                aria-label="Delete Selected Cases"
                v-tooltip.top="{ value: 'Delete selected Cases', showDelay: 300 }"
                severity="secondary"
                :disabled="!selectedCases.length"
                @click="openDeleteDialog(selectedCases)"
              />
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

        <Column field="assignees" header="Assignees" :showFilterMatchModes="false" :sortable="true">
          <template #body="{ data }">
            <template
              v-for="user in [userOptions.find((u) => u.name === data.assignees[0]) ?? null]"
            >
              <div class="flex items-center gap-2">
                <img
                  v-if="user"
                  alt="Placeholder Image"
                  :src="user!.image"
                  class="rounded-full w-8"
                />
                <span
                  v-else
                  class="flex justify-center items-center size-8 rounded-full bg-primary-50"
                >
                  <i class="rounded-full pi pi-user text-primary-800"></i>
                </span>

                <span class="text-nowrap max-w-28 flex gap-x-0.5">
                  <span class="truncate">{{ data.assignees[0] || 'Unassigned' }}</span>
                  <span class="flex-shrink-0">{{
                    data.assignees.length > 1 ? `(+${data.assignees.length - 1} more)` : ''
                  }}</span>
                </span>
              </div>
            </template>
          </template>
          <template #filter="{ filterModel }">
            <UserSelector
              :selected-users="userOptions.filter((u) => filterModel.value?.includes(u.name))"
              @update:selected-users="filterModel.value = $event.map((u) => u.name)"
              assigneeLabel="Assignees"
              :userOptions="userOptions"
              multi-select
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
            <CaseStatusSelect
              model-value="filterModel.value"
              placeholder="Select Status"
              display="chip"
              multi-select
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
            <Menu ref="menu" :model="menuModel" :popup="true" appendTo="body" />
            <Button
              icon="pi pi-ellipsis-v"
              @click="toggleMenu($event, slotProps.data)"
              text
              rounded
            />
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
              <p class="text-red-800">{{ error }}. Please try again.</p>
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
    :cases="selectedCasesToDelete"
    :on-delete="deleteCase"
    @update:visible="onDeleteDialogClose()"
  />
</template>
