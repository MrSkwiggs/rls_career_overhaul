# Wizard

Simple, declarative wizard for multi-step UI flows.

## Quick Start

```html
<template>
  <!-- Standalone screen with blurred fullscreen layout -->
  <WizardView v-model="wizardData" title="Setup Wizard" @wizard-finish="handleFinish">
    <WizardStep id="step1" title="Choose Type" type="choice" :choices="choices" />
    <WizardStep id="step2" title="Configure" type="form">
      <BngInput v-model="data.name" placeholder="Name" />
    </WizardStep>
  </WizardView>

  <!-- Or embedded component -->
  <Wizard v-model="wizardData" title="Setup" @wizard-finish="handleFinish">
    <!-- same content -->
  </Wizard>
</template>

<script setup>
import { ref } from "vue"
import { WizardView, Wizard, WizardStep } from "@/common/modules/wizard"

const wizardData = ref({})
const choices = [
  { value: 'basic', label: 'Basic Setup' },
  { value: 'advanced', label: 'Advanced Setup' }
]

const handleFinish = (result) => {
  console.log('Wizard completed:', result.data)
}
</script>
```

## Core Concepts

**Auto-Advancing Choices**: Choice steps advance automatically when clicked (no Next button needed).

**Individual v-model**: Each step has its own reactive data.

```html
<WizardStep v-model="stepData" ... />
```

**Centralized v-model**: Single object holds all step data.

```html
<Wizard v-model="allData" ...>
  <WizardStep id="step1" ... />  <!-- auto-creates allData.step1 -->
</Wizard>
```

**Conditional Steps**: Steps enabled based on other step data.

```html
<WizardStep
  :enabled-when="[{ step: 'userType', value: 'advanced' }]"
  :auto-skip="true"
/>
```

**Validation Control**: Disable auto-advance for form validation.

```html
<WizardStep
  type="choice"
  :advance-disabled="!isFormValid"
  :choices="choices"
>
  <BngInput v-model="apiKey" required />
</WizardStep>
```

## API Reference

### WizardView Props

All Wizard props and events.

### WizardView/Wizard Exposed Methods

Both components expose the same methods for programmatic control:

```html
<WizardView ref="wizardRef" ... />
<Wizard ref="wizardRef" ... />
```

**State (reactive getters):**

- `currentStepIndex` - Current step index
- `currentStep` - Current step object
- `progress` - Completion percentage
- `stepProgress` - Array of step progress info
- `steps` - All wizard steps

**Methods:**

- `nextStep()` - Advance to next step
- `previousStep()` - Go to previous step
- `finish()` - Complete the wizard
- `skip()` - Skip current step (if allowed)

**Advanced:**

- `wizard` - Direct access to embed Wizard component ref (WizardView only)

**Usage Example:**

```html
<template>
  <WizardView ref="wizardRef" v-model="data" @wizard-finish="handleFinish">
    <WizardStep id="step1" ... />
    <WizardStep id="step2" ... />
  </WizardView>
  <button @click="goNext">Next Step</button>
  <button @click="checkProgress">Check Progress</button>
</template>

<script setup>
const wizardRef = ref()

const goNext = () => {
  wizardRef.value.nextStep()
}

const checkProgress = () => {
  console.log('Current step:', wizardRef.value.currentStepIndex)
  console.log('Progress:', wizardRef.value.progress + '%')
}
</script>
```

### Wizard Props

**Basic Configuration:**

- `v-model` - Centralized data object (optional)
- `title` - Wizard title
- `preheadings` - Array of preheading strings
- `wizard-pptions` - Object with additional wizard configuration

**Display Options:**

- `show-progress` - Show progress indicator (default: true)
- `show-divider` - Show divider under title (default: true)
- `showBack-button` - Show back navigation button (default: true)

**Navigation:**

- `allow-skip` - Enable skip button (default: false)

**Button Text Customization:**

- `back-button-text` - Back button label (default: "ui.common.back")
- `next-button-text` - Next button label (default: "ui.common.next")
- `finish-button-text` - Finish button label (default: "ui.common.finish")
- `skip-button-text` - Skip button label (default: "ui.common.skip")

