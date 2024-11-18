<script setup lang="ts">
import Step from 'primevue/step'
import Stepper from 'primevue/stepper'
import StepList from 'primevue/steplist'
import Divider from 'primevue/divider'
import { useVModel } from '@vueuse/core'

interface Props {
  /** The current step */
  modelValue: number
  /** The list of steps to display */
  steps: { icon: string; label: string }[]
  /** Function to check if the step is valid */
  stepValid: (step: number) => boolean
  /** Function to check if the step has been interacted with */
  stepInteracted: (step: number) => boolean
  /** Function to check if the step is clickable */
  isClickable: (step: number) => boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue'])

const activeStep = useVModel(props, 'modelValue', emit)
</script>

<template>
  <Stepper v-model:value="activeStep" linear class="w-fit mx-auto">
    <StepList>
      <Step
        v-for="(step, index) in steps"
        :key="index"
        :value="index"
        v-slot="{ activateCallback, value, a11yAttrs }"
        :disabled="!props.isClickable(index)"
        asChild
      >
        <div class="flex flex-row flex-auto gap-2" v-bind="a11yAttrs.root">
          <button
            class="bg-transparent border-0 inline-flex flex-col gap-2 items-center w-16 transition-colors"
            :class="[
              {
                'text-green-500': props.stepInteracted(+value) && props.stepValid(+value),
                'text-red-500': props.stepInteracted(+value) && !props.stepValid(+value),
                'text-primary-500': +value === activeStep && !props.stepInteracted(+value),
                'text-surface-400': +value > activeStep && !props.stepInteracted(+value),
              },
            ]"
            @click="activateCallback"
            v-bind="a11yAttrs.header"
          >
            <span
              :class="[
                'rounded-full size-8 p-2 inline-flex items-center justify-center ring-inset transition-all',
                {
                  'bg-green-500 text-white':
                    props.stepInteracted(+value) && props.stepValid(+value),
                  'ring-2 ring-red-500 text-red-500':
                    props.stepInteracted(+value) && !props.stepValid(+value),
                  'ring-2 ring-primary-500 text-primary-500':
                    +value === activeStep && !props.stepInteracted(+value),
                  'ring-1 ring-surface-400': +value > activeStep && !props.stepInteracted(+value),
                },
              ]"
            >
              <i
                :class="[
                  'pi',
                  props.stepInteracted(+value) && props.stepValid(+value) && +value !== activeStep
                    ? 'pi-check'
                    : step.icon,
                ]"
              />
            </span>
            <p class="text-nowrap text-sm font-semibold">{{ step.label }}</p>
          </button>
          <Divider
            v-if="+value < steps.length - 1"
            :class="[
              '-mt-4 mx-4 w-20 before:transition-colors before:!border-none before:h-[1.5px] before:bg-gradient-to-r',
              {
                'before:from-green-500': props.stepInteracted(+value) && props.stepValid(+value),
                'before:from-red-500': props.stepInteracted(+value) && !props.stepValid(+value),
                'before:from-primary-500': +value === activeStep && !props.stepInteracted(+value),
                'before:from-surface-400': +value > activeStep && !props.stepInteracted(+value),
                'before:to-green-500':
                  props.stepInteracted(+value + 1) && props.stepValid(+value + 1),
                'before:to-red-500':
                  props.stepInteracted(+value + 1) && !props.stepValid(+value + 1),
                'before:to-primary-500':
                  +value + 1 === activeStep && !props.stepInteracted(+value + 1),
                'before:to-50% before:to-surface-400':
                  +value + 1 > activeStep && !props.stepInteracted(+value + 1),
              },
            ]"
          />
        </div>
      </Step>
    </StepList>
  </Stepper>
</template>

<style scoped></style>
