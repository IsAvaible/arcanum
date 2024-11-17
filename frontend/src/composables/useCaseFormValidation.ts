import { toTypedSchema } from '@vee-validate/zod'
import { useForm, useField } from 'vee-validate'
import * as zod from 'zod'
import type { User } from '@/components/case-create-form/UserSelector.vue'
import type { Team } from '@/components/case-create-form/TeamSelector.vue'

export const useCaseFormValidation = () => {
  const schema = toTypedSchema(
    zod.object({
      title: zod
        .string({ required_error: 'Please provide a title' })
        .min(1, 'Please provide a title'),
      selectedCaseType: zod
        .string({ required_error: 'Please select at least one case type' })
        .min(1, 'Please select at least one case type'),
      selectedAssignees: zod
        .array(zod.any(), { required_error: 'Please select at least one assignee' })
        .nonempty('Please select at least one assignee'),
      selectedParticipants: zod.array(zod.any()).optional(),
      selectedTeam: zod.any().optional(),
      details: zod.string().optional(),
      selectedProducts: zod.array(zod.number()).default([]),
    }),
  )

  const {
    handleSubmit,
    errors,
    meta: form,
    isFieldDirty,
  } = useForm({
    validationSchema: schema,
  })

  const fields = {
    title: useField<string>('title'),
    selectedCaseType: useField<string>('selectedCaseType'),
    selectedAssignees: useField<User[]>('selectedAssignees'),
    selectedParticipants: useField<User[]>('selectedParticipants'),
    selectedTeam: useField<Team>('selectedTeam'),
    details: useField<string>('details'),
    selectedProducts: useField<number[]>('selectedProducts'),
  }

  const stepValid = (step: number): boolean => {
    switch (step) {
      case 0:
        return !(errors.value.title || errors.value.selectedCaseType)
      case 1:
        return !(
          errors.value.selectedAssignees ||
          errors.value.selectedParticipants ||
          errors.value.selectedTeam
        )
      case 2:
        return !errors.value.details
      case 3:
        return !errors.value.selectedProducts
      case 4:
        return true
      default:
        return false
    }
  }

  // Step validation functions
  const validateStep = async (step: number) => {
    switch (step) {
      case 0:
        await fields.title.validate()
        await fields.selectedCaseType.validate()
        return
      case 1:
        await fields.selectedAssignees.validate()
        await fields.selectedParticipants.validate()
        await fields.selectedTeam.validate()
        return
      case 2:
        await fields.details.validate()
        return
      case 3:
        await fields.selectedProducts.validate()
        return
    }
  }

  return {
    handleSubmit,
    errors,
    form,
    isFieldDirty,
    fields,
    stepValid,
    validateStep,
  }
}
