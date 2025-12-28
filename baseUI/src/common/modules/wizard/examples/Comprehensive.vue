<template>
  <div class="comprehensive-demo">
    <Wizard
      ref="wizardRef"
      title="Comprehensive Setup Wizard"
      :preheadings="['Getting Started', 'Full Example']"
      @step-complete="handleStepComplete"
      @wizard-finish="handleFinish"
    >
      <!-- Welcome Step -->
      <WizardStep
        id="welcome"
        title="Welcome!"
        type="choice"
        v-model="welcomeData"
        :choices="[
          { value: 'yes', label: 'Yes, I am new' },
          { value: 'no', label: 'No, I have used this before' }
        ]"
      >
        <template #description>
          <p>Welcome to the setup wizard! Are you a new user?</p>
          <p><em>Choice steps auto-advance by default - no need to click Next!</em></p>
        </template>
      </WizardStep>

      <!-- Profile Step -->
      <WizardStep
        id="profile"
        title="Your Profile"
        type="form"
        v-model="profileData"
        :validator="validateProfile"
        :enabled-when="[{ step: 'welcome', value: 'yes' }]"
      >
        <template #description>
          <p>Let's create your profile. Enter a username with at least 3 characters.</p>
        </template>

        <div class="form-fields">
          <div class="field-row">
            <label>Username *</label>
            <BngInput
              v-model="profileData.username"
              placeholder="Enter your username (min 3 chars)"
              :required="true"
            />
            <div class="validation-status">
              <span v-if="profileData.username && profileData.username.length >= 3" class="validation-pass">
                ✓ Username is valid
              </span>
              <span v-else-if="profileData.username" class="validation-fail">
                ✗ Username must be at least 3 characters
              </span>
              <span v-else class="validation-fail">
                ✗ Username is required
              </span>
            </div>
          </div>
        </div>
      </WizardStep>

      <!-- Preferences Step (conditional with array-based conditions) -->
      <WizardStep
        id="preferences"
        title="Preferences"
        type="choice"
        v-model="preferencesData"
        :enabled-when="[
          { step: 'welcome', value: 'yes' },
          { step: 'profile', condition: (data) => data?.username?.length > 2 }
        ]"
        :advance-disabled="!isPreferencesReady"
        :choices="[
          { value: 'tutorial', label: 'Start with tutorial' },
          { value: 'explore', label: 'Explore on my own' },
          { value: 'settings', label: 'Configure settings first' }
        ]"
      >
        <template #description>
          <p>Since you're new and have a username, what would you like to explore first?</p>
          <p><strong>Advance-disabled demo!</strong></p>
          <p>This step has additional form validation. Fill the form below to enable advancement:</p>

          <div class="demo-form">
            <div class="field-row">
              <label>Why are you a new user? :)</label>
              <BngInput
                v-model="preferencesData.reason"
                floating-label="Required field for advancement..."
                required
              />
            </div>
            <div class="validation-status">
              <span v-if="isPreferencesReady" class="valid">
                ✅ Form valid - choice will be available now!
              </span>
              <span v-else class="invalid">
                ⏳ Fill required field to enable advancement
              </span>
            </div>
          </div>
        </template>
      </WizardStep>

      <!-- Custom Step with Default Slot Content -->
      <WizardStep
        id="custom"
        title="Custom Welcome"
        type="custom"
        v-model="customData"
        :enabled-when="[{ step: 'preferences', value: 'tutorial' }]"
      >
        <template #description>
          <p>Welcome to the custom step! This content is defined in the description slot.</p>
        </template>

        <!-- Custom content goes in the default slot -->
        <div class="custom-welcome">
          And this is custom content defined directly in the WizardStep default slot.
          <h3>Welcome to the Tutorial!</h3>
          <div class="tutorial-options">
            <button @click="setTutorialChoice('basic')" class="tutorial-btn">
              Basic Tutorial
            </button>
            <button @click="setTutorialChoice('advanced')" class="tutorial-btn">
              Advanced Tutorial
            </button>
          </div>
          <span v-if="tutorialChoice" class="choice-display">
            You chose: <strong>{{ tutorialChoice }}</strong>
          </span>
        </div>
      </WizardStep>

      <!-- Confirmation -->
      <WizardStep
        id="confirmation"
        title="All Set!"
        type="confirmation"
        v-model="confirmationData"
        :require-agreement="true"
        agreement-text="I agree to the Terms of Service"
      >
        <template #description>
          <p>Great! You're all set up and ready to go.</p>
          <p>Here's a summary of your choices:</p>
        </template>

        <WizardSummary :custom="customSummaryData" />
      </WizardStep>
    </Wizard>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { Wizard, WizardStep, WizardSummary } from "@/common/modules/wizard"
