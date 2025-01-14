<template>
  <div class="min-h-screen bg-gray-50 flex">
    <!-- Left Sidebar with Alphabet -->
    <div
      class="w-16 min-h-screen bg-white border-r border-gray-100 flex flex-col items-center py-8 sticky top-0"
    >
      <div
        v-for="letter in alphabet"
        :key="letter"
        class="w-10 h-10 mb-1 rounded-lg flex items-center justify-center cursor-pointer transition-all text-sm font-medium"
        :class="[
          activeLetters.includes(letter)
            ? selectedLetter === letter
              ? 'bg-emerald-500 text-white'
              : 'text-emerald-600 hover:bg-emerald-50'
            : 'text-gray-300 cursor-not-allowed',
        ]"
        @click="activeLetters.includes(letter) && filterByLetter(letter)"
        v-tooltip.right="
          activeLetters.includes(letter) ? `Show terms with ${letter}` : 'No terms available'
        "
      >
        {{ letter }}
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 px-8 py-8 max-w-5xl">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-semibold text-gray-900">Glossary</h1>
        <p class="mt-2 text-gray-600">Browse the most commonly used terms and definitions.</p>
      </div>

      <!-- Search and Filters -->
      <div class="flex gap-4 mb-8">
        <span class="p-input-icon-left flex flex-row gap-x-2 items-center flex-1">
          <i class="pi pi-search" />
          <InputText v-model="searchTerm" placeholder="Search terms..." class="w-full" />
        </span>
        <div class="flex gap-3">
          <!-- Filter Button with Overlay Panel -->
          <Button
            class="filter-button"
            v-tooltip.bottom="'Filter terms'"
            @click="toggleFilterOverlay"
            aria-haspopup="true"
            aria-controls="filter-overlay"
          >
            <i class="pi pi-filter mr-2"></i>
            Filter
            <Badge
              v-if="selectedCategories.length"
              :value="selectedCategories.length"
              severity="success"
            />
          </Button>

          <!-- Sort Button with Overlay Panel -->
          <Button
            class="sort-button"
            v-tooltip.bottom="'Sort terms'"
            @click="toggleSortOverlay"
            aria-haspopup="true"
            aria-controls="sort-overlay"
          >
            <i class="pi pi-sort-alt mr-2"></i>
            Sort
          </Button>
        </div>
      </div>

      <!-- Sort Overlay -->
      <OverlayPanel ref="sortOverlay" class="w-72">
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
      </OverlayPanel>

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
      <div v-if="filteredAndSortedTerms.length" class="space-y-2 relative">
        <TransitionGroup name="list">
          <div
            v-for="term in filteredAndSortedTerms"
            :key="term.term"
            class="bg-white rounded-xl border border-gray-200 hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer overflow-hidden w-full"
            :class="{ 'border-emerald-500 shadow-md': selectedTerm?.term === term.term }"
            @click="selectTerm(term)"
          >
            <div class="p-4">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <i class="pi pi-book text-emerald-500"></i>
                    </div>
                    <div>
                      <h3 class="text-lg font-medium text-gray-900">{{ term.term }}</h3>
                      <div class="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <span v-if="term.usageCount" class="flex items-center">
                          <i class="pi pi-chart-bar mr-1"></i>
                          {{ term.usageCount }} Usages
                        </span>
                        <span v-if="term.lastUsed" class="flex items-center">
                          <i class="pi pi-clock mr-1"></i>
                          {{ formatDate(term.lastUsed) }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="mt-2 flex items-center gap-3">
                    <span class="text-sm text-gray-500">
                      {{ term.relatedCases?.length || 0 }} References
                    </span>
                  </div>
                </div>
                <i class="pi pi-chevron-right text-gray-400"></i>
              </div>
            </div>
          </div>
        </TransitionGroup>
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
        <Button link class="mt-4 text-emerald-600 hover:text-emerald-700" @click="resetFilters">
          Reset filters
        </Button>
      </div>
    </div>

    <!-- Detail Sidebar -->
    <Sidebar
      v-model:visible="sidebarVisible"
      position="right"
      :style="{ width: '35rem' }"
      class="p-sidebar-lg"
    >
      <template v-if="selectedTerm">
        <div class="px-2">
          <!-- Term Header -->
          <div class="mb-8">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <i class="pi pi-book text-emerald-500 text-lg"></i>
              </div>
              <div>
                <h2 class="text-xl font-semibold text-gray-900">{{ selectedTerm.term }}</h2>
              </div>
            </div>

            <!-- Usage Statistics -->
            <div class="flex gap-4 mt-4">
              <div class="bg-gray-50 rounded-lg p-3 flex-1">
                <div class="text-sm text-gray-500">Usages</div>
                <div class="text-lg font-semibold text-gray-900">
                  {{ selectedTerm.usageCount || 0 }}
                </div>
              </div>
              <div class="bg-gray-50 rounded-lg p-3 flex-1">
                <div class="text-sm text-gray-500">Last used</div>
                <div class="text-lg font-semibold text-gray-900">
                  {{ formatDate(selectedTerm.lastUsed) || 'Never' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Term Content -->
          <div class="space-y-8">
            <!-- Related Cases -->
            <div v-if="selectedTerm.relatedCases?.length">
              <h3 class="text-sm font-medium text-gray-700 mb-3">Related Cases</h3>
              <div class="space-y-2">
                <div
                  v-for="caseRef in selectedTerm.relatedCases"
                  :key="caseRef"
                  class="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-emerald-200 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <i class="pi pi-file text-emerald-500"></i>
                  </div>
                  <span class="text-sm text-gray-600">{{ caseRef }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Sidebar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Sidebar from 'primevue/sidebar'
import Chip from 'primevue/chip'
import Badge from 'primevue/badge'
import OverlayPanel from 'primevue/overlaypanel'

interface GlossaryTerm {
  term: string
  relatedCases?: string[]
  usageCount?: number
  lastUsed?: Date
  dateAdded?: Date
}

// Glossar data
const glossaryData = ref<GlossaryTerm[]>([
  {
    term: 'Schweißgerät MIG4300Pro',
    relatedCases: ['Case #2', 'Case #4'],
    usageCount: 245,
    lastUsed: new Date('2024-01-20'),
    dateAdded: new Date('2023-06-15'),
  },
  {
    term: 'Motor',
    relatedCases: ['Case #7'],
    usageCount: 189,
    lastUsed: new Date('2024-01-22'),
    dateAdded: new Date('2023-08-01'),
  },
  {
    term: 'Stromversorgung',
    relatedCases: ['Case #3', 'Case #12'],
    usageCount: 150,
    lastUsed: new Date('2024-01-15'),
    dateAdded: new Date('2023-07-10'),
  },
  {
    term: 'Lüftungsschlitze',
    relatedCases: ['Case #9'],
    usageCount: 85,
    lastUsed: new Date('2024-01-05'),
    dateAdded: new Date('2023-09-20'),
  },
  {
    term: 'Drahtzuführung',
    relatedCases: ['Case #10', 'Case #12'],
    usageCount: 200,
    lastUsed: new Date('2024-01-18'),
    dateAdded: new Date('2023-07-25'),
  },
  {
    term: 'Drahtrolle',
    relatedCases: ['Case #9', 'Case #14'],
    usageCount: 120,
    lastUsed: new Date('2024-01-10'),
    dateAdded: new Date('2023-10-10'),
  },
])

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
const selectedTerm = ref<GlossaryTerm | null>(null)
const sidebarVisible = ref(false)
const currentSort = ref('most-used')
const filterOverlay = ref()
const sortOverlay = ref()

// Categories and filters
const selectedCategories = ref<string[]>([])

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

// Methods
const toggleFilterOverlay = (event: Event) => {
  filterOverlay.value?.toggle(event)
}

const toggleSortOverlay = (event: Event) => {
  sortOverlay.value?.toggle(event)
}

const activeLetters = computed(() => {
  return alphabet.filter((letter) =>
    glossaryData.value.some((term) => term.term.toUpperCase().startsWith(letter)),
  )
})

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

const formatDate = (date?: Date) => {
  if (!date) return ''
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

// Computed properties
const filteredAndSortedTerms = computed(() => {
  let terms = glossaryData.value

  // Apply search filter
  if (searchTerm.value) {
    terms = terms.filter((term) => term.term.toLowerCase().includes(searchTerm.value.toLowerCase()))
  }

  // Apply letter filter
  if (selectedLetter.value) {
    terms = terms.filter((term) => term.term.toUpperCase().startsWith(selectedLetter.value))
  }

  // Apply sorting
  return [...terms].sort((a, b) => {
    switch (currentSort.value) {
      case 'most-used':
        return (b.usageCount || 0) - (a.usageCount || 0)
      case 'last-used':
        return new Date(b.lastUsed || 0).getTime() - new Date(a.lastUsed || 0).getTime()
      case 'recently-added':
        return new Date(b.dateAdded || 0).getTime() - new Date(a.dateAdded || 0).getTime()
      case 'alpha-asc':
        return a.term.localeCompare(b.term)
      case 'alpha-desc':
        return b.term.localeCompare(a.term)
      default:
        return 0
    }
  })
})

const selectTerm = (term: GlossaryTerm) => {
  selectedTerm.value = term
  sidebarVisible.value = true
}
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
