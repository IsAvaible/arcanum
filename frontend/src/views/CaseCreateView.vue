<script setup lang="ts">
import { ref } from 'vue'

import Dialog from 'primevue/dialog'

import Stepper from 'primevue/stepper'
import StepList from 'primevue/steplist'
import Step from 'primevue/step'
import Divider from 'primevue/divider'

import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'

import InputText from 'primevue/inputtext'
import Button from 'primevue/button'

import StepProgressIndicator from '@/components/case-create-form/StepProgressIndicator.vue'

import { CoinsSwap, CpuWarning, QuestionMark, WarningTriangle } from '@iconoir/vue'
import Label from '@/components/case-create-form/Label.vue'
import CaseTypeSelector from '@/components/case-create-form/CaseTypeSelector.vue'
import UserSelector from '@/components/case-create-form/UserSelector.vue'
import TempEditor from '@/components/case-create-form/TempEditor.vue'
import ProductSelector from '@/components/case-create-form/ProductSelector.vue'
import TeamSelector from '@/components/case-create-form/TeamSelector.vue'

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

const title = ref('')
const selectedCaseType = ref('')
const details = ref('')
const selectedPeople = ref([])
const peopleOptions = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  name: `Cat ${i + 1}`,
  image: `https://placecats.com/${50 + i}/${50 + i}`,
}))
const selectedTeam = ref(null)

const nextStep = () => {
  if (activeStep.value < steps.length - 1) {
    activeStep.value++
  }
}

const prevStep = () => {
  if (activeStep.value > 0) {
    activeStep.value--
  }
}
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
        class="bg-white flex-1 h-full md-h:max-h-[calc(100%-3.25rem)] flex flex-col"
        :select-on-focus="true"
      >
        <AccordionPanel :value="0">
          <AccordionHeader>
            <div class="flex gap-x-4">
              <StepProgressIndicator :type="activeStep === 0 ? 1 : activeStep > 0 ? 2 : 0" />
              <span class="font-semibold">Basic Information</span>
            </div>
          </AccordionHeader>
          <AccordionContent>
            <div class="flex flex-col gap-y-4">
              <Label for="title" label="Case Title" description="The title of your new case" />
              <InputText id="title" v-model="title" placeholder="Enter case title" />

              <Divider />

              <Label
                for="case-type"
                label="Case Type"
                description="The kind of case you are creating"
              />
              <CaseTypeSelector :caseTypes="caseTypes" v-model="selectedCaseType" />
            </div>
          </AccordionContent>
        </AccordionPanel>

        <AccordionPanel :value="1" :disabled="activeStep < 1">
          <AccordionHeader>
            <div class="flex gap-x-4">
              <StepProgressIndicator :type="activeStep === 1 ? 1 : activeStep > 1 ? 2 : 0" />
              <span class="font-semibold">People</span>
            </div>
          </AccordionHeader>
          <!-- Content for People using MultiSelect, etc. -->
          <AccordionContent>
            <div class="flex flex-col gap-y-3">
              <Label
                for="assignees"
                label="Assignees"
                description="The people who will be working on this case"
              />
              <UserSelector
                assigneeLabel="Assignees"
                :userOptions="peopleOptions"
                v-model:selectedUsers="selectedPeople"
                multi-select
              />
              <Divider />
              <div class="grid sm:grid-flow-col sm:grid-rows-2 gap-y-3 gap-x-5">
                <Label for="team" label="Team" description="The team responsible for this case" />
                <TeamSelector v-model:selected-team="selectedTeam" />
                <Label
                  for="participants"
                  label="Participants"
                  description="The people who are involved in this case"
                />
                <UserSelector
                  assigneeLabel="Participants"
                  :userOptions="peopleOptions"
                  v-model:selectedUsers="selectedPeople"
                  multi-select
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>

        <AccordionPanel :value="2" :disabled="activeStep < 2">
          <AccordionHeader>
            <div class="flex gap-x-4">
              <StepProgressIndicator :type="activeStep === 2 ? 1 : activeStep > 2 ? 2 : 0" />
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

        <AccordionPanel :value="3" :disabled="activeStep < 3">
          <AccordionHeader>
            <div class="flex gap-x-4">
              <StepProgressIndicator :type="activeStep === 3 ? 1 : activeStep > 3 ? 2 : 0" />
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
              <ProductSelector />
            </div>
          </AccordionContent>
        </AccordionPanel>

        <AccordionPanel :value="4" :disabled="activeStep < 4">
          <AccordionHeader>
            <div class="flex gap-x-4">
              <StepProgressIndicator :type="activeStep === 4 ? 1 : activeStep > 4 ? 2 : 0" />
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
      <div class="w-full -m-5 p-5 box-content bg-white flex justify-between rounded-b-xl z-9999">
        <Button label="Cancel" @click="dialogVisible = false" variant="text" />
        <div class="flex gap-x-5">
          <Button
            label="Previous"
            @click="prevStep"
            :disabled="activeStep === 0"
            variant="outlined"
          />
          <Button label="Continue" @click="nextStep" :disabled="activeStep === steps.length - 1" />
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
</style>
