<template>
  <Wizard title="Quick Setup" @wizard-finish="handleFinish">
    <!-- Step 1: Choose theme -->
    <WizardStep
      id="theme"
      title="Choose Theme"
      type="choice"
      v-model="themeData"
      :choices="[
        { value: 'dark', label: 'Dark Theme' },
        { value: 'light', label: 'Light Theme' }
      ]"
    >
      <template #description>
        <p>Pick your preferred theme for the interface.</p>
      </template>
    </WizardStep>

    <!-- Step 2: Confirmation -->
    <WizardStep
      id="done"
      title="All Set!"
      type="confirmation"
    >
      <template #description>
        <p>Your setup is complete! Click finish to continue.</p>
      </template>

      <div class="summary">
        <strong>Selected theme:</strong> {{ themeData.choice || 'None' }}
      </div>
    </WizardStep>
  </Wizard>
</template>

<script setup>
import { ref } from "vue"
import { Wizard, WizardStep } from "@/common/modules/wizard"

const themeData = ref({})

const handleFinish = (result) => {
  console.log("Setup complete!", result.data)
  alert(`Theme selected: ${themeData.value.choice}`)
}
</script>

<style scoped>
.summary {
  padding: 1rem;
  background: var(--bng-cool-gray-800);
  border-radius: 0.5rem;
  margin-top: 1rem;
}
</style>
