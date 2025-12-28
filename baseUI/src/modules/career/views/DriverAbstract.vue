<template>
  <ComputerWrapper ref="wrapper" :path="['Driver\'s Abstract']" title="Driver's Abstract" back @back="close">
    <BngCard class="driver-abstract-card">
      <div v-if="abstractData" class="content">
        <div class="stats-grid-3">
          <div class="score-card" :style="{ borderColor: getDriverColor() }">
            <div class="score-header">
              <div class="section-title">Driver Score: Out of 100</div>
              <TutorialButton :icon="icons.help" :pages="['driverScore']" />
            </div>
            <div class="score-content">
              <div class="score-value" :class="getDriverColorClass()">
                {{ abstractData.driverScore }}
              </div>
              <div class="score-info">
                <div class="score-risk" :class="getDriverColorClass()">
                  {{ abstractData.driverScoreTier.risk }}
                </div>
                <div class="score-description">
                  {{ abstractData.driverScoreTier.description }}
                </div>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="section-title">Total Distance Driven</div>
            <div class="stat-value blue">
              {{ totalDistanceFormatted }}
            </div>
          </div>

          <div class="stat-card">
            <div class="section-title">Premium Effect</div>
            <div class="stat-value" :class="premiumEffectClass">
              {{ premiumEffectText }}
            </div>
            <div class="stat-note">
              Applies to every insurance provider when premiums renew
            </div>
          </div>
        </div>

        <div class="stats-grid-2">
          <div class="info-card">
            <div class="section-title">Repair History</div>
            <div class="info-rows">
              <div class="info-row">
                <span class="info-label">Insurance Claims:</span>
                <span class="info-value orange">{{ abstractData.repairHistory.insuranceRepairs }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Private Repairs:</span>
                <span class="info-value green">{{ abstractData.repairHistory.privateRepairs }}</span>
              </div>
              <div class="info-row total">
                <span class="info-label">Total Repairs:</span>
                <span class="info-value">{{ (abstractData.repairHistory.insuranceRepairs) + (abstractData.repairHistory.privateRepairs) }}</span>
              </div>
            </div>
            <div class="info-tip">
              Private repairs don't affect your record
            </div>
          </div>

          <div class="info-card">
            <div class="section-title">Financial Summary</div>
            <div class="info-rows">
              <div class="info-row bottom-border">
                <span class="info-label">Vehicles Currently Insured:</span>
                <span class="info-value blue">{{ abstractData.financialSummary.vehiclesInsuredCount }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Premiums Paid:</span>
                <span class="info-value red"><BngUnit class="no-margin" :money="abstractData.financialSummary.totalPremiumPaid" /></span>
              </div>
              <div class="info-row">
                <span class="info-label">Deductibles Paid:</span>
                <span class="info-value orange"><BngUnit class="no-margin" :money="abstractData.financialSummary.totalDeductiblePaid" /></span>
              </div>
              <div class="info-row">
                <span class="info-label">Private Repairs:</span>
                <span class="info-value yellow"><BngUnit class="no-margin" :money="abstractData.financialSummary.totalPrivateRepairsPaid" /></span>
              </div>
              <div class="info-row total">
                <span class="info-label">Total Spent:</span>
                <span class="info-value"><BngUnit class="no-margin" :money="abstractData.financialSummary.totalPaid" /></span>
              </div>
            </div>
            <div class="info-summary">
              <div class="info-row small">
                <span class="info-label">Damage Covered by Insurance:</span>
                <span class="info-value green bold"><BngUnit class="no-margin" :money="abstractData.financialSummary.damageCoveredByInsurance" /></span>
              </div>
              <div class="info-tip blue italic">
                Insurance saved you from paying full repair costs
              </div>
            </div>
          </div>
        </div>

        <div class="reset-card">
          <div class="section-title">Driver Score Reset</div>
          <div class="reset-content">
            <p class="reset-description">
              Reset your driver score to <span class="highlight">{{ abstractData.driverScoreReset.resetTo }}</span> to remove premium penalties.
            </p>
            <div class="reset-details">
              <div class="reset-row">
                <span class="reset-label">Current Score:</span>
                <span class="reset-value" :class="canResetScore ? 'red' : 'green'">{{ abstractData.driverScore }}</span>
              </div>
              <div class="reset-row">
                <span class="reset-label">Reset To:</span>
                <span class="reset-value green">{{ abstractData.driverScoreReset.resetTo }}</span>
              </div>
              <!-- <div v-if="resetSavingsPer100km > 0" class="reset-row savings">
                <span class="reset-label">Savings per 100km:</span>
                <span class="reset-value"><BngUnit class="no-margin" :money="resetSavingsPer100km" /></span>
              </div> -->
              <div class="reset-row cost">
                <span class="reset-label">Reset Cost:</span>
                <span class="reset-value yellow large"><BngUnit class="no-margin" :money="abstractData.driverScoreReset.resetCost" /></span>
              </div>
              <div v-if="canResetScore && resetSavingsPer100km > 0" class="reset-payback">
                Pays for itself after xxx km
              </div>
            </div>
            <button
              @click="resetDriverScore"
              :disabled="!canResetScore"
              class="reset-button"
              :class="{ disabled: !canResetScore }"
            >
              {{ canResetScore ? 'Reset Score' : 'Not Available (Score Already at or Higher than ' + abstractData.driverScoreReset.resetTo + ')' }}
            </button>
          </div>
        </div>
      </div>
    </BngCard>
  </ComputerWrapper>
</template>

<script setup>
import { lua, useBridge } from "@/bridge"
import { onBeforeMount, computed, ref } from "vue"
import ComputerWrapper from "./ComputerWrapper.vue"
import { BngCard, BngUnit, icons } from "@/common/components/base"
import { TutorialButton } from "@/modules/career/components"

const { units } = useBridge()

const abstractData = ref(null)

const driverTier = computed(() => abstractData.value?.driverScoreTier)

const totalDistanceFormatted = computed(() => {
  if (!abstractData.value) return ''
  return units.buildString('length', abstractData.value.totalDistanceDriven, 0)
})

const premiumEffectClass = computed(() => {
  if (!driverTier.value) return ''
  const multiplier = driverTier.value.multiplier
  if (multiplier < 1) return 'green'
  if (multiplier > 1) return 'red'
  return 'neutral'
})

const premiumEffectText = computed(() => {
  if (!driverTier.value) return 'Standard Rate'
  const multiplier = driverTier.value.multiplier

  if (multiplier < 1) {
    const savings = Math.round((1 - multiplier) * 100)
    return `${savings}% Savings`
  } else if (multiplier > 1) {
    const penalty = Math.round((multiplier - 1) * 100)
    return `${penalty}% Penalty`
  }
  return 'Standard Rate'
})

const canResetScore = computed(() => {
  if (!abstractData.value) return false
  const currentScore = abstractData.value.driverScore
  const resetToScore = abstractData.value.driverScoreReset.resetTo
  return currentScore < resetToScore
})

const getDriverColorClass = () => {
  if (!driverTier.value) return 'green'
  const multiplier = driverTier.value.multiplier
  if (multiplier < 1) return 'blue'
  if (multiplier < 1.1) return 'green'
  if (multiplier < 1.3) return 'yellow'
  if (multiplier < 1.5) return 'orange'
  return 'red'
}

const getDriverColor = () => {
  const colorClass = getDriverColorClass()
  const colorMap = {
    blue: 'var(--blue-200)',
    green: 'var(--green-300)',
    yellow: 'var(--yellow-400)',
    orange: 'var(--orange-shade-10)',
    red: 'var(--red-400)'
  }
  return colorMap[colorClass] || 'var(--green-300)'
}

const loadData = async () => {
  try {
    const data = await lua.career_modules_playerAbstract.getPlayerAbstractData()
    abstractData.value = data
  } catch (error) {
    console.error("Failed to load driver abstract data:", error)
  }
}

const resetDriverScore = async () => {
  try {
    await lua.career_modules_insurance_insurance.resetDriverScore()
    // reload data after reset
    await loadData()
  } catch (error) {
    console.error("Failed to reset driver score:", error)
  }
}

const close = () => {
  lua.career_modules_playerAbstract.closePlayerAbstractMenu()
}

onBeforeMount(loadData)
</script>

<style lang="scss">
@import '@/../../../ui/ui-vue/src/modules/career/components/insurance/insuranceStyle.css';
</style>

<style scoped lang="scss">

.content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background-color: var(--blue-shade-100);
  color: white;
  padding: 1.5rem;
  max-height: 90vh;
  overflow-y: auto;
}

/* Header */
.abstract-header {
  margin-bottom: 0.5rem;
}

.abstract-title {
  font-size: 1.875rem;
  font-weight: bold;
  color: white;
  margin-bottom: 0.25rem;
}

.abstract-subtitle {
  font-size: 0.975rem;
  color: var(--grey-200);
}

/* Grid Layouts */
.stats-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.driver-abstract-card{
  width: 50vw;
}

.stats-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

/* Score Card (main driver score) */
.score-card {
  background: linear-gradient(135deg, var(--grey-300), var(--grey-400));
  border-radius: 0.5rem;
  padding: 1rem;
  border: 2px solid;
  position: relative;
}

.score-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.section-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--grey-200);
}

