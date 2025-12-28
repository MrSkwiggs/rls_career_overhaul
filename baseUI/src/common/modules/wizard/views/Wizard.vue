<template>
  <div class="wizard-container">
    <div class="wizard-content">

      <BngScreenHeading
        v-if="title"
        :preheadings="preheadings"
        :show-divider="showDivider"
      >
        {{ $tt(title) }}
      </BngScreenHeading>

      <BngCard v-if="showProgress" class="wizard-progress-card">
        <ProgressSteps
          :steps="stepProgress"
          :current-step="currentStepIndex"
        />
      </BngCard>

      <BngCard class="wizard-main-card">
        <BngCardHeading
          v-if="currentStep?.title"
          type="ribbon"
        >
          <slot name="step-title" :step="currentStep">
            {{ $tt(currentStep.title) }}
          </slot>
        </BngCardHeading>

        <div class="wizard-step-content" v-bng-ui-nav-scroll>
          <slot
            name="step"
            :step="currentStep"
            :stepData="currentStep?.modelValue"
            :updateStepData="currentStep?.updateModelValue"
            :stepIndex="currentStepIndex"
            :isFirst="isFirstStep"
            :isLast="isLastStep"
          >
            <!-- WizardStep components -->
            <slot></slot>
          </slot>

          <div v-if="validationMessage" class="wizard-validation">
            <div class="validation-message">
              {{ validationMessage }}
            </div>
          </div>
        </div>

        <template #buttons>
          <div class="wizard-navigation">
            <BngButton
              v-if="showBackButton && !isFirstStep"
              :disabled="!canGoBack"
              :accent="ACCENTS.secondary"
              @click="previousStep"
            >{{ $tt(backButtonText) }}</BngButton>
            <BngButton
              v-if="allowSkip && !isLastStep && currentStep?.type !== 'choice'"
              :accent="ACCENTS.secondary"
              @click="skip"
            >{{ $tt(skipButtonText) }}</BngButton>
            <div class="spacer"></div>
            <div v-if="currentStep?.type === 'choice'" class="switch-buttons">
              <BngButton
                v-for="choice in currentStepChoices"
                :key="choice.value"
                :class="getChoiceButtonClass(choice.value, currentStep?.modelValue?.choice || null)"
                :accent="ACCENTS.custom"
                :icon="currentStep?.modelValue?.choice === choice.value ? icons.checkmark : null"
                :disabled="currentStep?.advanceDisabled"
                @click="handleChoiceClick(choice)"
              >{{ $tt(choice.label) }}</BngButton>
            </div>
            <BngButton
              v-if="!isLastStep && currentStep?.type !== 'choice'"
              :disabled="!canGoNext"
              :accent="ACCENTS.primary"
              @click="nextStep"
            >{{ $tt(nextButtonText) }}</BngButton>
            <BngButton
              v-else-if="isLastStep"
              :disabled="!canFinish"
              :accent="ACCENTS.primary"
              @click="handleFinish"
            >{{ $tt(finishButtonText) }}</BngButton>
          </div>
        </template>
      </BngCard>
    </div>
  </div>
</template>

<script>
export const wizardProps = {
  wizardOptions: {
    type: Object,
    default: () => ({})
  },

  title: String,
  preheadings: Array,
  showDivider: {
    type: Boolean,
    default: true,
  },
  showProgress: {
    type: Boolean,
    default: true,
  },
  showBackButton: {
    type: Boolean,
    default: true,
  },
  allowSkip: {
    type: Boolean,
    default: false,
  },

  backButtonText: {
    type: String,
    default: "ui.common.back",
  },
  nextButtonText: {
    type: String,
    default: "ui.common.next",
  },
  finishButtonText: {
    type: String,
    default: "ui.common.finish",
  },
  skipButtonText: {
    type: String,
    default: "ui.common.skip",
  },

  validationMessage: String,
}
</script>

<script setup>
import { provide, computed, watch, nextTick, getCurrentInstance } from "vue"
import { BngScreenHeading, BngCard, BngCardHeading, BngButton, ACCENTS, icons } from "@/common/components/base"
import { vBngUiNavScroll } from "@/common/directives"
import ProgressSteps from "../components/ProgressSteps.vue"
import { useWizard } from "../wizard.js"

