import { ref, watch } from 'vue'

export const useCaseFormStepper = (
  validateStep: (step: number) => Promise<void>,
  stepValid: (step: number) => boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isFieldDirty: (path: string | any) => boolean,
) => {
  const activeStep = ref(0)
  const maxStep = ref(0)
  const formEndReached = ref(false)

  watch(activeStep, (newStep) => {
    if (newStep > maxStep.value) {
      maxStep.value = newStep
    }
  })

  const nextStep = async (totalSteps: number) => {
    if (activeStep.value < totalSteps - 1) {
      await validateStep(activeStep.value)
      if (stepValid(activeStep.value)) {
        activeStep.value++
        if (activeStep.value === totalSteps - 1) {
          formEndReached.value = true
        }
      } else {
      }
    }
  }

  const prevStep = () => {
    if (activeStep.value > 0) {
      if (stepValid(activeStep.value)) {
        activeStep.value--
      } else {
      }
    }
  }

  /**
   * Check if the given step has been interacted with
   *
   * @param step The step to check
   */
  const stepInteracted = (step: number = activeStep.value): boolean => {
    switch (step) {
      case 0:
        return (isFieldDirty('title') && isFieldDirty('selectedCaseType')) || !stepValid(0)
      case 1:
        return isFieldDirty('selectedAssignees') || !stepValid(1)
      case 2:
        return maxStep.value >= 2
      case 3:
        return maxStep.value >= 3
      case 4:
        return maxStep.value >= 4
      default:
        return false
    }
  }

  return {
    activeStep,
    maxStep,
    formEndReached,
    nextStep,
    prevStep,
    stepInteracted,
  }
}
