<script setup lang="ts">
import Step from 'primevue/step'
import Stepper from 'primevue/stepper'
import StepList from 'primevue/steplist'
import Divider from 'primevue/divider'
import { useVModel } from '@vueuse/core'

const props = defineProps<{
  modelValue: number
  steps: { icon: string; label: string }[]
}>()
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
                'before:from-primary-500 before:to-50% before:to-surface-400': value == activeStep,
                'before:from-surface-400 before:to-surface-400': +value > activeStep - 1,
              },
            ]"
          />
        </div>
      </Step>
    </StepList>
  </Stepper>
</template>

<style scoped></style>
