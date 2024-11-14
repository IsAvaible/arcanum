<script setup lang="ts">
import { ref, computed } from 'vue'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Button from 'primevue/button'

import DataView from 'primevue/dataview'
import SelectButton from 'primevue/selectbutton'

import { ArrowArchery, CubeCutWithCurve, Cut, FireFlame, ReportColumns, Sparks } from '@iconoir/vue'

type Category = {
  name: string
  count: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
}

type Item = {
  id: number
  name: string
  category: string
  price: number
  image: string
}

const categories = ref<Category[]>([
  { name: 'All Products', count: 110, icon: ReportColumns },
  { name: 'Cutting', count: 20, icon: Cut },
  { name: 'Milling', count: 20, icon: CubeCutWithCurve },
  { name: 'Drilling', count: 20, icon: ArrowArchery },
  { name: 'Grinding', count: 20, icon: Sparks },
  { name: 'Welding', count: 20, icon: FireFlame },
])

// Sample data for items
const items = ref<Item[]>([
  {
    id: 1,
    name: 'Brownie Sandwich',
    category: 'Cutting',
    price: 5.5,
    image: 'https://placecats.com/320/240',
  },
  {
    id: 2,
    name: 'Buttermelt Croissant',
    category: 'Grinding',
    price: 4.0,
    image: 'https://placecats.com/320/241',
  },
  {
    id: 3,
    name: 'Cereal Cream Donut',
    category: 'Cutting',
    price: 2.45,
    image: 'https://placecats.com/320/247',
  },
  {
    id: 4,
    name: 'Cheesy Cheesecake',
    category: 'Welding',
    price: 3.75,
    image: 'https://placecats.com/320/243',
  },
  {
    id: 5,
    name: 'Soufflé',
    category: 'Drilling',
    price: 5.0,
    image: 'https://placecats.com/320/245',
  },
  // Add other items...
])

const selectedItems = ref<number[]>([])

const searchQuery = ref('')
const selectedCategory = ref('All Products')

const filteredItems = computed(() => {
  if (!searchQuery.value && selectedCategory.value == 'All Products') {
    return items.value
  }
  return items.value.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) &&
      (selectedCategory.value === 'All Products' || item.category === selectedCategory.value),
  )
})

const selectItem = (id: number) => {
  if (selectedItems.value.includes(id)) {
    selectedItems.value = selectedItems.value.filter((itemId) => itemId !== id)
  } else {
    selectedItems.value = [...selectedItems.value, id]
  }
}
</script>

<template>
  <div class="flex flex-col gap-y-4">
    <div class="flex gap-x-8 overflow-x-auto p-0.5">
      <SelectButton
        :options="categories"
        :model-value="categories.find((category) => category.name === selectedCategory)"
        @update:model-value="selectedCategory = $event.value.name"
        optionLabel="name"
        placeholder="Select a Category"
        class="mx-auto lg:hidden"
      >
        <template #option="slotProps">
          <span v-tooltip.top="slotProps.option.name" class="flex gap-x-1.5 items-center">
            <component :is="slotProps.option.icon" />
            <span class="hidden md:inline text-sm">{{ slotProps.option.name }}</span>
          </span>
        </template>
      </SelectButton>
      <div
        :class="[
          'lg:flex flex-col flex-1 gap-y-4 ring-2 rounded-lg p-3 cursor-pointer hidden',
          selectedCategory === category.name ? 'ring-primary-500' : 'ring-slate-100',
        ]"
        v-for="category in categories"
        @click="selectedCategory = category.name"
      >
        <div
          :class="[
            'flex items-center justify-center p-2.5 rounded-full size-10',
            selectedCategory === category.name
              ? 'bg-primary-500 text-white'
              : 'bg-slate-100 text-slate-600',
          ]"
        >
          <component :is="category.icon" />
        </div>
        <div>
          <h4 class="font-semibold">{{ category.name }}</h4>
          <p>{{ category.count }} Items</p>
        </div>
      </div>
    </div>

    <!-- Search Bar -->
    <InputGroup class="w-full">
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText
          class="w-full rounded-md border-l-white"
          placeholder="Search something technical on your mind..."
          v-model="searchQuery"
        />
      </IconField>

      <InputGroupAddon>
        <Button icon="pi pi-filter" size="small" severity="secondary" variant="text" />
      </InputGroupAddon>
    </InputGroup>

    <!-- Menu Items -->
    <DataView :value="filteredItems" layout="grid" :paginator="true" :rows="4" data-key="id">
      <template #grid="slotProps">
        <div role="list" class="grid grid-cols-12 gap-6 p-4 bg-slate-100 rounded-lg">
          <button
            v-for="item in slotProps.items"
            :key="item.id"
            @click="selectItem(item.id)"
            class="col-span-12 sm:col-span-6 md:col-span-4 xl:col-span-3 cursor-pointer ring-2 rounded-lg p-4 transition-all outline-none"
            :class="[
              selectedItems.includes(item.id)
                ? 'bg-primary-50 ring-primary-400 hover:bg-primary-50 hover:ring-primary-600 focus-visible:ring-primary-600'
                : 'bg-white ring-transparent hover:ring-slate-200 focus-visible:ring-slate-400',
            ]"
            role="button"
            :aria-selected="selectedItems.includes(item.id)"
            tabindex="0"
          >
            <div class="flex flex-col gap-y-2">
              <img :src="item.image" :alt="item.name" class="rounded-lg w-full h-40 object-cover" />
              <div class="flex justify-between">
                <h4 class="font-semibold">{{ item.name }}</h4>
                <p class="font-semibold text-primary-500">${{ item.price }}</p>
              </div>
            </div>
          </button>
        </div>
      </template>

      <template #empty>
        <div class="grid grid-cols-12 gap-6 p-4 bg-slate-100 rounded-lg relative">
          <div class="flex flex-col gap-y-2 p-4 invisible">
            <div class="h-40 w-full" />
            <div class="flex justify-between">
              <h4 class="font-semibold">Placeholder</h4>
              <p class="font-semibold text-primary-500">$</p>
            </div>
          </div>
          <p
            class="text-lg flex flex-col items-center font-semibold text-slate-800 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            No items found.
            <span class="text-sm">
              {{ searchQuery ? 'Try another search query or category.' : 'Try another category.' }}
            </span>
          </p>
        </div>
      </template>
    </DataView>
  </div>
</template>

<style scoped></style>
