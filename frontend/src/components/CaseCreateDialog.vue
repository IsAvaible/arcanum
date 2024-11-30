<script setup lang="ts">
import Dialog from 'primevue/dialog'

import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionContent from 'primevue/accordioncontent'

import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Button from 'primevue/button'
import Divider from 'primevue/divider'

import { useToast } from 'primevue'

import { CoinsSwap, CpuWarning, QuestionMark, WarningTriangle } from '@iconoir/vue'

import Label from '@/components/case-create-form/Label.vue'
import CaseTypeSelector from '@/components/case-create-form/CaseTypeSelector.vue'
import UserSelector, { type User } from '@/components/case-create-form/UserSelector.vue'
import TempEditor from '@/components/case-create-form/TempEditor.vue'
import ProductSelector from '@/components/case-create-form/ProductSelector.vue'
import TeamSelector from '@/components/case-create-form/TeamSelector.vue'

import { useCaseFormValidation } from '@/composables/useCaseFormValidation'
import { useCaseFormStepper } from '@/composables/useCaseFormStepper'
import StepHeader from '@/components/case-create-form/StepHeader.vue'
import CaseCreateStepper from '@/components/case-create-form/CaseCreateStepper.vue'
import { toTypedSchema } from '@vee-validate/zod'
import * as zod from 'zod'
import { useForm } from 'vee-validate'
import { ref } from 'vue'
import { useVModel } from '@vueuse/core'
import { useApi } from '@/composables/useApi'
import type { CasesPostCaseTypeEnum } from '@/api'

const toast = useToast()

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits(['update:visible'])

const api = useApi()

const dialogVisible = useVModel(props, 'visible', emit)

const caseTypes = [
  {
    icon: CpuWarning,
    title: 'Problem',
    description:
      'For cases focused on identifying, analyzing, and resolving recurring or complex issues, often requiring investigation and root cause analysis.',
  },
  {
    icon: WarningTriangle,
    title: 'Incident',
    description:
      'For cases that involve unexpected events or issues requiring immediate attention, such as system outages, customer complaints, or safety hazards.',
  },
  {
    icon: CoinsSwap,
    title: 'Change',
    description:
      'For cases involving modifications to existing processes, systems, or resources, often requiring approvals and impact analysis.',
  },
  {
    icon: QuestionMark,
    title: 'FAQ',
    description:
      'For documenting frequently asked questions or common inquiries to provide quick, standardized answers for future reference.',
  },
]

const peopleOptions: User[] = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  name: `Cat ${i + 1}`,
  image: `https://placecats.com/${50 + i}/${50 + i}`,
}))

// Form validation setup
// Couldn't move to composable because of https://github.com/microsoft/TypeScript/pull/58176#issuecomment-2052698294
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
    description: zod.string().optional(),
    solution: zod.string().optional(),
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

// Form validation composable
const {
  fields,
  stepValid: stepValidInner,
  validateStep: validateStepInner,
} = useCaseFormValidation(errors)

const stepValid = (step: number = activeStep.value): boolean => {
  return stepValidInner(step)
}

const validateStep = async (step: number = activeStep.value): Promise<void> => {
  await validateStepInner(step)
}

const hasErrors = () => {
  return Object.keys(errors.value).length !== 0
}

// Stepper setup
const {
  activeStep,
  maxStep: _maxStep,
  formEndReached,
  nextStep,
  prevStep,
  stepInteracted,
} = useCaseFormStepper(validateStep, stepValid, isFieldDirty)

const steps = [
  { label: 'Basics', icon: 'pi-info-circle' },
  { label: 'People', icon: 'pi-user' },
  { label: 'Details', icon: 'pi-pen-to-square' },
  { label: 'Products', icon: 'pi-warehouse' },
  { label: 'Review', icon: 'pi-star' },
]

/**
 * Determine if this header should be clickable
 */
const isClickable = (step: number) => {
  if (activeStep.value === step) {
    return true
  } else {
    if (hasErrors()) {
      return false
    }
    // Check if all previous steps where interacted with
    for (let i = 0; i < step; i++) {
      if (!stepInteracted(i)) {
        return false
      }
    }
    return true
  }
}

