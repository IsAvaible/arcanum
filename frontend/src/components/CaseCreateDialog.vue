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
import TempEditor from '@/components/case-create-form/TempEditor.vue'
import ProductSelector from '@/components/case-create-form/ProductSelector.vue'
import TeamSelector from '@/components/case-create-form/TeamSelector.vue'

import { useCaseFormStepper } from '@/composables/useCaseFormStepper'
import StepHeader from '@/components/case-create-form/StepHeader.vue'
import CaseCreateStepper from '@/components/case-create-form/CaseCreateStepper.vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { ref } from 'vue'
import { useVModel } from '@vueuse/core'
import { useApi } from '@/composables/useApi'
import type { CasesPostCaseTypeEnum } from '@/api'
import ScrollFadeOverlay from '@/components/misc/ScrollFadeOverlay.vue'
import { caseSchema } from '@/validation/schemas'
import { useCaseFields } from '@/validation/fields'
import { useConfirm } from 'primevue/useconfirm'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'

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
const statuses = [
  { name: 'Offen', code: 'open', severity: 'info' },
  { name: 'In Bearbeitung', code: 'in-progress', severity: 'warning' },
  { name: 'Abgeschlossen', code: 'completed', severity: 'success' },
]
const selectedStatus = ref(statuses[0])

const priorities = [
  { name: 'P0', code: 'p0', color: '#ef4444' }, // Red
  { name: 'P1', code: 'p1', color: '#f97316' }, // Orange
  { name: 'P2', code: 'p2', color: '#eab308' }, // Yellow
  { name: 'P3', code: 'p3', color: '#22c55e' }, // Green
]

const selectedPriority = ref(priorities[0])
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

/**
 * Check if the current step is valid
 * @param step The step to check
 */
const stepValid = (step: number = activeStep.value): boolean => {
  switch (step) {
    case 0:
      return !(errors.value.title || errors.value.case_type)
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
    case 3:
      await fields.selectedProducts.validate()
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
        caseType: fields.type.value.value as CasesPostCaseTypeEnum,
        assignee: fields.assignees.value.value,
        // participants: fields.selectedParticipants.value.value,
        // team: fields.selectedTeam.value.value,
        description: fields.description.value.value,
        solution: fields.solution.value.value,
        priority: fields.priority.value.value,
        status: 'Open',
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
            </div>
            <!-- Priority Section -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <Dropdown
                v-model="selectedPriority"
                :options="priorities"
                optionLabel="name"
                class="w-full"
              >
                <template #value="slotProps">
                  <div class="flex items-center gap-2" v-if="slotProps.value">
                    <div
                      class="w-3 h-3 rounded-full"
                      :style="{ backgroundColor: slotProps.value.color }"
                    ></div>
                    <span>{{ slotProps.value.name }}</span>
                  </div>
                </template>
                <template #option="slotProps">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-3 h-3 rounded-full"
                      :style="{ backgroundColor: slotProps.option.color }"
                    ></div>
                    <span>{{ slotProps.option.name }}</span>
                  </div>
                </template>
              </Dropdown>
            </div>

            <!-- Status Section -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <Dropdown
                v-model="selectedStatus"
                :options="statuses"
                optionLabel="name"
                class="w-full"
              >
                <template #value="slotProps">
                  <Tag
                    v-if="slotProps.value"
                    :value="slotProps.value.name"
                    :severity="slotProps.value.severity"
                  />
                </template>
                <template #option="slotProps">
                  <Tag :value="slotProps.option.name" :severity="slotProps.option.severity" />
                </template>
              </Dropdown>
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
                      fields.participants.value.value = $event.map((u) => u.name)
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
              <div class="flex flex-col">
                <Label
                  for="description"
                  label="Description"
                  description="Describe the case in detail, e.g. what happened, when, and why"
                  icon="pi-info-circle"
                  class="mb-3"
                />
                <TempEditor
                  v-model="fields.description.value.value"
                  editorStyle="flex: 1; min-height: 180px"
                  class="flex-1 flex flex-col"
                  id="description"
                  :invalid="!!errors.description"
                />
                <Message
                  v-if="errors.description"
                  severity="error"
                  variant="simple"
                  size="small"
                  class="-mt-5 ml-1 z-10"
                >
                  {{ errors.description }}
                </Message>
              </div>
              <div class="flex flex-col">
                <Label
                  for="solution"
                  label="Solution"
                  description="Describe the solution to the case, e.g. how the issue was resolved"
                  icon="pi-check-circle"
                  class="mb-3"
                />
                <TempEditor
                  v-model="fields.solution.value.value"
                  editorStyle="flex: 1; min-height: 180px"
                  class="flex-1 flex flex-col"
                  id="solution"
                  :invalid="!!errors.solution"
                />
                <Message
                  v-if="errors.solution"
                  severity="error"
                  variant="simple"
                  size="small"
                  class="-mt-5 ml-1 z-10"
                >
                  {{ errors.solution }}
                </Message>
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

              <div class="bg-slate-50 p-4 rounded-lg">
                <h2 class="text-xl font-semibold mb-4">Products</h2>
                <div>
                  <p class="text-sm text-slate-600">Selected Products</p>
                  <p class="font-medium">
                    {{
                      fields.selectedProducts.value.value?.length
                        ? fields.selectedProducts.value.value.join(', ')
                        : 'No products selected'
                    }}
                  </p>
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
          {{ errors }}
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
