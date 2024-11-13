<script setup lang="ts">
import { ref, computed } from 'vue'
import InputText from 'primevue/inputtext'
import DataView from 'primevue/dataview'
import SelectButton from 'primevue/selectbutton'

import { ArrowArchery, CubeCutWithCurve, Cut, FireFlame, ReportColumns, Sparks } from '@iconoir/vue'

const categories = ref([
  { name: 'All Products', count: 110, icon: ReportColumns },
  { name: 'Cutting', count: 20, icon: Cut },
  { name: 'Milling', count: 20, icon: CubeCutWithCurve },
  { name: 'Drilling', count: 20, icon: ArrowArchery },
  { name: 'Grinding', count: 20, icon: Sparks },
  { name: 'Welding', count: 20, icon: FireFlame },
])

// Sample data for items
const items = ref([
  {
    name: 'Beef Crowich',
    category: 'Sandwich',
    price: 5.5,
    image: 'https://placecats.com/320/240',
  },
  {
    name: 'Buttermelt Croissant',
    category: 'Pastry',
    price: 4.0,
    image: 'https://placecats.com/320/241',
  },
  {
    name: 'Cereal Cream Donut',
    category: 'Donut',
    price: 2.45,
    image: 'https://placecats.com/320/242',
  },
  {
    name: 'Cheesy Cheesecake',
    category: 'Cake',
    price: 3.75,
    image: 'https://placecats.com/320/243',
  },
  {
    name: 'Chicken Sandwich',
    category: 'Sandwich',
    price: 5.0,
    image: 'https://placecats.com/320/244',
  },
  // Add other items...
])

const searchQuery = ref('')
const selectedCategory = ref('All Products')

const filteredItems = computed(() => {
  if (!searchQuery.value) return items.value
  return items.value.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})
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
    <div class="flex items-stretch gap-x-4">
      <div class="relative w-full">
        <InputText
          placeholder="Search something technical on your mind..."
          v-model="searchQuery"
          class="w-full rounded-full relative"
        />
        <button class="absolute inline-flex items-center pr-4 h-full right-0 text-slate-500">
          <i class="pi pi-search" />
        </button>
      </div>
    </div>

    <!-- Menu Items -->
    <DataView :value="filteredItems" layout="grid" :paginator="true" :rows="4">
      <template #grid="slotProps">
        <div class="grid grid-cols-12 gap-6 pb-4">
          <div
            v-for="(item, index) in slotProps.items"
            :key="index"
            class="col-span-12 sm:col-span-6 md:col-span-4 xl:col-span-3 cursor-pointer ring-2 ring-slate-100 rounded-lg p-4"
          >
            <div class="flex flex-col gap-y-2">
              <img :src="item.image" :alt="item.name" class="rounded-lg w-full h-40 object-cover" />
              <div class="flex justify-between">
                <h4 class="font-semibold">{{ item.name }}</h4>
                <p class="text-primary-500 font-semibold">${{ item.price }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </DataView>
  </div>
</template>

<style scoped></style>