**Validation:**

- `validation-message` - Custom validation error message

**Example Usage:**

```html
<Wizard
  v-model="wizardData"
  title="Setup Wizard"
  :preheadings="['Configuration', 'Setup']"
  :show-progress="true"
  :show-back-button="true"
  :allow-skip="false"
  back-button-text="Go Back"
  next-button-text="Continue"
  finish-button-text="Complete Setup"
  @wizard-finish="handleFinish"
>
  <!-- steps -->
</Wizard>
```

### WizardStep Props

- `id` - Step identifier (required)
- `v-model` - Individual step data (optional)
- `title` - Step title
- `type` - "choice", "form", "confirmation", "custom"
- `choices` - Array of `{value, label, isYes?, isNo?}` for choice steps (multiple choices can share flags)
- `enabled-when` - Array of conditions: `[{step: 'id', value: 'val'}]`
- `auto-skip` - Skip when disabled
- `advance-disabled` - Disable auto-advance for validation
- `required` - Step required for completion
- `validator` - Function to validate step data: `(stepData) => boolean`

### Events

- `@step-complete` - Step completed (includes step data and can indicate if skipped)
- `@step-change` - Step changed (from/to step indices)
- `@wizard-finish` - Wizard completed successfully
- `@validation-error` - Validation failed (when trying to finish with invalid data)

**Event Examples:**

```html
<Wizard
  @step-complete="handleStepComplete"
  @step-change="handleStepChange"
  @wizard-finish="handleFinish"
  @validation-error="handleValidationError"
>
  <!-- steps -->
</Wizard>
```

```javascript
const handleStepComplete = (event) => {
  // { stepId, stepIndex, step, data, skipped? }
  console.log('Step completed:', event.stepId, event.data)
}

const handleStepChange = (event) => {
  // { from, to, step }
  console.log('Changed from step', event.from, 'to', event.to)
}

const handleValidationError = (event) => {
  // { step, message }
  console.error('Validation failed:', event.message)
}
```

**Validation Patterns:**

```html
<!-- Email validation -->
<WizardStep
  :validator="(data) => data.email?.includes('@')"
>
  <BngInput v-model="stepData.email" />
</WizardStep>

<!-- Multi-field validation -->
<WizardStep
  :validator="(data) => data.password === data.confirmPassword && data.password?.length >= 8"
>
  <BngInput v-model="stepData.password" type="password" />
  <BngInput v-model="stepData.confirmPassword" type="password" />
</WizardStep>

<!-- Complex validation with external function -->
<WizardStep
  :validator="validateUserData"
>
  <!-- form fields -->
</WizardStep>
```

## Examples

### Basic Choice Flow

```html
<Wizard v-model="data" @wizard-finish="complete">
  <!-- Auto-advances on choice -->
  <WizardStep id="welcome" type="choice" :choices="[
    { value: 'new', label: 'New User' },
    { value: 'returning', label: 'Returning User' }
  ]" />

  <!-- Only shown for new users -->
  <WizardStep
    id="tutorial"
    :enabled-when="[{ step: 'welcome', value: 'new' }]"
    title="Tutorial"
  >
    <p>Welcome! Let's get started...</p>
  </WizardStep>
</Wizard>
```

### Progress Icons with Yes/No Flags

```html
<!-- Basic yes/no -->
<WizardStep id="consent" type="choice" :choices="[
  { value: 'accept', label: 'Accept', isYes: true },
  { value: 'decline', label: 'Decline', isNo: true }
]" />

<!-- Multiple choices with same flag (nuanced responses) -->
<WizardStep id="usage" type="choice" :choices="[
  { value: 'daily', label: 'Yes, daily', isYes: true },
  { value: 'weekly', label: 'Yes, weekly', isYes: true },
  { value: 'monthly', label: 'Yes, monthly', isYes: true },
  { value: 'rarely', label: 'No, rarely', isNo: true },
  { value: 'never', label: 'No, never', isNo: true }
]" />

<!-- Mixed flagging with unmarked options -->
<WizardStep id="newsletter" type="choice" :choices="[
  { value: 'subscribe', label: 'Subscribe to Newsletter', isYes: true },
  { value: 'skip', label: 'Skip for Now', isNo: true },
  { value: 'later', label: 'Ask Me Later' }  // unmarked - treated as "yes"
]" />

<!-- Without flags - all choices default to "yes" icon -->
<WizardStep id="theme" type="choice" :choices="[
  { value: 'dark', label: 'Dark Theme' },
  { value: 'light', label: 'Light Theme' }
]" />
```

