<script setup lang="ts">
import { ref, watch } from 'vue'
import * as zod from 'zod'

import Dialog from 'primevue/dialog'

import Stepper from 'primevue/stepper'
import StepList from 'primevue/steplist'
import Step from 'primevue/step'

import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'

import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Button from 'primevue/button'
import Divider from 'primevue/divider'

import { useToast } from 'primevue'

import { CoinsSwap, CpuWarning, QuestionMark, WarningTriangle } from '@iconoir/vue'

import StepProgressIndicator from '@/components/case-create-form/StepProgressIndicator.vue'
import Label from '@/components/case-create-form/Label.vue'
import CaseTypeSelector from '@/components/case-create-form/CaseTypeSelector.vue'
import UserSelector, { type User } from '@/components/case-create-form/UserSelector.vue'
import TempEditor from '@/components/case-create-form/TempEditor.vue'
import ProductSelector from '@/components/case-create-form/ProductSelector.vue'
import TeamSelector, { type Team } from '@/components/case-create-form/TeamSelector.vue'

import { toTypedSchema } from '@vee-validate/zod'
import { useField, useForm } from 'vee-validate'

const toast = useToast()

const dialogVisible = ref(true)
const activeStep = ref(0)
const steps = [
  { label: 'Basics', icon: 'pi-info-circle' },
  { label: 'People', icon: 'pi-user' },
  { label: 'Details', icon: 'pi-pen-to-square' },
  { label: 'Products', icon: 'pi-warehouse' },
  { label: 'Review', icon: 'pi-star' },
]

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

const { value: title, validate: validateTitle } = useField<string>('title')
const { value: selectedCaseType, validate: validateSelectedCaseType } =
  useField<string>('selectedCaseType')
const { value: selectedAssignees, validate: validateSelectedAssignees } =
  useField<User[]>('selectedAssignees')
const { value: selectedParticipants, validate: validateSelectedParticipants } =
  useField<User[]>('selectedParticipants')
const { value: selectedTeam, validate: validateSelectedTeam } = useField<Team>('selectedTeam')
const { value: details, validate: validateDetails } = useField<string>('details')
const { value: selectedProducts, validate: validateSelectedProducts } =
  useField<number[]>('selectedProducts')

const formEndReached = ref(false)
/**
 * Navigate to the next step if possible
 */
const nextStep = async () => {
  if (activeStep.value < steps.length - 1) {
    await validateStep()
    if (stepValid()) {
      activeStep.value++
      if (activeStep.value === steps.length - 1) {
        formEndReached.value = true
      }
    } else {
      toast.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fix all errors before proceeding',
        life: 3000,
      })
    }
  }
}

/**
 * Navigate to the previous step if possible
 */
const prevStep = () => {
  if (activeStep.value > 0) {
    if (stepValid()) {
      activeStep.value--
    } else {
      toast.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fix all errors before proceeding',
        life: 3000,
      })
    }
  }
}

/**
 * Validate the given step
 *
 * @param step The step to validate
 */
const validateStep = async (step: number = activeStep.value) => {
  switch (step) {
    case 0:
      await validateTitle()
      await validateSelectedCaseType()
      return
    case 1:
      await validateSelectedAssignees()
      await validateSelectedParticipants()
      await validateSelectedTeam()
      return
    case 2:
      await validateDetails()
      return
    case 3:
      await validateSelectedProducts()
      return
    default:
      return
  }
}

/**
 * Check if the given step is valid
 *
 * @param step The step to check
 */
