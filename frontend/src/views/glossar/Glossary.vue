<template>
  <div class="min-h-screen bg-gray-50 flex">
    <!-- Left Sidebar with Alphabet -->
    <div
      class="min-w-16 min-h-screen bg-white border-r border-gray-100 flex flex-col items-center py-4 sticky top-0 gap-y-0.5"
    >
      <button
        v-for="letter in alphabet"
        :key="letter"
        class="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-all text-sm font-medium first:mt-auto last:mb-auto"
        :class="[
          activeLetters.includes(letter)
            ? selectedLetter === letter
              ? 'bg-emerald-500 text-white'
              : 'text-emerald-600 hover:bg-emerald-50'
            : 'text-gray-300 cursor-not-allowed',
        ]"
        @click="activeLetters.includes(letter) && filterByLetter(letter)"
        v-tooltip.right="{
          value: activeLetters.includes(letter)
            ? `Show terms with ${letter}`
            : 'No terms available',
          showDelay: 1000,
        }"
      >
        {{ letter }}
      </button>
    </div>

    <!-- Main Content -->
    <div class="flex-1 overflow-auto px-8 py-8 max-w-5xl">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-semibold text-gray-900">Glossary</h1>
        <p class="mt-2 text-gray-600">Browse the most commonly used terms and definitions.</p>
      </div>

      <!-- Search and Filters -->
      <div class="flex gap-2 sm:gap-4 mb-8">
        <IconField class="flex-1">
          <InputIcon>
            <i class="pi pi-search" />
          </InputIcon>
          <InputText v-model="searchTerm" placeholder="Search terms..." class="w-full" />
        </IconField>
        <div class="flex gap-3">
          <!-- Filter Button with Overlay Panel -->
          <!--          <Button-->
          <!--            class="filter-button"-->
          <!--            v-tooltip.bottom="'Filter terms'"-->
          <!--            @click="toggleFilterOverlay"-->
          <!--            aria-haspopup="true"-->
          <!--            aria-controls="filter-overlay"-->
          <!--          >-->
          <!--            <i class="pi pi-filter mr-2"></i>-->
          <!--            Filter-->
          <!--            <Badge-->
          <!--              v-if="selectedCategories.length"-->
          <!--              :value="selectedCategories.length"-->
          <!--              severity="success"-->
          <!--            />-->
          <!--          </Button>-->

          <!-- Sort Button with Overlay Panel -->
          <Button
            class="sort-button"
            v-tooltip.bottom="'Sort terms'"
            @click="toggleSortOverlay"
            aria-haspopup="true"
            aria-controls="sort-overlay"
          >
            <i class="pi pi-sort-alt"></i>
            <span class="hidden sm:inline ml-2">Sort</span>
          </Button>
        </div>
      </div>

      <!-- Sort Overlay -->
      <Popover ref="sortOverlay" class="w-72">
        <div class="p-4">
          <h3 class="text-sm font-medium text-gray-700 mb-3">Sorting</h3>
          <div class="space-y-2">
            <div
              v-for="option in sortOptions"
              :key="option.value"
              class="flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-50"
              :class="{ 'bg-emerald-50 text-emerald-600': currentSort === option.value }"
              @click="setSort(option.value)"
            >
              <i :class="option.icon" class="mr-2"></i>
              {{ option.label }}
            </div>
          </div>
        </div>
      </Popover>

      <!-- Active Filters -->
      <div v-if="selectedCategories.length" class="mb-4 flex flex-wrap gap-2">
        <Chip
          v-for="category in selectedCategories"
          :key="category"
          :label="category"
          class="bg-emerald-50 text-emerald-600"
          removable
          @remove="toggleCategory(category)"
        />
        <Button
          link
          class="text-sm text-gray-500 hover:text-emerald-600"
          @click="selectedCategories = []"
        >
          Reset filters
        </Button>
      </div>

      <!-- Terms List -->
      <div v-if="filteredAndSortedEntries.length" class="space-y-2 relative">
        <TransitionGroup name="list">
          <div
            v-for="entry in filteredAndSortedEntries"
            :key="entry.term"
            class="bg-white rounded-xl border border-gray-200 hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer overflow-hidden w-full"
            :class="{ 'border-emerald-500 shadow-md': selectedEntry?.term === entry.term }"
            @click="selectEntry(entry)"
          >
            <div class="p-4">
              <div class="flex items-center justify-between">
                <div class="flex-1 truncate">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <i class="pi pi-book text-emerald-500"></i>
                    </div>
                    <div>
                      <h3 class="text-lg font-medium text-gray-900">{{ entry.term }}</h3>
                      <div class="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <span v-if="entry.usageCount" class="flex items-center">
                          <i class="pi pi-chart-bar mr-1"></i>
                          {{ entry.usageCount }} Usages
                        </span>
                        <span
                          class="flex items-center"
                          v-tooltip.bottom="{ value: 'Last Used At', showDelay: 500 }"
                        >
                          <i class="pi pi-clock mr-1"></i>
                          {{ formatDate(entry.updatedAt ?? entry.createdAt) }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="mt-2 flex items-center gap-3">
                    <span class="text-sm text-gray-500">
                      {{ entry.usageCount || 0 }} References
                    </span>
                  </div>
                </div>
                <i class="pi pi-chevron-right text-gray-400"></i>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- Loading State -->
      <div v-else-if="loading" class="space-y-2">
        <Skeleton v-for="_ in 10" height="7rem" class="w-full" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12 bg-white rounded-xl border border-gray-200">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
          <i class="pi pi-exclamation-circle text-red-500 text-xl"></i>
        </div>
        <h3 class="text-lg font-medium text-gray-900">An error occurred</h3>
        <p class="text-gray-500 mt-2">{{ error }}</p>
        <Button text severity="danger" class="mt-4" @click="fetchGlossary"> Retry </Button>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12 bg-white rounded-xl border border-gray-200">
        <div
          class="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center"
        >
          <i class="pi pi-search text-emerald-500 text-xl"></i>
        </div>
        <h3 class="text-lg font-medium text-gray-900">No terms found</h3>
        <p class="text-gray-500 mt-2">Try adjusting your search criteria</p>
        <Button text severity="success" class="mt-4" @click="resetFilters"> Reset filters </Button>
      </div>
    </div>

    <!-- Detail Sidebar -->
    <GlossaryEntryDrawer :entry="selectedEntry" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Chip from 'primevue/chip'
import Popover from 'primevue/popover'
import Skeleton from 'primevue/skeleton'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

import type { GlossaryEntry } from '@/api'
import type { AxiosError } from 'axios'

import { normalize as removeDiacritics } from 'normalize-diacritics'
import { useApi } from '@/composables/useApi'
import { asyncComputed, computedAsync } from '@vueuse/core'
import { formatDate } from '@/functions/formatDate'
import GlossaryEntryDrawer from '@/components/GlossaryEntryDrawer.vue'

const api = useApi()

// Glossar data
const glossaryData = ref<GlossaryEntry[]>([])

// Fetch glossary data
const loading = ref(true)
const error = ref<string | null>(null)
const fetchGlossary = async () => {
  loading.value = true
  try {
    const response = await api.glossaryGet()
    glossaryData.value = response.data
  } catch (e) {
    error.value = (e as AxiosError).message
  } finally {
    loading.value = false
  }
}

// Sort options
const sortOptions = [
  { label: 'Meistgenutzte Begriffe', value: 'most-used', icon: 'pi pi-chart-bar' },
  { label: 'Zuletzt verwendet', value: 'last-used', icon: 'pi pi-clock' },
  { label: 'Zuletzt hinzugefügt', value: 'recently-added', icon: 'pi pi-plus' },
  { label: 'Alphabetisch A-Z', value: 'alpha-asc', icon: 'pi pi-sort-alpha-down' },
  { label: 'Alphabetisch Z-A', value: 'alpha-desc', icon: 'pi pi-sort-alpha-up' },
]

// UI state
const searchTerm = ref('')
const selectedLetter = ref('')
const selectedEntry = ref<GlossaryEntry | null>(null)
const currentSort = ref('most-used')
const filterOverlay = ref()
const sortOverlay = ref()

// Categories and filters
const selectedCategories = ref<string[]>([])

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('')

// Methods
const _toggleFilterOverlay = (event: Event) => {
  filterOverlay.value?.toggle(event)
}

const toggleSortOverlay = (event: Event) => {
  sortOverlay.value?.toggle(event)
}

const activeLetters = computedAsync(async () => {
  // Create a set to store active letters
  const activeLettersSet = new Set<string>()

  // Process all terms once and check their first letter
  await Promise.all(
    glossaryData.value.map(async (entry) => {
      const normalizedTerm = await removeDiacritics(entry.term)
      const firstLetter = normalizedTerm.charAt(0).toUpperCase()
      if (alphabet.includes(firstLetter)) {
        activeLettersSet.add(firstLetter)
      } else {
        activeLettersSet.add('#')
      }
    }),
  )

  // Convert the set to an array and return only the letters that are in the alphabet
  return Array.from(activeLettersSet).filter((letter) => alphabet.includes(letter))
}, [])

const filterByLetter = (letter: string) => {
  selectedLetter.value = selectedLetter.value === letter ? '' : letter
}

const toggleCategory = (category: string) => {
  const index = selectedCategories.value.indexOf(category)
  if (index === -1) {
    selectedCategories.value.push(category)
  } else {
    selectedCategories.value.splice(index, 1)
  }
}

const setSort = (sortValue: string) => {
  currentSort.value = sortValue
  sortOverlay.value?.hide()
}

const resetFilters = () => {
  searchTerm.value = ''
  selectedLetter.value = ''
  selectedCategories.value = []
  currentSort.value = 'most-used'
}

/**
 * Filter and sort the glossary entries based on the current search term, selected letter, and sorting option.
 */
const filteredAndSortedEntries = asyncComputed(async () => {
  // Register dependencies
  const _ = searchTerm.value + selectedLetter.value + currentSort.value

  let entries = glossaryData.value
  const normalizedSearchTerm = (await removeDiacritics(searchTerm.value)).toUpperCase()

  const results = await Promise.all(
    entries.map(async (entry) => {
      const normalizedTerm = (await removeDiacritics(entry.term)).toUpperCase()

      const termStartsWithLetter =
        !selectedLetter.value ||
        normalizedTerm.startsWith(selectedLetter.value) ||
        (alphabet.includes(normalizedTerm.charAt(0)) && selectedLetter.value === '#')
      const termContainsSearch = !searchTerm.value || normalizedTerm.includes(normalizedSearchTerm)

      return termStartsWithLetter && termContainsSearch
    }),
  )

  // Apply filters
  entries = entries.filter((_, index) => results[index])

  // Apply sorting
  return [...entries].sort((a, b) => {
    switch (currentSort.value) {
      case 'most-used':
        return (b.usageCount || 0) - (a.usageCount || 0)
      case 'last-used':
        return (
          new Date(b.updatedAt ?? b.createdAt).getTime() -
          new Date(a.updatedAt ?? a.createdAt).getTime()
        )
      case 'recently-added':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'alpha-asc':
        return a.term.localeCompare(b.term)
      case 'alpha-desc':
        return b.term.localeCompare(a.term)
      default:
        return 0
    }
  })
}, [])

/**
 * Select a glossary entry and fetch its detailed information.
 * @param entry The glossary entry to select.
 */
const selectEntry = (entry: GlossaryEntry) => {
  selectedEntry.value = entry
}

// Fetch glossary data on component mount
onMounted(() => {
  fetchGlossary()
})
</script>

<style scoped>
:deep(.p-sidebar-content) {
  padding: 2rem;
}

:deep(.p-inputtext) {
  @apply border-gray-200 rounded-xl;
}

:deep(.p-tag) {
  @apply bg-emerald-50 text-emerald-600 border-none;
}

:deep(.p-chip) {
  @apply cursor-pointer transition-colors;
}

.filter-button,
.sort-button {
  @apply bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 transition-all;
}

/* List Transitions */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
}

.list-leave-active {
  position: absolute;
  width: 100%;
}
</style>

<style>
/* Global styles for tooltips */
.p-tooltip {
  @apply max-w-xs;
}

.p-tooltip .p-tooltip-text {
  @apply text-xs bg-gray-800 px-2 py-1;
}
</style>