.score-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.score-value {
  font-size: 3.1rem;
  font-weight: 900;
}

.score-info {
  display: flex;
  flex-direction: column;
}

.score-risk {
  font-size: 1.225rem;
  font-weight: bold;
}

.score-description {
  font-size: 0.975rem;
  color: var(--grey-200);
}

/* Stat Cards */
.stat-card {
  background-color: var(--grey-300);
  border-radius: 0.5rem;
  padding: 1rem;
}

.stat-value {
  font-size: 1.975rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.stat-value.blue {
  color: var(--blue-200);
}

.stat-unit {
  font-size: 1.35rem;
  color: var(--grey-200);
}

.stat-note {
  font-size: 0.85rem;
  color: var(--grey-200);
  line-height: 1.5;
  margin-top: 0.5rem;
}

.info-card {
  background-color: var(--grey-300);
  border-radius: 0.5rem;
  padding: 1rem;
}

.section-title {
  font-size: 1.225rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.75rem;
}

.info-rows {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.975rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-row.total {
  border-top: 1px solid var(--bng-cool-gray-100);
  padding-top: 0.5rem;
  margin-top: 0.25rem;
}

.info-row.bottom-border {
  border-bottom: 1px solid var(--bng-cool-gray-100);
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
}

.info-row.small {
  font-size: 0.975rem;
}

.info-label {
  color: var(--grey-200);
}

.info-row.total .info-label {
  color: white;
  font-weight: 600;
}

.info-value {
  font-weight: 600;
}

.info-value.blue {
  color: var(--blue-200);
}

.info-value.green {
  color: var(--green-300);
}

.info-value.orange {
  color: var(--orange-shade-10);
}

.info-value.red {
  color: var(--red-400);
}

.info-value.yellow {
  color: var(--yellow-400);
}

.info-value.bold {
  font-weight: bold;
}

.info-row.total .info-value {
  color: white;
  font-weight: bold;
}

.info-tip {
  font-size: 0.85rem;
  color: var(--blue-200);
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--bng-cool-gray-100);
}

.info-tip.green {
  color: var(--green-300);
}

.info-tip.blue {
  color: var(--blue-200);
}

.info-tip.italic {
  font-style: italic;
}

.info-summary {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--bng-cool-gray-100);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* Reset Card */
.reset-card {
  background: linear-gradient(135deg, var(--purple-900), var(--purple-800));
  border: 2px solid var(--purple-500);
  border-radius: 0.5rem;
  padding: 1rem;
}

.reset-content {
  font-size: 0.975rem;
  color: var(--grey-200);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.reset-description {
  margin: 0;
}

.highlight {
  color: white;
  font-weight: 600;
}

.reset-details {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 0.375rem;
  padding: 0.75rem;
}

.reset-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.reset-row.savings {
  background-color: rgba(22, 42, 41, 0.3);
  border-radius: 0.375rem;
  padding: 0.5rem;
}

.reset-row.cost {
  padding-top: 0.5rem;
  border-top: 1px solid var(--grey-300);
}

.reset-label {
  color: var(--grey-200);
}

.reset-row.cost .reset-label {
  color: white;
  font-weight: 600;
}

.reset-value {
  font-weight: bold;
}

.reset-value.green {
  color: var(--green-400);
}

.reset-value.red {
  color: var(--red-400);
}

.reset-value.yellow {
  color: var(--yellow-400);
}

.reset-value.large {
  font-size: 1.225rem;
}

.reset-payback {
  font-size: 0.85rem;
  color: var(--grey-200);
  text-align: center;
  margin-top: 0.5rem;
}

.reset-button {
  width: 100%;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
  border: none;
  cursor: pointer;
  background-color: var(--purple-600);
  color: white;
}

.reset-button:hover:not(.disabled) {
  background-color: var(--purple-500);
}

.reset-button.disabled {
  background-color: var(--grey-300);
  color: var(--grey-200);
  cursor: not-allowed;
}

/* Color Classes */
.blue {
  color: var(--blue-200);
}

.green {
  color: var(--green-300);
}

.yellow {
  color: var(--yellow-400);
}

.orange {
  color: var(--orange-shade-10);
}

.red {
  color: var(--red-400);
}

.neutral {
  color: var(--grey-200);
}

/* Responsive */
@media (max-width: 1200px) {
  .stats-grid-3 {
    grid-template-columns: 1fr;
  }

  .stats-grid-2 {
    grid-template-columns: 1fr;
  }
}

/* BngUnit styling */
:deep(.no-margin.info-item) {
  padding: 0;
  margin: 0;
}

</style>

