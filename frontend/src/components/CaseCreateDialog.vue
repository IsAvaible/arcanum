<script setup lang="ts">
import Dialog from 'primevue/dialog'

import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionContent from 'primevue/accordioncontent'

import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import ConfirmDialog from 'primevue/confirmdialog'

import { useToast } from 'primevue'

import { CoinsSwap, CpuWarning, QuestionMark, WarningTriangle } from '@iconoir/vue'

import Label from '@/components/case-create-form/Label.vue'
import CaseTypeSelector from '@/components/case-create-form/CaseTypeSelector.vue'
import UserSelector, { type User } from '@/components/case-create-form/UserSelector.vue'
import TeamSelector from '@/components/case-create-form/TeamSelector.vue'
import CasePrioritySelect from '@/components/case-form-fields/CaseStatusSelect/CasePrioritySelect.vue'
import CaseStatusSelect from '@/components/case-form-fields/CaseStatusSelect/CaseStatusSelect.vue'
import ScrollFadeOverlay from '@/components/misc/ScrollFadeOverlay.vue'
import StepHeader from '@/components/case-create-form/StepHeader.vue'
import CaseCreateStepper from '@/components/case-create-form/CaseCreateStepper.vue'

import { useCaseFormStepper } from '@/composables/useCaseFormStepper'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { ref } from 'vue'
import { useVModel } from '@vueuse/core'
import { useApi } from '@/composables/useApi'
import type { CasesPostCaseTypeEnum } from '@/api'
import { caseSchema } from '@/validation/schemas'
import { useCaseFields } from '@/validation/fields'
import { useConfirm } from 'primevue/useconfirm'
import { AxiosError } from 'axios'

import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
const descriptionText = ref('')
const solutionText = ref('')

const toast = useToast()
const confirm = useConfirm()

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
const {
  handleSubmit,
  errors,
  meta: form,
  isFieldDirty,
} = useForm({
  validationSchema: toTypedSchema(caseSchema),
})

// Form validation
const fields = useCaseFields()

// Default values
fields.status.value.value = 'Open'

/**
 * Check if the current step is valid
 * @param step The step to check
 */
const stepValid = (step: number = activeStep.value): boolean => {
  switch (step) {
    case 0:
      return !(
        errors.value.title ||
        errors.value.case_type ||
        errors.value.status ||
        errors.value.priority
      )
    case 1:
      return !(errors.value.assignees || errors.value.participants || errors.value.team)
    case 2:
      return !(errors.value.description || errors.value.solution)
    case 3:
      return !errors.value.products
    case 4:
      return true
    default:
      return false
  }
}

/**
 * Validate the current step
 * @param step The step to validate
 */
const validateStep = async (step: number = activeStep.value) => {
  switch (step) {
    case 0:
      await fields.title.validate()
      await fields.type.validate()
      await fields.status.validate()
      await fields.priority.validate()
      return
    case 1:
      await fields.assignees.validate()
      await fields.participants.validate()
      await fields.team.validate()
      return
    case 2:
      await fields.description.validate()
      await fields.solution.validate()
      return
  }
}

