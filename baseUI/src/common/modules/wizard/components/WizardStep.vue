<template>
  <div v-if="isCurrentStep" class="wizard-step-container">
    <div v-if="description || $slots.description" class="step-description">
      <slot name="description">
        <div v-if="description" v-html="description"></div>
      </slot>
    </div>

    <div class="step-content">

      <div v-if="type === 'choice'" class="wizard-choice-step">
        <slot />
      </div>

      <div v-else-if="type === 'form'" class="wizard-form-step">
        <slot>
          <div class="form-placeholder">
            <p>Add your form content here using BngInput, BngDropdown, etc.</p>
            <p class="form-note">Use v-model bindings to connect to step data.</p>
          </div>
        </slot>
      </div>

      <div v-else-if="type === 'confirmation'" class="wizard-confirmation-step">
        <slot>
          <WizardSummary />
        </slot>
      </div>

      <div v-else class="wizard-custom-step">
        <slot>
          <div class="custom-placeholder">
            <p>Custom step content for: {{ title }}</p>
            <p class="custom-note">Add your custom content in the WizardStep default slot</p>
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, provide, onMounted, onUnmounted, useSlots } from "vue"
import WizardSummary from "./WizardSummary.vue"

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  title: String,
  description: String,
  type: {
    type: String,
    default: "custom",
    validator: value => ["choice", "form", "confirmation", "custom"].includes(value)
  },

  // behaviour
  autoSkip: {
    type: Boolean,
    default: true,
  },
  advanceDisabled: {
    type: Boolean,
    default: false,
  },
  advanceDelay: {
    type: Number,
    default: 300,
  },
  required: {
    type: Boolean,
    default: true,
  },

  // validation
  validator: {
    type: Function,
    default: null,
  },

  // dependencies and conditions
  enabledWhen: {
    type: Array,
    default: () => [],
    // [{ step: 'stepId', value: 'expectedValue' }]
    // or [{ step: 'stepId', condition: (value) => boolean }]
  },

  // choices array
  choices: {
    type: Array,
    default: () => [],
    // [
    //   { label: 'Yes', value: 'enable', isYes: true },
    //   { label: 'No', value: 'disable', isNo: true },
    //   { label: 'Ask later', value: 'ask' },
    // ]
  },

  // custom component
  component: {
    type: [String, Object],
    default: null,
  },

  // additional props for custom components
  componentProps: {
    type: Object,
    default: () => ({}),
  },
})

const modelValue = defineModel({ default: () => ({}) })

const registerStep = inject("registerWizardStep", null)
const unregisterStep = inject("unregisterWizardStep", null)
const currentStep = inject("currentWizardStep", null)

const slots = useSlots()

const stepContext = {
  stepId: props.id,
  stepType: props.type
}

provide("wizardStepContext", stepContext)

defineExpose({
  stepId: props.id,
  stepContext,
})

const isCurrentStep = computed(() => currentStep?.value?.id === props.id)

onMounted(() => {
  registerStep?.({
    id: props.id,
    title: props.title,
    description: props.description,
    type: props.type,
    autoSkip: props.autoSkip,
    get advanceDisabled() {
      return props.advanceDisabled
    },
    advanceDelay: props.advanceDelay,
    required: props.required,
    enabledWhen: props.enabledWhen,
    validate: props.validator,
    component: props.component,
    componentProps: props.componentProps,
    choices: props.choices,
    get modelValue() {
      return modelValue.value
    },
    updateModelValue: (value) => {
      modelValue.value = value
    },
    hasDefaultSlot: !!slots.default,
    hasDescriptionSlot: !!slots.description,
  })
})

onUnmounted(() => {
  unregisterStep?.(props.id)
})
</script>

<style lang="scss" scoped>
.wizard-step-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem 0;
}

.step-description {
  color: var(--bng-cool-gray-300);
  line-height: 1.5;
}

.step-content {
  flex: 1 0 10%;
  max-height: 100%;
}

.wizard-choice-step {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.wizard-form-step {
  .form-placeholder {
    background: var(--bng-cool-gray-800);
    border: 1px dashed var(--bng-cool-gray-600);
    border-radius: 0.5rem;
    padding: 2rem;
    text-align: center;
    color: var(--bng-cool-gray-400);

    .form-note {
      font-size: 0.875rem;
      color: var(--bng-cool-gray-500);
      margin-top: 0.5rem;
    }
  }
}

.wizard-confirmation-step {
  .confirmation-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .confirmation-summary {
    h4 {
      color: var(--bng-off-white);
      margin-bottom: 1rem;
    }

    .default-summary pre {
      background: var(--bng-cool-gray-900);
      padding: 1rem;
      border-radius: 0.25rem;
      color: var(--bng-green-300);
      font-size: 0.875rem;
      overflow-x: auto;
    }
  }
}

.wizard-custom-step {
  .custom-placeholder {
    background: var(--bng-cool-gray-800);
    border: 1px dashed var(--bng-cool-gray-600);
    border-radius: 0.5rem;
    padding: 2rem;
    text-align: center;
    color: var(--bng-cool-gray-400);

    .custom-note {
      font-size: 0.875rem;
      color: var(--bng-cool-gray-500);
      margin-top: 0.5rem;
    }
  }
}

:deep(.unanswered) {
  --bng-button-primary-bg: var(--bng-cool-gray-700);
  --bng-button-primary-bg-hover: var(--bng-cool-gray-600);
}

:deep(.answered-selected) {
  --bng-button-primary-bg: var(--bng-orange-600);
  --bng-button-primary-bg-hover: var(--bng-orange-500);
}

:deep(.answered-not-selected) {
  --bng-button-primary-bg: var(--bng-cool-gray-750);
  --bng-button-primary-bg-hover: var(--bng-cool-gray-700);
  opacity: 0.7;
}
</style>
