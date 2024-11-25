<template>
  <div class="flex flex-1">
    <div class="transition-all duration-300 p-6 space-y-6 mx-auto">
      <div class="flex items-center justify-between">
        <div class="flex gap-4">
          <h1 class="text-3xl font-bold">Cases</h1>
        </div>
        <Button label="Case Create" icon="pi pi-plus" @click="$router.push('/case-create')" />
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
        @row-click="$router.push({ name: 'case-detail' })"
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
              outlined
              @click="clearFilters()"
            />
            <IconField>
              <InputIcon>
                <i class="pi pi-search" />
              </InputIcon>
              <InputText v-model="filters['global'].value" placeholder="Keyword Search" />
            </IconField>
          </div>
        </template>

        <Column field="id" header="Case ID" sortable />

        <Column field="titleId" header="Title ID" sortable>
          <template #filter="{ filterModel }">
            <InputText v-model="filterModel.value" type="text" placeholder="Search Title ID" />
          </template>
        </Column>

        <Column field="caseType" header="Case Type" sortable>
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

        <Column field="status" header="Status" sortable>
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

        <!--        <Column field="assignee" header="Assignee" sortable>-->
        <!--          <template #filter="{ filterModel }">-->
        <!--            <Select-->
        <!--              v-model="filterModel.value"-->
        <!--              :options="[-->
        <!--                { label: 'Unassigned', value: 'Unassigned' },-->
        <!--                { label: 'Assigned', value: 'Assigned' },-->
        <!--              ]"-->
        <!--              optionLabel="label"-->
        <!--              optionValue="value"-->
        <!--              placeholder="Select Assignee"-->
        <!--            />-->
        <!--          </template>-->
        <!--        </Column>-->

        <Column field="createdBy.name" header="Created by" sortable>
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

        <Column field="updatedOn" header="Updated" data-type="date" sortable>
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
            <Button
              icon="pi pi-ellipsis-v"
              @click="toggleMenu($event, slotProps.data.id)"
              text
              rounded
            />
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
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { FilterMatchMode } from '@primevue/core/api'
import { useTimeAgo } from '@vueuse/core'

// PrimeVue imports
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

const menu = ref()
const loading = ref(false)

const filters = ref()

const initFilter = () => {
  filters.value = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    titleId: { constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    caseType: { constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    status: { constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    assignee: { constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    'createdBy.name': { constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    updatedOn: { constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
  }
}

initFilter()

const cases = reactive<Case[]>([])

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

for (let i = 1; i <= 20; i++) {
  const randomName = names[Math.floor(Math.random() * names.length)]
  const caseItem = {
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
  }
  cases.push(caseItem)
}

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

const toggleMenu = (event: Event, _id: number) => {
  menu.value.toggle(event)
}

const getMenuItems = (caseItem: Case) => {
  return [
    {
      label: caseItem.isArchived ? 'Unarchive Item' : 'Archive Item',
      icon: 'pi pi-inbox',
      command: () => toggleArchive(caseItem.id),
    },
    {
      label: 'Delete Item',
      icon: 'pi pi-trash',
      command: () => deleteCase(caseItem.id),
    },
  ]
}

const toggleArchive = (id: number) => {
  const caseItem = cases.find((item) => item.id === id)
  if (caseItem) {
    caseItem.isArchived = !caseItem.isArchived
  }
}

const deleteCase = (id: number) => {
  const index = cases.findIndex((item) => item.id === id)
  if (index !== -1) {
    cases.splice(index, 1)
  }
}

const clearFilters = () => {
  initFilter()
}

const formatDate = (date: Date, ago: boolean = false) => {
  return ago ? useTimeAgo(date) : date.toLocaleDateString()
}
</script>
