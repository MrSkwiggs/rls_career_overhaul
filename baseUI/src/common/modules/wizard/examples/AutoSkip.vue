<template>
  <div class="auto-skip-demo">
    <div class="demo-info">
      <h2>Auto-Skip Demo</h2>
      <p><strong>Testing the new auto-skip behavior:</strong></p>
      <ul>
        <li>✅ <strong>advanceOnChoice</strong> - Advances after selecting a choice</li>
        <li>✅ <strong>autoSkip</strong> - Skips disabled steps automatically</li>
      </ul>

      <div class="instructions">
        <h3>Test Instructions:</h3>
        <ol>
          <li><strong>Choose "Basic"</strong> → Auto-advances to Basic Config, Advanced Config auto-skipped</li>
          <li><strong>Choose "Advanced"</strong> → Basic Config auto-skipped, auto-advances to Advanced Config</li>
          <li><strong>Select any config option</strong> → Auto-advances to Summary</li>
          <li><strong>Navigate back/forward</strong> → Disabled steps auto-skipped!</li>
        </ol>
      </div>

      <div class="debug-data">
        <h3>Live Data:</h3>
        <div class="data-item">
          <strong>Setup:</strong> {{ JSON.stringify(setupData, null, 2) }}
        </div>
        <div class="data-item">
          <strong>Basic:</strong> {{ JSON.stringify(basicData, null, 2) }}
        </div>
        <div class="data-item">
          <strong>Advanced:</strong> {{ JSON.stringify(advancedData, null, 2) }}
        </div>
      </div>
    </div>

    <Wizard title="Auto-Skip Demonstration" @wizard-finish="handleFinish">
      <!-- Step 1: Setup Choice -->
      <WizardStep
        id="setup"
        title="Setup Type"
        type="choice"
        v-model="setupData"
        :choices="[
          { value: 'basic', label: 'Basic Setup (enables Basic Config, skips Advanced)' },
          { value: 'advanced', label: 'Advanced Setup (skips Basic Config, enables Advanced)' }
        ]"
      >
        <template #description>
          <p>Choose your setup type. This will determine which steps are enabled:</p>
          <ul>
            <li><strong>Basic:</strong> Shows Basic Config step, auto-skips Advanced Config</li>
            <li><strong>Advanced:</strong> Auto-skips Basic Config, shows Advanced Config</li>
          </ul>
          <div v-if="setupData.choice" class="current-choice">
            <strong>✅ Selected:</strong> {{ setupData.choice }}
          </div>
        </template>
      </WizardStep>

      <!-- Step 2: Basic Config (only enabled for basic setup) -->
      <WizardStep
        id="basicConfig"
        title="Basic Configuration"
        type="choice"
        v-model="basicData"
        :auto-skip="true"
        :enabled-when="[{ step: 'setup', value: 'basic' }]"
        :choices="[
          { value: 'default', label: 'Use Default Settings' },
          { value: 'custom', label: 'Customize Basic Settings' }
        ]"
      >
        <template #description>
          <p><strong>Basic Configuration Step</strong></p>
          <p>This step is only shown when "Basic Setup" is selected.</p>
          <p>When "Advanced Setup" is selected, this step is automatically skipped!</p>
          <p><em>Selecting any choice will auto-advance to the next step.</em></p>
          <div v-if="basicData.choice" class="current-choice">
            <strong>✅ Basic Choice:</strong> {{ basicData.choice }}
          </div>
        </template>
      </WizardStep>

      <!-- Step 3: Advanced Config (only enabled for advanced setup) -->
      <WizardStep
        id="advancedConfig"
        title="Advanced Configuration"
        type="choice"
        v-model="advancedData"
        :auto-skip="true"
        :enabled-when="[{ step: 'setup', value: 'advanced' }]"
        :choices="[
          { value: 'performance', label: 'Performance Mode' },
          { value: 'development', label: 'Development Mode' },
          { value: 'production', label: 'Production Mode' }
        ]"
      >
        <template #description>
          <p><strong>Advanced Configuration Step</strong></p>
          <p>This step is only shown when "Advanced Setup" is selected.</p>
          <p>When "Basic Setup" is selected, this step is automatically skipped!</p>
          <p><em>Selecting any choice will auto-advance to the next step.</em></p>
          <div v-if="advancedData.choice" class="current-choice">
            <strong>✅ Advanced Choice:</strong> {{ advancedData.choice }}
          </div>
        </template>
      </WizardStep>

      <!-- Step 4: Summary (always shown) -->
      <WizardStep
        id="summary"
        title="Configuration Summary"
        type="confirmation"
        v-model="summaryData"
      >
        <template #description>
          <p>Configuration complete! Here's what was selected:</p>
        </template>

        <WizardSummary />

        <div class="auto-skip-results">
          <h4>🎯 Auto-Skip Test Results:</h4>
          <div class="result-item">
            <strong>Setup Type:</strong>
            <span class="choice-value">{{ setupData.choice || 'Not selected' }}</span>
          </div>
          <div class="result-item">
            <strong>Basic Config:</strong>
            <span :class="shouldShowBasic ? 'enabled' : 'skipped'">
              {{ shouldShowBasic ? (basicData.choice || 'Available') : '⏭️ Auto-skipped' }}
            </span>
          </div>
          <div class="result-item">
            <strong>Advanced Config:</strong>
            <span :class="shouldShowAdvanced ? 'enabled' : 'skipped'">
              {{ shouldShowAdvanced ? (advancedData.choice || 'Available') : '⏭️ Auto-skipped' }}
            </span>
          </div>
        </div>
      </WizardStep>
    </Wizard>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { openMessage } from "@/services/popup"
