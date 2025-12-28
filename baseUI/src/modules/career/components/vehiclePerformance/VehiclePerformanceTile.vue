<template>
  <BngCard class="card" v-bng-blur="true">
    <div style="padding: 1em; overflow: auto;">
      <div>
        <VehicleTileRow
          class="vehicle-tile-row"
          :data="vehicleData"
          :enableHover="false"
          :small="true"
        />

        <!-- Performance class badge -->
        <div class="performance-class-container">
          <div v-if="selectedCertificationData && selectedCertificationData.vehicleClass" class="performance-class-wrapper">
            <span class="class-badge">
              Class {{ selectedCertificationData.vehicleClass.class.name }} | PI {{ selectedCertificationData.vehicleClass.performanceIndex.toFixed(0) }}
            </span>
          </div>
        </div>
      </div>

      <div class="certification-container">
        <!-- Technical Specifications Section -->
        <div class="specs-section">
          <div class="section-header">
            <h2>Technical Specifications</h2>
          </div>

          <div v-if="!selectedCertificationData.vehicleClass">
            Vehicle has not been assessed yet.
          </div>
          <div v-else class="specs-grid">
            <div class="spec-row">
              <div class="spec-label">{{ $t('ui.options.units.weight') }}</div>
              <div class="spec-value">
                {{ $game.units.buildString('weight', selectedCertificationData.weight, 0) }}
              </div>
            </div>
            <div class="spec-row">
              <div class="spec-label">Power/Weight</div>
              <div class="spec-value">{{ selectedCertificationData.powerPerTon.toFixed(0) }}hp/1000kg</div>
            </div>
            <div class="spec-row">
              <div class="spec-label">{{ $t('vehicle.info.Drivetrain') }}</div>
              <div class="spec-value">{{ selectedCertificationData.drivetrain }}</div>
            </div>
            <div class="spec-row">
              <div class="spec-label">{{ $t('vehicle.info.Fuel Type') }}</div>
              <div class="spec-value">{{ selectedCertificationData.fuelType }}</div>
            </div>
            <div class="spec-row">
              <div class="spec-label">{{ $t('vehicle.info.Induction Type') }}</div>
              <div class="spec-value">{{ selectedCertificationData.inductionType }}</div>
            </div>
            <div class="spec-row">
              <div class="spec-label">Mileage</div>
              <div class="spec-value">{{ units.buildString('length', selectedCertificationData.mileage, 0) }}</div>
            </div>
            <div class="spec-row">
              <div class="spec-label">Lateral G-Force</div>
              <div class="spec-value">{{ selectedCertificationData.lateralGForce.toFixed(2) }} G</div>
            </div>
          </div>
        </div>

        <!-- Performance Metrics Section -->
        <div class="specs-section">
          <div class="section-header">
            <h2>Metrics</h2>
          </div>
          <div v-if="selectedCertificationData.vehicleClass" class="metrics-grid">
            <BngProgressBar
              v-if="selectedCertificationData.power"
              headerLeft="Power Output"
              :headerRight="$game.units.buildString('power', selectedCertificationData.power, 0)"
              :value="selectedCertificationData.power"
              :min="0"
              :max="1000"
              :showValueLabel="false"
              :valueColor="getColorForValue(selectedCertificationData.power, 0, 1000)"
              class="score-progress"
            />

            <BngProgressBar
              headerLeft="0-60 mph time (prepped surface)"
              :headerRight="selectedCertificationData.time_0_60 ? selectedCertificationData.time_0_60.toFixed(2) + ' s' : 'N/A'"
              :value="selectedCertificationData.time_0_60 ? -selectedCertificationData.time_0_60 : -25"
              :min="-25"
              :max="-2"
              :showValueLabel="false"
              :valueColor="getColorForValue(selectedCertificationData.time_0_60 ? -selectedCertificationData.time_0_60 : -25, -25, -2)"
              class="score-progress"
            />

            <BngProgressBar
              v-if="selectedCertificationData.time_1_4"
              headerLeft="Quarter Mile"
              :headerRight="selectedCertificationData.time_1_4.toFixed(2) + ' s @ ' + $game.units.buildString('speed', selectedCertificationData.velAt_1_4, 0)"
              :value="selectedCertificationData.time_1_4 ? -selectedCertificationData.time_1_4 : -35"
              :min="-35"
              :max="-8.1"
              :showValueLabel="false"
              :valueColor="getColorForValue(selectedCertificationData.time_1_4 ? -selectedCertificationData.time_1_4 : -35, -35, -8.1)"
              class="score-progress"
            />

            <BngProgressBar
              v-if="selectedCertificationData.performanceAggregateScores.brakingGForceScore"
              headerLeft="Braking Force"
              :headerRight="selectedCertificationData.brakingG ? selectedCertificationData.brakingG.toFixed(2) + ' G' : 'N/A'"
              :value="selectedCertificationData.brakingG || 0"
              :min="0.5"
              :max="1.9"
              :showValueLabel="false"
              :valueColor="getColorForValue(selectedCertificationData.brakingG || 0, 0.5, 1.9)"
              class="score-progress"
            />

            <div v-if="selectedCertificationData && selectedCertificationData.vehicleClass" class="performance-index-container">
              <div class="progress-wrapper">
                <BngProgressBar
                  headerLeft="Performance Index"
                  :headerRight="'Class: ' + selectedCertificationData.vehicleClass.class.name"
                  :value="selectedCertificationData.vehicleClass.performanceIndex"
                  :min="0"
                  :max="110"
                  :showValueLabel="false"
                  :valueColor="getColorForValue(selectedCertificationData.vehicleClass.performanceIndex / 110)"
                  class="score-progress performance-index"
                />
                <div class="class-markers">
                  <div v-for="(classInfo, index) in [{pi: 101, name: 'X'}, {pi: 86, name: 'S'},
                        {pi: 66, name: 'A'}, {pi: 41, name: 'B'}, {pi: 21, name: 'C'}]"
                        :key="index"
                        class="class-marker"
                        :style="{ left: `${(classInfo.pi/110)*100}%` }">
                    <div class="marker-line"></div>
                    <div class="marker-label">{{ classInfo.name }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
    <template #footer>
      <div class="history-dropdown-container">
        <div class="dropdown">
          <div class="dropdown-label">Previous Assessments</div>
          <BngDropdown v-model="selectedHistoryIndex" :items="historyOptions" class="history-select">
            {{ historyOptions[selectedHistoryIndex].text }}
          </BngDropdown>
        </div>
        <BngButton @click="startTest()" :disabled="vehicleData.needsRepair || !vehicleData.owned">
          {{ startTestTitle }}
        </BngButton>
      </div>
    </template>
  </BngCard>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue"
import { BngCondition, BngUnit, BngCard, BngCardHeading, BngIcon, BngButton, icons, BngProgressBar, BngSelect, BngDropdown } from "@/common/components/base"
import { lua } from "@/bridge"
import { vBngBlur } from "@/common/directives"
import { useBridge } from "@/bridge"
import VehicleTileRow from "../vehicleInventory/VehicleTileRow.vue"
const { units } = useBridge()

const props = defineProps({
  vehicleData: Object,
})

const title = computed(() => props.vehicleData.niceName || "No Name")
const startTestTitle = computed(() => props.vehicleData.needsRepair ? "Assess Performance (Repair Required)" : "Assess Performance Now")

const certificationKeyMap = {
  'weight': "ui.options.units.weight",
  'power': "ui.options.units.power",
  'torque': "ui.options.units.torque",
}

const performanceKeyMap = {
  'quarterMileScore': "ui.career.performance.quarterMileScore",
  'powerToWeightScore': "ui.career.performance.powerToWeightScore",
  'timeTo60Score': "ui.career.performance.timeTo60Score",
  'brakingGForceScore': "ui.career.performance.brakingGForceScore",
  'speedProgressionScore': "ui.career.performance.speedProgressionScore"
}

const getTranslationKey = (key) => {
  return certificationKeyMap[key] || `ui.career.certification.${key}`
}

const getPerformanceTranslationKey = (key) => {
  return performanceKeyMap[key] || key
}

const startTest = function() {
  lua.career_modules_vehiclePerformance.startDragTest(props.vehicleData.id)
}

const getColorForValue = (value, min = 0, max = 1) => {
  // Normalize value to 0-1 range using provided min/max
  const normalizedValue = (value - min) / (max - min)
  // Adjust the normalized value to start interpolation at 10%
  const adjustedValue = Math.max(0, normalizedValue - 0.1) * (1 / 0.9)

  let red, green
  if (adjustedValue < 0.5) {
    // Red to Yellow (20-60%)
    red = 200
    green = Math.round(200 * (adjustedValue * 2))
  } else {
    // Yellow to Green (60-100%)
    red = Math.round(200 * (2 - adjustedValue * 2))
    green = 200
  }

  return `rgb(${red}, ${green}, 0)`
}

const selectedHistoryIndex = ref(0)

const allCertificationData = computed(() => {
  // Create a list with current certification data at the beginning followed by performance history
  return [
    props.vehicleData.certificationData || { noPerformanceData: true }, // Add empty entry with current timestamp if undefined
    ...(props.vehicleData.performanceHistory || [])
  ]
})

const historyOptions = computed(() => {
  if (!allCertificationData.value.length) return []

  // Create options for dropdown
  return allCertificationData.value.map((item, index) => ({
    value: index,
    label: index === 0
      ? (item.noPerformanceData ? 'Current Test Results: No data' : 'Current Test Results - ' + new Date(item.timeStamp).toLocaleString())
      : `Previous Test Results - ${new Date(item.timeStamp).toLocaleString()}`
  }))
})

const selectedCertificationData = computed(() => {
  return allCertificationData.value[selectedHistoryIndex.value]
})

watch(() => props.vehicleData, (newVal) => {
}, { immediate: true })

</script>

<style lang="scss" scoped>
.card {
  color: #fff;
  width: 65%;
  height: 100%;
  background-color: var(--bng-black-8);
  & :deep(.card-cnt) {
    background-color: rgba(0, 0, 0, 0);
  }
}

.vehicle-tile-row {
  background:none;
}

.certification-container {
  padding-top: 1em;
  padding-bottom: 1em;
  display: flex;
  gap: 1em;
  align-items: flex-start;
  flex-direction: column;
}

.specs-section {
  background-color: var(--bng-black-4);
  border-radius: var(--bng-corners-2);
  padding: 1em;
  width: 100%;
}

.section-header {
  margin-top: -1em;
  margin-bottom: 0.75em;

  h2 {
    font-size: 1.2em;
    font-weight: 600;
    color: #fff;
  }
}

.specs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  column-gap: 4em;
  row-gap: 0.5em;
}