### Form with Validation

```html
<script setup>
const formData = ref({ email: "", terms: false })

// Option 1: Using validator prop (recommended)
const validateForm = (data) => {
  return data.email?.includes("@") && data.terms
}

// Option 2: Using advance-disabled for UI control
const isValid = computed(() =>
  formData.value.email?.includes("@") && formData.value.terms
)
</script>

<Wizard>
  <!-- Using validator prop - wizard handles validation internally -->
  <WizardStep
    v-model="formData"
    :validator="validateForm"
  >
    <BngInput v-model="formData.email" type="email" required />
    <BngCheckbox v-model="formData.terms" label="Accept terms" />
  </WizardStep>

  <!-- Alternative: Using advance-disabled for UI control -->
  <WizardStep
    v-model="formData"
    type="choice"
    :advance-disabled="!isValid"
    :choices="[{ value: 'continue', label: 'Continue' }]"
  >
    <BngInput v-model="formData.email" type="email" required />
    <BngCheckbox v-model="formData.terms" label="Accept terms" />
  </WizardStep>
</Wizard>
```

### Conditional Flow

```html
<Wizard v-model="data">
  <WizardStep id="setup" type="choice" :choices="setupTypes" />

  <!-- Only for basic setup -->
  <WizardStep
    id="basic"
    :enabled-when="[{ step: 'setup', value: 'basic' }]"
    :auto-skip="true"
    type="choice"
    :choices="basicOptions"
  />

  <!-- Only for advanced setup -->
  <WizardStep
    id="advanced"
    :enabled-when="[{ step: 'setup', value: 'advanced' }]"
    :auto-skip="true"
    type="choice"
    :choices="advancedOptions"
  />

  <!-- Summary for all -->
  <WizardStep id="summary" title="Summary">
    <WizardSummary />
  </WizardStep>
</Wizard>
```

### Custom Content

```html
<WizardStep id="custom" title="API Setup">
  <div class="api-config">
    <BngInput v-model="config.endpoint" label="API Endpoint" />
    <BngInput v-model="config.key" label="API Key" type="password" />
    <BngDropdown v-model="config.region" :options="regions" />

    <!-- Custom validation logic -->
    <div v-if="!isConfigValid" class="error">
      Please fill all required fields
    </div>
  </div>
</WizardStep>
```

## Components

**WizardSummary**: Displays selected choices from previous steps with customization options.

```html
<!-- Basic usage - automatic choice summaries -->
<WizardStep id="summary" title="Review">
  <WizardSummary />
</WizardStep>

<!-- Extend automatic summaries with custom data -->
<WizardSummary :custom="[
  { label: 'Username', value: user.name },
  { label: 'Email', value: user.email }
]" />

<!-- Override automatic summaries completely -->
<WizardSummary
  :custom="[
    { label: 'Configuration', value: 'Advanced Setup' },
    { label: 'Features', value: 'All Enabled', disabled: true }
  ]"
  :replace="true"
/>
```

**WizardSummary Props:**

- **`custom`** (Array): Custom summary items to extend or replace automatic choice summaries
- **`replace`** (Boolean): If true, replace automatic summaries entirely with custom data

**Summary Item Format:**

```javascript
{
  label: "Display Label",    // Required - shown as label
  value: "Display Value",    // Required - shown as value
  disabled: false            // Optional - if true, shows as disabled/grayed out
}
```

**Slots**: Customize step content, headers, navigation.

```html
<Wizard>
  <template #step-title="{ step }">
    <CustomHeader :step="step" />
  </template>
  <WizardStep>
    <template #description>
      Custom description
    </template>
  </WizardStep>
</Wizard>
```
