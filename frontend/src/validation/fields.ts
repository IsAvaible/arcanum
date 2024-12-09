import { useField } from 'vee-validate'
import type { CaseCaseTypeEnum, CasePriorityEnum, CaseStatusEnum } from '@/api'

export const useCaseFields = () => {
  return {
    title: useField<string>('title'),
    type: useField<CaseCaseTypeEnum>('case_type'),
    status: useField<CaseStatusEnum>('status'),
    priority: useField<CasePriorityEnum>('priority'),

    description: useField<string>('description'),
    solution: useField<string>('solution'),

    assignees: useField<string[]>('assignees'),
    participants: useField<string[]>('participants'),
    team: useField<string>('team'),

    selectedProducts: useField<number[]>('products'),

    draft: useField<boolean>('draft'),
  }
}