const props = defineProps(wizardProps)
const modelValue = defineModel({ default: () => ({}) })

const emit = defineEmits([
  "step-change",
  "step-complete",
  "wizard-finish",
  "validation-error",
])

const {
  currentStepIndex,
  currentStep,
  isFirstStep,
  isLastStep,
  canGoNext,
  canGoBack,
  canFinish,
  progress,
  stepProgress,
  nextStep: wizardNextStep,
  previousStep: wizardPreviousStep,
  skip: wizardSkip,
  steps,
  registerStep: originalRegisterStep,
} = useWizard({
  ...props.wizardOptions,
  allowSkip: props.allowSkip,
})

// detect if wizard has a v-model binding for centralized v-model support
const instance = getCurrentInstance()
const hasCentralizedModel = computed(() => {
  // check if the parent actually provided a v-model by looking for the update listener
  const hasListener = instance && instance.attrs && 'onUpdate:modelValue' in instance.attrs
  return !!hasListener
})

// override step registration to use centralized v-model when available
const registerStep = (stepConfig) => {
  if (hasCentralizedModel.value) {
    // override step's modelValue and updateModelValue
    const centralizedStepConfig = {
      ...stepConfig,
      get modelValue() {
        // access modelValue from defineModel - should be reactive
        return modelValue.value?.[stepConfig.id] || {}
      },
      updateModelValue: (newValue) => {
        // update modelValue using defineModel - this automatically handles emit
        const updatedData = {
          ...modelValue.value,
          [stepConfig.id]: newValue
        }
        modelValue.value = updatedData
      }
    }
    return originalRegisterStep(centralizedStepConfig)
  } else {
    // for individual v-model, don't interfere with the event flow
    // let WizardStep emit directly to its parent
    return originalRegisterStep(stepConfig)
  }
}

// provide wizard state to child components
provide("currentWizardStep", currentStep)
provide("wizardNext", () => nextStep())
provide("wizardSteps", steps) // for WizardSummary component
provide("registerWizardStep", registerStep) // use our centralized-aware version
provide("unregisterWizardStep", stepId => {
  // for centralized model, we should also clean up the data
  if (hasCentralizedModel.value && props.modelValue[stepId]) {
    const updatedData = { ...props.modelValue }
    delete updatedData[stepId]
    emit("update:modelValue", updatedData)
  }
})

const currentStepChoices = computed(() => currentStep.value?.choices || [])

const getChoiceButtonClass = (choiceValue, selectedChoice) =>
  !selectedChoice ? "unanswered" :
  selectedChoice === choiceValue ? "answered-selected" :
  "answered-not-selected"

const handleChoiceClick = (choice) => {
  if (currentStep.value?.updateModelValue) {
    currentStep.value.updateModelValue({
      ...currentStep.value.modelValue,
      choice: choice.value,
    })
    // choice steps auto-advance only if validation passes
    nextTick(() => !currentStep.value?.advanceDisabled && nextStep())
  }
}

// watch for advanceDisabled changes on choice steps to trigger delayed auto-advance
// this is required for possible validation to finish
// but it only makes sense if we remove the :disabled logic from the choice buttons
// watch(
//   () => currentStep.value?.advanceDisabled,
//   (newDisabled, oldDisabled) => {
//     if (oldDisabled && !newDisabled &&
//       currentStep.value?.type === "choice" &&
//       currentStep.value?.modelValue?.choice
//     ) {
//       nextTick(nextStep)
//     }
//   }
// )

const nextStep = () => {
  const stepId = currentStep.value?.id
  const currentData = currentStep.value?.modelValue || {}
  emit("step-complete", {
    stepId,
    stepIndex: currentStepIndex.value,
    step: currentStep.value,
    data: currentData,
  })
  if (wizardNextStep()) {
    emit("step-change", {
      from: currentStepIndex.value - 1,
      to: currentStepIndex.value,
      step: currentStep.value,
    })
  }
}

const previousStep = () => {
  const prevIndex = currentStepIndex.value
  if (wizardPreviousStep()) {
    emit("step-change", {
      from: prevIndex,
      to: currentStepIndex.value,
      step: currentStep.value,
    })
  }
}