import { BngInput } from "@/common/components/base"

// V-model reactive data
const welcomeData = ref({})
const profileData = ref({})
const preferencesData = ref({})
const customData = ref({})
const confirmationData = ref({})

// External reactive data
const tutorialChoice = ref("")
const wizardRef = ref(null)

// Method to set tutorial choice (simplified with v-model)
const setTutorialChoice = (choice) => {
  tutorialChoice.value = choice

  // Direct v-model update!
  customData.value.tutorialType = choice
}

// Validation function for profile step
const validateProfile = data => data.username?.length >= 3

// Computed property to demonstrate advance-disabled
const isPreferencesReady = computed(() => preferencesData.value.reason?.length > 3)

// Custom summary data to demonstrate WizardSummary customization
const customSummaryData = computed(() => {
  const customItems = []

  // Add username from form step (not automatically included in choices)
  if (profileData.value.username) {
    customItems.push({
      label: "Username",
      value: profileData.value.username,
      disabled: false
    })
  }

  // Add tutorial choice if it was set
  if (tutorialChoice.value) {
    customItems.push({
      label: "Tutorial Type",
      value: tutorialChoice.value.charAt(0).toUpperCase() + tutorialChoice.value.slice(1),
      disabled: false
    })
  }

  return customItems
})

// Reset function to clear skipped step data when user chooses "no" on welcome step
const resetSkippedStepsData = () => {
  profileData.value = {}
  preferencesData.value = {}
  customData.value = {}
  tutorialChoice.value = ""
  console.log("🧹 Cleared data for skipped steps")
}

const handleStepComplete = ({ stepId, data }) => {
  // If welcome step completed with "no", reset skipped step data
  if (stepId === "welcome" && data.choice === "no") {
    resetSkippedStepsData()
  }
}

const handleFinish = (result) => {
  console.log("Setup wizard completed!", result.data)

  // Access data directly from v-model refs (much simpler!):
  console.log("User is new:", welcomeData.value.choice === "yes")
  console.log("Username:", profileData.value.username)
  console.log("First preference:", preferencesData.value.choice)
  console.log("Tutorial type:", customData.value.tutorialType)

  console.info(`Setup complete! Welcome to the app, ${profileData.value.username}!`)
}
</script>

<style lang="scss" scoped>
.simple-demo {
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: center;
  overflow: auto;
}

.custom-welcome {
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  overflow: auto;

  h3 {
    color: var(--bng-off-white);
    margin-bottom: 1rem;
  }

  p {
    color: var(--bng-cool-gray-300);
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }

  .tutorial-options {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 1rem;

    .tutorial-btn {
      padding: 0.75rem 1.5rem;
      background: var(--bng-ter-blue-gray-700);
      border: 1px solid var(--bng-ter-blue-gray-600);
      border-radius: 0.375rem;
      color: var(--bng-off-white);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: var(--bng-ter-blue-gray-600);
        border-color: var(--bng-ter-blue-gray-500);
      }
      &:active {
        background: var(--bng-ter-blue-gray-800);
      }
    }
  }

  .choice-display {
    color: var(--bng-green-400);
    font-weight: 500;

    strong {
      color: var(--bng-green-300);
    }
  }
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  .field-row {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
      font-weight: 500;
      color: var(--bng-off-white);
    }
  }
}

.demo-form {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid var(--bng-ter-blue-gray-600);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.2);
}

.validation-status {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
}

.validation-status .valid {
  color: var(--bng-green-400);
}

.validation-status .invalid {
  color: var(--bng-orange-400);
}
</style>