import { Wizard, WizardStep, WizardSummary } from "@/common/modules/wizard"

// Step data
const setupData = ref({})
const basicData = ref({})
const advancedData = ref({})
const summaryData = ref({})

// Computed properties to show which steps should be enabled
const shouldShowBasic = computed(() => setupData.value.choice === 'basic')
const shouldShowAdvanced = computed(() => setupData.value.choice === 'advanced')

const handleFinish = async () => {
  const txt = []

  txt.push("Auto-skip demo completed!")
  txt.push("- Setup: " + JSON.stringify(setupData.value, null, 2))
  txt.push("- Basic: " + JSON.stringify(basicData.value, null, 2))
  txt.push("- Advanced: " + JSON.stringify(advancedData.value, null, 2))

  txt.push("Auto-Skip Demo Results:")
  txt.push("- Setup type: " + setupData.value.choice || "None")
  txt.push("- Basic enabled: " + shouldShowBasic.value)
  txt.push("- Advanced enabled: " + shouldShowAdvanced.value)
  txt.push("- Basic data: " + basicData.value.choice || "Skipped")
  txt.push("- Advanced data: " + advancedData.value.choice || "Skipped")

  await openMessage("Auto-skip demo completed!", txt.join("<br/>"))
  console.log(txt.join("\n"))
}
</script>

<style lang="scss" scoped>
.auto-skip-demo {
  display: flex;
  flex-flow: row nowrap;
  align-items: flex-start;
  justify-content: center;
  gap: 2rem;
  overflow: auto;
  padding: 1rem;
}

.demo-info {
  flex: 0 0 auto;
  max-width: 450px;
  background: var(--bng-cool-gray-800);
  padding: 1.5rem;
  border-radius: 0.5rem;
  color: #eee;
}

.demo-info h2 {
  margin-top: 0;
  color: var(--bng-purple-400);
}

.demo-info ul {
  margin: 1rem 0 0 1.5rem;
}

.instructions {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--bng-purple-900);
  border: 1px solid var(--bng-purple-600);
  border-radius: 0.5rem;
}

.instructions h3 {
  margin-top: 0;
  color: var(--bng-purple-200);
}

.instructions ol {
  margin: 0.5rem 0 0 1.5rem;
}

.debug-data {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--bng-cool-gray-900);
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.9rem;
}

.data-item {
  margin: 0.5rem 0;
  padding: 0.5rem;
  background: var(--bng-cool-gray-800);
  border-radius: 0.25rem;
  word-break: break-all;
}

.current-choice {
  margin-top: 1rem;
  padding: 0.75rem;
  background: var(--bng-purple-900);
  border: 1px solid var(--bng-purple-600);
  border-radius: 0.25rem;
  color: var(--bng-purple-200);
}

.auto-skip-results {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--bng-cool-gray-800);
  border-radius: 0.5rem;
}

.result-item {
  margin: 0.5rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.choice-value {
  color: var(--bng-blue-400);
  font-weight: bold;
}

.enabled {
  color: var(--bng-green-400);
  font-weight: bold;
}

.skipped {
  color: var(--bng-orange-400);
  font-style: italic;
}
</style>