const skip = () => {
  if (wizardSkip()) {
    emit("step-complete", {
      stepId: currentStep.value?.id,
      stepIndex: currentStepIndex.value - 1,
      skipped: true,
      data: currentStep.value?.modelValue || {},
    })
  }
}

const handleFinish = () => {
  const allStepData = {}
  steps.value.forEach(step => {
    if (step.modelValue && Object.keys(step.modelValue).length > 0) {
      allStepData[step.id] = step.modelValue
    }
  })
  if (canFinish.value) {
    emit("wizard-finish", {
      success: true,
      data: allStepData,
      completedSteps: Array.from({ length: steps.value.length }, (_, i) => i),
    })
  } else {
    emit("validation-error", {
      step: currentStep.value,
      message: "Cannot finish wizard - validation failed",
    })
  }
}

defineExpose({
  currentStepIndex,
  currentStep,
  progress,
  stepProgress,
  nextStep,
  previousStep,
  finish: handleFinish,
  skip,
  steps,
})
</script>

<style lang="scss" scoped>
$outer-padding: 0.5rem;
$main-width: var(--wizard-width, 55rem);
$main-height: var(--wizard-height, 45rem);

.wizard-container {
  flex: 0 0 auto;
  position: relative;
  display: inline-flex;
  flex-flow: column nowrap;
  align-items: center;
  width: fit-content;
  height: $main-height;
  max-width: 100%;
  max-height: calc(100vh - 4rem);
  padding: $outer-padding 2rem;
  overflow: hidden;
}

.wizard-content {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 0.5em;
  width: $main-width;
  max-width: calc(100% - $outer-padding * 2);
  color: var(--bng-off-white);
  overflow: hidden;
}

.wizard-progress-card {
  flex: 0 0 auto;
  width: 100%;
  max-width: 100%;
  --bg-opacity: 0.8;
}

.wizard-main-card { // card
  flex: 1 1 25rem;
  width: 100%;
  max-width: 100%;
  min-height: 25rem;
  --bg-opacity: 0.8;

  :deep(.card-cnt) {
    flex: 1 1 auto;
    height: 100%;
    overflow: hidden;
  }
}

.wizard-step-content { // step content inside the card, after heading
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0; // allow shrinking
  padding: 1.5rem 2rem;
  overflow: hidden auto;
}

.wizard-navigation {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 2rem;

  .spacer {
    flex: 1;
  }
}

.wizard-validation {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--bng-cool-gray-800);
  border-radius: 0.5rem;
  border-left: 3px solid var(--bng-orange-500);

  .validation-message {
    font-weight: 500;
    color: var(--bng-orange-400);
  }
}

// choice buttons styling
.switch-buttons {
  flex: 0.25 0.25 auto !important;
  display: flex;
  gap: 0;
  min-width: 30em;
  padding: 2px;
  border-radius: 8px;
  background-color: var(--bng-cool-gray-850);
  box-shadow: inset 0 0 0 0.125rem var(--bng-cool-gray-550);

  .bng-button {
    flex: 1;
    min-width: auto;
  }

  > * {
    --bng-button-custom-border-radius: 2px;
  }

  > .unanswered {
    --bng-button-custom-enabled: transparent;
    --bng-button-custom-hover: var(--bng-orange-600);
    --bng-button-custom-active: var(--bng-orange-800);
    --bng-button-custom-disabled: transparent;
    --bng-button-custom-border-enabled: var(--bng-cool-gray-700);
    --bng-button-custom-border-hover: var(--bng-orange-b400);
    --bng-button-custom-border-active: var(--bng-orange-700);
    --bng-button-custom-border-disabled: transparent;
  }

  > .answered-selected {
    --bng-button-custom-enabled: var(--bng-ter-blue-gray-700);
    --bng-button-custom-hover: var(--bng-ter-blue-gray-600);
    --bng-button-custom-active: var(--bng-ter-blue-gray-800);
    --bng-button-custom-disabled: var(--bng-ter-blue-gray-900);
  }

  > .answered-not-selected {
    --bng-button-custom-enabled: transparent;
    --bng-button-custom-hover: var(--bng-ter-blue-gray-600);
    --bng-button-custom-active: var(--bng-ter-blue-gray-800);
    --bng-button-custom-disabled: transparent;
  }
}
</style>
