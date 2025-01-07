import { useField } from 'vee-validate'
import { type CaseSchemaType } from '@/validation/schemas'

export const useCaseFields = () => {
  return {
    title: useField<CaseSchemaType['title']>('title'),
    type: useField<CaseSchemaType['case_type']>('case_type'),
    status: useField<CaseSchemaType['status']>('status'),
    priority: useField<CaseSchemaType['priority']>('priority'),

    description: useField<CaseSchemaType['description']>('description'),
    solution: useField<CaseSchemaType['solution']>('solution'),

    assignees: useField<string[]>('assignees'),
    participants: useField<CaseSchemaType['participants']>('participants'),
    team: useField<CaseSchemaType['team']>('team'),

    selectedProducts: useField<CaseSchemaType['products']>('products'),

    draft: useField<CaseSchemaType['draft']>('draft'),
  }
}