enum SubmitState {
  IDLE,
  SUBMITTING,
  SUCCESS,
  ERROR,
}
const submitState = ref<SubmitState>(SubmitState.IDLE)
// Form submission
const onSubmit = handleSubmit(async (_values) => {
  console.log('Submitting form', _values)
  submitState.value = SubmitState.SUBMITTING
  try {
    await api.casesPost(
      {
        title: fields.title.value.value,
        caseType: fields.selectedCaseType.value.value as CasesPostCaseTypeEnum,
        assignee: fields.selectedAssignees.value.value[0]!.name,
        // assignees: fields.selectedAssignees.value.value,
        // participants: fields.selectedParticipants.value.value,
        // team: fields.selectedTeam.value.value,
        // details: fields.details.value.value,
        description: fields.description.value.value,
        solution: fields.solution.value.value,
        priority: 'Low',
        // products: fields.selectedProducts.value.value,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    submitState.value = SubmitState.ERROR
    setTimeout(() => {
      submitState.value = SubmitState.IDLE
    }, 3000)
    console.error('Error creating case', error)
    toast.add({
      severity: 'error',
      summary: 'Error Creating Case',
      detail: 'There was an error creating your case',
      life: 3000,
    })
    return
  }

  submitState.value = SubmitState.SUCCESS
  toast.add({
    severity: 'success',
    summary: 'Case Created',
    detail: 'Your case has been successfully created',
    life: 3000,
  })
  dialogVisible.value = false
})

const dialogPT = {
  content: {
    class: 'flex-1',
  },
  footer: {
    class: 'pt-5',
  },
}
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    class="w-[calc(100%-3rem)] max-w-7xl bg-slate-100 h-[calc(100%-3rem)] max-h-[min(1024px, calc(100%-3rem))] flex flex-col"
    :modal="true"
    :closable="false"
    :pt="dialogPT"
  >
    <template #header>
      <div class="w-full -m-5 p-5 box-content bg-white rounded-t-xl overflow-x-auto">
        <CaseCreateStepper
          v-model="activeStep"
          :steps="steps"
          :stepValid="stepValid"
          :stepInteracted="stepInteracted"
          :isClickable="isClickable"
        />
      </div>
    </template>

    <section class="flex flex-col gap-y-5 p-7 h-full">
      <h1 class="text-2xl font-semibold">Create Case</h1>

      <Accordion
        :value="activeStep"
        @update:value="activeStep = +$event!"
        class="bg-white h-full md-h:max-h-[calc(100%-3.25rem)] flex flex-col"
        :select-on-focus="true"
      >
        <AccordionPanel :value="0" :disabled="!isClickable(0)">
          <StepHeader
            :step="0"
            :activeStep="activeStep"
            :stepValid="stepValid"
            :stepInteracted="stepInteracted"
            title="Basic Information"
          />
          <AccordionContent>
            <div class="flex flex-col gap-y-4">
              <Label for="title" label="Case Title (*)" description="The title of your new case" />
              <div class="w-full">
                <InputText
                  id="title"
                  v-model="fields.title.value.value"
                  placeholder="Enter case title"
                  :invalid="!!errors.title"
                  class="w-full"
                />
                <Message v-if="errors.title" severity="error" variant="simple" size="small">
                  {{ errors.title }}
                </Message>
              </div>

              <Divider />

              <Label
                for="case-type"
                label="Case Type (*)"
                description="The kind of case you are creating"
              />
              <div class="w-full">
                <CaseTypeSelector
                  :caseTypes="caseTypes"
                  v-model="fields.selectedCaseType.value.value"
                />
                <Message
                  v-if="errors.selectedCaseType"
                  severity="error"
                  variant="simple"
                  size="small"
                >
                  {{ errors.selectedCaseType }}
                </Message>
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>

        <AccordionPanel :value="1" :disabled="!isClickable(1)">
          <StepHeader
            :step="1"
            :activeStep="activeStep"
            :stepValid="stepValid"
            :stepInteracted="stepInteracted"
            title="People"
          />
          <!-- Content for People using MultiSelect, etc. -->
          <AccordionContent>
            <div class="flex flex-col gap-y-3">
              <Label
                for="assignees"
                label="Assignees (*)"
                description="The people who will be working on this case"
              />
              <div class="w-full">
                <UserSelector
                  assigneeLabel="Assignees"
                  :userOptions="peopleOptions"
                  v-model:selectedUsers="fields.selectedAssignees.value.value"
                  multi-select
                />
                <Message
                  v-if="errors.selectedAssignees"
                  severity="error"
                  variant="simple"
                  size="small"
                >
                  {{ errors.selectedAssignees }}
                </Message>
              </div>
              <Divider />
              <div class="grid sm:grid-flow-col sm:grid-rows-2 gap-y-3 gap-x-5">
                <Label for="team" label="Team" description="The team responsible for this case" />
                <div>
                  <TeamSelector
                    v-model:selected-team="fields.selectedTeam.value.value"
                    class="w-full"
                  />
                  <Message
                    v-if="errors.selectedTeam"
                    severity="error"
                    variant="simple"
                    size="small"
                  >
                    {{ errors.selectedTeam }}
                  </Message>
                </div>
                <Label
                  for="participants"
                  label="Participants"
                  description="The people who are involved in this case"
                />
                <div>
                  <UserSelector
                    assigneeLabel="Participants"
                    :userOptions="peopleOptions"
                    v-model:selectedUsers="fields.selectedParticipants.value.value"
                    multi-select
                  />
                  <Message
                    v-if="errors.selectedParticipants"
                    severity="error"
                    variant="simple"
                    size="small"
                  >
                    {{ errors.selectedParticipants }}
                  </Message>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>

        <AccordionPanel :value="2" :disabled="!isClickable(2)">
          <StepHeader
            :step="2"
            :activeStep="activeStep"
            :stepValid="stepValid"
            :stepInteracted="stepInteracted"
            title="Details"
          />
          <AccordionContent>
            <div class="h-full grid gap-y-4">
              <div class="flex flex-col gap-y-3">
                <Label
                  for="description"
                  label="Description"
                  description="Describe the case in detail, e.g. what happened, when, and why"
                  icon="pi-info-circle"
                />
                <TempEditor
                  v-model="fields.description.value.value"
                  editorStyle="flex: 1; min-height: 180px"
                  class="flex-1 flex flex-col"
                  id="description"
                />
              </div>
              <div class="flex flex-col gap-y-3">
                <Label
                  for="solution"
                  label="Solution"
                  description="Describe the solution to the case, e.g. how the issue was resolved"
                  icon="pi-check-circle"
                />
                <TempEditor
                  v-model="fields.solution.value.value"
                  editorStyle="flex: 1; min-height: 180px"
                  class="flex-1 flex flex-col"
                  id="solution"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>

        <AccordionPanel :value="3" :disabled="!isClickable(3)">
          <StepHeader
            :step="3"
            :activeStep="activeStep"
            :stepValid="stepValid"
            :stepInteracted="stepInteracted"
            title="Products"
          />
          <!-- Content for Products -->
          <AccordionContent>
            <div class="flex flex-col gap-y-3">
              <Label
                for="products"
                label="Products"
                description="Select the products related to this case"
              />
              <ProductSelector v-model="fields.selectedProducts.value.value" />
            </div>
          </AccordionContent>
        </AccordionPanel>

        <AccordionPanel :value="4" :disabled="!isClickable(4)">
          <StepHeader
            :step="4"
            :activeStep="activeStep"
            :stepValid="stepValid"
            :stepInteracted="stepInteracted"
            title="Review"
          />
          <!-- Review and confirmation content -->
          <AccordionContent>
            <p>Review your case information before submitting.</p>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
    </section>

    <template #footer>
      <div class="w-full -m-5 p-5 box-content bg-white flex justify-between rounded-b-xl">
        <!-- Cancel Button with RouterLink -->
        <Button label="Cancel" variant="text" @click="dialogVisible = false" />
        <div class="flex gap-x-5">
          <Button
            label="Previous"
            @click="prevStep"
            :disabled="!stepValid(activeStep) || activeStep === 0"
            variant="outlined"
          />
          <Button
            label="Continue"
            @click="nextStep(steps.length)"
            :disabled="!stepValid(activeStep) || activeStep == steps.length - 1"
          />
          <Button
            :loading="submitState === SubmitState.SUBMITTING"
            :icon="`pi ${
              submitState === SubmitState.SUCCESS
                ? 'pi-check'
                : submitState === SubmitState.ERROR
                  ? 'pi-times'
                  : 'pi-send'
            }`"
            :class="{
              'p-button-success pulse': submitState === SubmitState.SUCCESS,
              'p-button-danger pulse': submitState === SubmitState.ERROR,
            }"
            label="Submit"
            @click="onSubmit"
            :disabled="!form.valid"
            v-if="activeStep == steps.length - 1 || formEndReached"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
:deep(.p-accordionpanel-active) {
  @apply flex-1 lg-h:overflow-auto scrollbar-thin;
}

:deep(.p-accordionpanel-active > .p-accordionheader) {
  @apply pointer-events-none;
}

:deep(.p-accordioncontent) {
  @apply flex-1 flex flex-col;
}

:deep(.p-accordioncontent-content) {
  @apply flex-1;
}

:deep(*) {
  --p-primary-50: #eff6ff;
  --p-primary-100: #dbeafe;
  --p-primary-200: #bfdbfe;
  --p-primary-300: #93c5fd;
  --p-primary-400: #60a5fa;
  --p-primary-500: #3b82f6;
  --p-primary-600: #2563eb;
  --p-primary-700: #1d4ed8;
  --p-primary-800: #1e40af;
  --p-primary-900: #1e3a8a;
  --p-primary-950: #1e3a8a;
  --p-primary-color: var(--p-primary-500);
  --p-primary-contrast-color: var(--p-surface-0);
  --p-primary-hover-color: var(--p-primary-600);
  --p-primary-active-color: var(--p-primary-700);
  --p-content-border-color: var(--p-surface-200);
  --p-content-hover-background: var(--p-surface-100);
  --p-content-hover-color: var(--p-surface-800);
  --p-highlight-background: var(--p-primary-50);
  --p-highlight-color: var(--p-primary-700);
  --p-highlight-focus-background: var(--p-primary-100);
  --p-highlight-focus-color: var(--p-primary-800);
  --p-text-color: var(--p-surface-700);
  --p-text-hover-color: var(--p-surface-800);
  --p-text-muted-color: var(--p-surface-500);
  --p-text-hover-muted-color: var(--p-surface-600);
}
</style>