/**
 * Check if there are any errors in the form
 */
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
    const requestParameters = {
      title: fields.title.value.value,
      caseType: fields.type.value.value as CasesPostCaseTypeEnum,
      assignee: fields.assignees.value.value,
      // participants: fields.selectedParticipants.value.value,
      // team: fields.selectedTeam.value.value,
      description: fields.description.value.value,
      solution: fields.solution.value.value || undefined,
      priority: fields.priority.value.value || undefined,
      status: fields.status.value.value,
      // products: fields.selectedProducts.value.value,
    }
    await api.casesPost(requestParameters, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    submitState.value = SubmitState.ERROR
    setTimeout(() => {
      submitState.value = SubmitState.IDLE
    }, 3000)
    console.error('Error creating case', error)
    toast.add({
      severity: 'error',
      summary: 'Error Creating Case',
      detail: 'There was an error creating your case\n' + (error as AxiosError).message,
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

const cancelCaseCreation = async () => {
  if (!form.value.dirty) {
    dialogVisible.value = false
  } else {
    confirm.require({
      message: 'You have unsaved changes. Are you sure you want to cancel?',
      header: 'Confirm Cancel',
      icon: 'pi pi-exclamation-triangle',
      rejectProps: {
        severity: 'secondary',
        outlined: true,
      },
      accept: async () => {
        dialogVisible.value = false
        toast.add({
          severity: 'info',
          summary: 'Creation Cancelled',
          detail: 'Your changes have been discarded.',
          life: 3000,
          closable: true,
        })
      },
    })
  }
}

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
    class="neutral-primary bg-slate-100 flex flex-col h-[calc(100%-3rem)] w-[calc(100%-3rem)] max-w-7xl max-h-[min(1024px, calc(100%-3rem))]"
    :modal="true"
    :closable="false"
    :pt="dialogPT"
  >
    <ConfirmDialog></ConfirmDialog>
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
                <CaseTypeSelector :caseTypes="caseTypes" v-model="fields.type.value.value" />
                <Message v-if="errors.case_type" severity="error" variant="simple" size="small">
                  {{ errors.case_type }}
                </Message>
              </div>

              <Divider />

              <div class="grid sm:grid-cols-2 sm:grid-rows-2 grid-flow-col gap-x-6">
                <Label
                  for="status"
                  label="Status (*)"
                  description="The current status of the new case"
                />
                <div class="w-full">
                  <CaseStatusSelect
                    v-model="fields.status.value.value"
                    id="status"
                    class="w-full"
                    :invalid="!!errors.status"
                  />
                  <Message v-if="errors.status" severity="error" variant="simple" size="small">
                    {{ errors.status }}
                  </Message>
                </div>

                <Label for="priority" label="Priority" description="The priority of the new case" />
                <div class="w-full">
                  <CasePrioritySelect
                    v-model="fields.priority.value.value"
                    id="priority"
                    class="w-full"
                    :invalid="!!errors.priority"
                  />
                  <Message v-if="errors.priority" severity="error" variant="simple" size="small">
                    {{ errors.priority }}
                  </Message>
                </div>
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
                  @update:selected-users="fields.assignees.value.value = $event.map((u) => u.name)"
                  assigneeLabel="Assignees"
                  :userOptions="peopleOptions"
                  multi-select
                  :invalid="!!errors.assignees"
                />
                <Message v-if="errors.assignees" severity="error" variant="simple" size="small">
                  {{ errors.assignees }}
                </Message>
              </div>
              <Divider />
              <div class="grid sm:grid-flow-col sm:grid-rows-2 gap-y-3 gap-x-5">
                <Label for="team" label="Team" description="The team responsible for this case" />
                <div>
                  <TeamSelector
                    @update:selected-team="fields.team.value.value = $event.name"
                    class="w-full"
                    :invalid="!!errors.team"
                  />
                  <Message v-if="errors.team" severity="error" variant="simple" size="small">
                    {{ errors.team }}
                  </Message>
                </div>
                <Label
                  for="participants"
                  label="Participants"
                  description="The people who are involved in this case"
                />
                <div>
                  <UserSelector
                    @update:selected-users="
                      fields.participants.value.value = $event.map((u) => u.name) || undefined
                    "
                    assigneeLabel="Participants"
                    :userOptions="peopleOptions"
                    multi-select
                    :invalid="!!errors.participants"
                  />
                  <Message
                    v-if="errors.participants"
                    severity="error"
                    variant="simple"
                    size="small"
                  >
                    {{ errors.participants }}
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
              <!-- Description Box -->
              <div class="flex flex-col">
                <Label
                  for="description"
                  label="Description"
                  description="Describe the case in detail, e.g. what happened, when, and why"
                  icon="pi-info-circle"
                  class="mb-3"
                />
                <MdEditor v-model="descriptionText" />
              </div>

              <!-- Solution Box -->
              <div class="flex flex-col">
                <Label
                  for="solution"
                  label="Solution"
                  description="Describe the solution to the case, e.g. how the issue was resolved"
                  icon="pi-check-circle"
                  class="mb-3"
                />
                <MdEditor v-model="solutionText" />
              </div>
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
            <div class="grid gap-y-6">
              <div class="bg-slate-50 p-4 rounded-lg">
                <h2 class="text-xl font-semibold mb-4">Basic Information</h2>
                <div class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm text-slate-600">Case Title</p>
                    <p class="font-medium">{{ fields.title.value.value || 'Not provided' }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-slate-600">Case Type</p>
                    <p class="font-medium">
                      {{
                        caseTypes.find((type) => type.title === fields.type.value.value)?.title ||
                        'Not selected'
                      }}
                    </p>
                  </div>
                  <div>
                    <p class="text-sm text-slate-600">Status</p>
                    <p class="font-medium">
                      {{ fields.status.value.value || 'No status selected' }}
                    </p>
                  </div>
                  <div>
                    <p class="text-sm text-slate-600">Priority</p>
                    <p class="font-medium">
                      {{ fields.priority.value.value || 'No priority selected' }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="bg-slate-50 p-4 rounded-lg">
                <h2 class="text-xl font-semibold mb-4">People</h2>
                <div class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm text-slate-600">Assignees</p>
                    <p class="font-medium">
                      {{
                        fields.assignees.value.value?.map((assignee) => assignee).join(', ') ||
                        'No assignees'
                      }}
                    </p>
                  </div>
                  <div>
                    <p class="text-sm text-slate-600">Team</p>
                    <p class="font-medium">
                      {{ fields.team.value.value || 'No team selected' }}
                    </p>
                  </div>
                  <div>
                    <p class="text-sm text-slate-600">Participants</p>
                    <p class="font-medium">
                      {{
                        fields.participants.value.value
                          ?.map((participant) => participant)
                          .join(', ') || 'No participants'
                      }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="bg-slate-50 p-4 rounded-lg">
                <h2 class="text-xl font-semibold mb-4">Details</h2>
                <div class="grid gap-4">
                  <div>
                    <p class="text-sm text-slate-600">Description</p>
                    <ScrollFadeOverlay
                      axis="vertical"
                      content-class="max-h-[150px]"
                      fade-from="from-slate-50"
                      class="ql-snow"
                    >
                      <div
                        v-if="fields.description.value.value"
                        class="ql-editor p-0 max-w-full overflow-auto"
                        v-html="fields.description.value.value"
                      ></div>
                      <p v-else class="font-medium">No description provided</p>
                    </ScrollFadeOverlay>
                  </div>
                  <div>
                    <p class="text-sm text-slate-600">Solution</p>
                    <ScrollFadeOverlay
                      axis="vertical"
                      content-class="max-h-[150px]"
                      fade-from="from-slate-50"
                      class="ql-snow"
                    >
                      <div
                        v-if="fields.solution.value.value"
                        class="ql-editor p-0 max-w-full max-h-[10px] overflow-auto"
                        v-html="fields.solution.value.value"
                      ></div>
                      <p v-else class="font-medium">No solution provided</p>
                    </ScrollFadeOverlay>
                  </div>
                </div>
              </div>

              <div class="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                <h2 class="text-lg font-semibold mb-2">Confirmation</h2>
                <p class="text-yellow-800">
                  Please review all information carefully before submitting. Once submitted, you may
                  not be able to edit all details.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
    </section>

    <template #footer>
      <div class="w-full -m-5 p-5 box-content bg-white flex justify-between rounded-b-xl">
        <!-- Cancel Button with RouterLink -->
        <Button label="Cancel" variant="text" @click="cancelCaseCreation" />
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
            :disabled="!!Object.keys(errors).length"
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
</style>
