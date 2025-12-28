<template>
  <LayoutSingle class="layout-content-full content-center layout-paddings wizard-view" v-bng-blur>
    <Wizard
      ref="wizardRef"
      v-bind="props"
      v-model="wizardModel"
      @step-change="$emit('step-change', $event)"
      @step-complete="$emit('step-complete', $event)"
      @wizard-finish="$emit('wizard-finish', $event)"
      @validation-error="$emit('validation-error', $event)"
    >
      <template v-for="(slot, name) in slots" :key="name" #[name]="props">
        <slot :name="name" v-bind="props" />
      </template>
    </Wizard>
  </LayoutSingle>
</template>

<script setup>
import { ref, useSlots } from "vue"
import { vBngBlur } from "@/common/directives"
import { LayoutSingle } from "@/common/layouts"
import Wizard, { wizardProps } from "./Wizard.vue"

const props = defineProps({ ...wizardProps })
const slots = useSlots()
const wizardRef = ref()

defineEmits([
  "step-change",
  "step-complete",
  "wizard-finish",
  "validation-error",
])

const wizardModel = defineModel()

defineExpose({
  wizard: wizardRef,
  get currentStepIndex() { return wizardRef.value?.currentStepIndex },
  get currentStep() { return wizardRef.value?.currentStep },
  get progress() { return wizardRef.value?.progress },
  get stepProgress() { return wizardRef.value?.stepProgress },
  get steps() { return wizardRef.value?.steps },
  nextStep: () => wizardRef.value?.nextStep(),
  previousStep: () => wizardRef.value?.previousStep(),
  finish: () => wizardRef.value?.finish(),
  skip: () => wizardRef.value?.skip(),
})
</script>

<style lang="scss" scoped>
.wizard-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>