.spec-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2em;
}

.spec-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9em;
}

.spec-value {
  font-weight: 500;
  color: #fff;
}

.metrics-grid {
  display: grid;
  gap: 0.5em;
}

.performance-index-container {
  margin-top: 0.75em;
  padding-top: 0.75em;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.score-progress {
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--bng-corners-1);
  padding: 0.25em 0.5em;

  :deep(.progress-bar) {
    height: 0.5em;
    border-radius: 999px;
  }

  :deep(.header) {
    margin-bottom: 0.25em;
  }

  &.performance-index {
    padding-bottom: 0.5em;
    :deep(.header-text) {
      font-size: 1.1em;
      font-weight: bold;
    }

    :deep(.value-label) {
      font-size: 1.1em;
      font-weight: bold;
    }

    :deep(.progress-bar) {
      height: 2em !important;
    }
  }
}

.progress-wrapper {
  position: relative;
  width: 100%;
}

.class-markers {
  position: absolute;
  top: 1.75em;
  left: 0.5em;
  right: 0.5em;
  pointer-events: none;
  z-index: 2;
}

.class-marker {
  position: absolute;
  height: 2em;
  //transform: translateX(-1px);
  display: flex;
  align-items: center;

  .marker-line {
    width: 2px;
    height: 2em;
    background: rgba(255, 255, 255, 0.5);
  }

  .marker-label {
    position: absolute;
    left: 8px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.9em;
    font-weight: 600;
  }
}

.performance-class-container {
  display: flex;
  gap: 1em;
  align-items: center;
  margin-top: 1em;
}

.performance-class-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  min-height: 100%;

  .class-badge {
    display: inline-flex;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.1);
    padding: 8px 16px;
    border-radius: 999px;
    font-size: 1.1em;
    color: #f0a500;
  }
}

.dropdown {
  display: flex;
  flex-direction: column;
  margin-bottom: 1em;
}

.dropdown-label {
  margin-bottom: 0.5em;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9em;
}

.history-select {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 0.5em;
  border-radius: var(--bng-corners-1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  outline: none;
  cursor: pointer;
  position: relative;
  z-index: 10;

  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }

  &:focus {
    border-color: rgba(255, 255, 255, 0.4);
  }

  option {
    background-color: #333;
    color: #fff;
  }
}

.history-dropdown-container {
  > * {
    width: 100%;
  }
  :deep(.bng-button) {
    width: 100%;
    max-width: calc(100% - 0.5em) !important;
  }
}
</style>