const stepValid = (step: number = activeStep.value): boolean => {
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

const maxStep = ref(0) // The maximum step reached
watch(activeStep, (newStep) => {
  if (newStep > maxStep.value) {
    maxStep.value = newStep
  }
})

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

const hasErrors = () => {
  return Object.keys(errors.value).length !== 0
}

const onSubmit = handleSubmit((_values) => {
  toast.add({
    severity: 'success',
    summary: 'Case Created',
    detail: 'Your case has been successfully created',
    life: 3000,
  })
})
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    class="w-[calc(100%-3rem)] max-w-7xl bg-slate-100 h-[calc(100%-3rem)] max-h-[min(1024px, calc(100%-3rem))] flex flex-col"
    :modal="true"
    :closable="false"
  >
    <template #header>
      <div class="w-full -m-5 p-5 box-content bg-white rounded-t-xl overflow-x-auto">
        <Stepper v-model:value="activeStep" linear class="w-fit mx-auto">
          <StepList>
            <Step
              v-for="(step, index) in steps"
              :key="index"
              :value="index"
              v-slot="{ activateCallback, value, a11yAttrs }"
              asChild
            >
              <div class="flex flex-row flex-auto gap-2" v-bind="a11yAttrs.root">
                <button
                  class="bg-transparent border-0 inline-flex flex-col gap-2 items-center w-16"
                  :class="[
                    {
                      'text-green-500': +value < activeStep,
                      'text-primary-500': +value == activeStep,
                      'text-surface-400': +value > activeStep,
                    },
                  ]"
                  @click="activateCallback"
                  v-bind="a11yAttrs.header"
                >
                  <span
                    :class="[
                      'rounded-full size-8 p-2 inline-flex items-center justify-center ring-inset',
                      {
                        'bg-green-500 text-white': +value < activeStep,
                        'ring-2 ring-primary-500 text-primary-500': +value == activeStep,
                        'ring-1 ring-surface-400': +value > activeStep,
                      },
                    ]"
                  >
                    <i :class="['pi', +value < activeStep ? 'pi-check' : step.icon]" />
                  </span>
                  <p class="text-nowrap text-sm font-semibold">{{ step.label }}</p>
                </button>
                <Divider
                  v-if="+value < steps.length - 1"
                  :class="[
                    '-mt-4 mx-4 w-20 before:!border-none before:h-[1.5px] before:bg-gradient-to-r',
                    {
                      'before:from-green-500 before:to-green-500': +value < activeStep - 1,
                      'before:from-green-500 before:to-primary-500': +value == activeStep - 1,
                      'before:from-primary-500 before:to-50% before:to-surface-400':
                        value == activeStep,
                      'before:from-surface-400 before:to-surface-400': +value > activeStep - 1,
                    },
                  ]"
                />
              </div>
            </Step>
          </StepList>
        </Stepper>
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
        <AccordionPanel
          :value="0"
          :disabled="activeStep != 0 && (!stepInteracted(0) || hasErrors())"
        >
          <AccordionHeader>
            <div class="flex gap-x-4">
              <StepProgressIndicator
                :type="
                  activeStep === 0
                    ? !stepInteracted()
                      ? 0
                      : 1 + +stepValid()
                    : activeStep > 0 || stepInteracted(0)
                      ? 3
                      : 4
                "
              />
              <span class="font-semibold">Basic Information</span>
            </div>
          </AccordionHeader>
          <AccordionContent>
            <div class="flex flex-col gap-y-4">
              <Label for="title" label="Case Title (*)" description="The title of your new case" />
              <div class="w-full">
                <InputText
                  id="title"
                  v-model="title"
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
                <CaseTypeSelector :caseTypes="caseTypes" v-model="selectedCaseType" />
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

        <AccordionPanel
          :value="1"
          :disabled="activeStep != 1 && (!stepInteracted(1) || hasErrors())"
        >
          <AccordionHeader>
            <div class="flex gap-x-4">
              <StepProgressIndicator
                :type="
                  activeStep === 1
                    ? !stepInteracted()
                      ? 0
                      : 1 + +stepValid()
                    : activeStep > 1 || stepInteracted(1)
                      ? 3
                      : 4
                "
              />
              <span class="font-semibold">People</span>
            </div>
          </AccordionHeader>
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
                  v-model:selectedUsers="selectedAssignees"
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
                  <TeamSelector v-model:selected-team="selectedTeam" class="w-full" />
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
                    v-model:selectedUsers="selectedParticipants"
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

        <AccordionPanel
          :value="2"
          :disabled="activeStep != 2 && (!stepInteracted(2) || hasErrors())"
        >
          <AccordionHeader>
            <div class="flex gap-x-4">
              <StepProgressIndicator
                :type="
                  activeStep === 2
                    ? !stepInteracted()
                      ? 0
                      : 1 + +stepValid()
                    : activeStep > 2 || stepInteracted(2)
                      ? 3
                      : 4
                "
              />
              <span class="font-semibold">Details</span>
            </div>
          </AccordionHeader>
          <AccordionContent>
            <div class="h-full flex flex-col gap-y-3">
              <Label
                for="details"
                label="Details"
                description="Provide additional information about the case"
              />
              <TempEditor
                v-model="details"
                editorStyle="flex: 1; min-height: 200px"
                class="flex-1 flex flex-col"
              />
            </div>
          </AccordionContent>
        </AccordionPanel>

        <AccordionPanel
          :value="3"
          :disabled="activeStep != 3 && (!stepInteracted(3) || hasErrors())"
        >
          <AccordionHeader>
            <div class="flex gap-x-4">
              <StepProgressIndicator
                :type="
                  activeStep === 3
                    ? !stepInteracted()
                      ? 0
                      : 1 + +stepValid()
                    : activeStep > 3 || stepInteracted(3)
                      ? 3
                      : 4
                "
              />
              <span class="font-semibold">Products</span>
            </div>
          </AccordionHeader>
          <!-- Content for Products -->
          <AccordionContent>
            <div class="flex flex-col gap-y-3">
              <Label
                for="products"
                label="Products"
                description="Select the products related to this case"
              />
              <ProductSelector v-model="selectedProducts" />
            </div>
          </AccordionContent>
        </AccordionPanel>

        <AccordionPanel
          :value="4"
          :disabled="activeStep != 4 && (!stepInteracted(4) || hasErrors())"
        >
          <AccordionHeader>
            <div class="flex gap-x-4">
              <StepProgressIndicator
                :type="
                  activeStep === 4
                    ? !stepInteracted()
                      ? 0
                      : 1 + +stepValid()
                    : activeStep > 4 || stepInteracted(4)
                      ? 3
                      : 4
                "
              />
              <span class="font-semibold">Review</span>
            </div>
          </AccordionHeader>
          <!-- Review and confirmation content -->
          <AccordionContent>
            <p>Review your case information before submitting.</p>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
    </section>

    <template #footer>
      <div class="w-full -m-5 p-5 box-content bg-white flex justify-between rounded-b-xl">
        <Button label="Cancel" @click="dialogVisible = false" variant="text" />
        <div class="flex gap-x-5">
          <Button
            label="Previous"
            @click="prevStep"
            :disabled="activeStep === 0"
            variant="outlined"
          />
          <Button label="Continue" @click="nextStep" :disabled="activeStep == steps.length - 1" />
          <Button
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

<style>
.p-dialog-footer {
  @apply mt-auto;
}

.p-dialog-content {
  @apply flex-1;
}

.p-accordionpanel-active {
  @apply flex-1 lg-h:overflow-auto scrollbar-thin;
}

.p-accordionpanel-active > .p-accordionheader {
  @apply pointer-events-none;
}

.p-accordioncontent {
  @apply flex-1 flex flex-col;
}

.p-accordioncontent-content {
  @apply flex-1;
}

.p-dialog-footer {
  @apply pt-5;
}
</style>
