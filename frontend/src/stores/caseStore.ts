import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface CaseData {
  [key: string]: any
  number: string
  type: string
  createdBy: string
  createdOn: Date
  updatedOn: Date
  reference: string
  description: string
  solution: string
  priority: any
  status: any
  assignee: any
  lastModifiedBy?: string
  lastModifiedAt?: Date
  data?: {
    type: string
    content: string
    files?: File[]
  }
}

export const useCaseStore = defineStore('case', () => {
  const currentCase = ref<CaseData | null>(null)
  const isLoading = ref(false)
  const userPermissions = ref({
    canEdit: true // This should come from your auth system
  })
  const originalData = ref<CaseData | null>(null)

  // Computed
  const hasUnsavedChanges = computed(() => {
    if (!originalData.value || !currentCase.value) return false
    return JSON.stringify(originalData.value) !== JSON.stringify(currentCase.value)
  })

  // Actions
  const fetchCase = async (caseNumber: string) => {
    isLoading.value = true
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      // In real implementation, fetch from API
      currentCase.value = {
        number: caseNumber,
        type: 'Servicecase',
        createdBy: 'Jason Nicholas Arifin',
        createdOn: new Date('2024-10-25T10:28:00'),
        updatedOn: new Date('2024-10-25T10:28:00'),
        reference: '1234',
        description: '',
        solution: '',
        priority: null,
        status: null,
        assignee: null,
        data: {
          type: 'text',
          content: ''
        }
      }
      // Store original data for comparison
      originalData.value = JSON.parse(JSON.stringify(currentCase.value))
    } catch (error) {
      console.error('Error fetching case:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const saveCase = async () => {
    isLoading.value = true
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      // Update original data after successful save
      originalData.value = JSON.parse(JSON.stringify(currentCase.value))
      return true
    } catch (error) {
      console.error('Error saving case:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const resetChanges = () => {
    if (originalData.value) {
      currentCase.value = JSON.parse(JSON.stringify(originalData.value))
    }
  }

  const checkConcurrentEdit = async () => {
    // Simulate API call to check last modification
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      hasConflict: false,
      serverData: null
    }
  }

  return {
    currentCase,
    isLoading,
    userPermissions,
    hasUnsavedChanges,
    fetchCase,
    saveCase,
    resetChanges,
    checkConcurrentEdit
  }
})
