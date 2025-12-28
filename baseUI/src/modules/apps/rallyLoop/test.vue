// make this a wrapper around app.vue for testing

<template>
  <div class="test-wrapper">
    <div class="test-controls">
      <h3>Rally Loop Test Controls</h3>

      <div class="button-groups-container">
        <div class="button-group">
          <h4>Rally Clock</h4>
          <BngButton @click="setRallyClock" :accent="ACCENTS.text">Set 08:00</BngButton>
          <BngButton @click="toggleTimeFormat" :accent="ACCENTS.text">12h/24h</BngButton>
          <div style="display: flex; gap: 0.5rem;">
            <BngButton style="flex: 1;" @click="rewindTime10" :accent="ACCENTS.text">-10s</BngButton>
            <BngButton style="flex: 1;" @click="advanceTime10" :accent="ACCENTS.text">+10s</BngButton>
          </div>
        </div>

        <div class="button-group">
          <h4>General</h4>
          <BngButton @click="resetAll" :accent="ACCENTS.attentionAlt">Reset All</BngButton>
          <BngButton @click="toggleVisibility" :accent="ACCENTS.text">Show/Hide</BngButton>
        </div>

        <div class="button-group">
          <h4>Panel Layouts</h4>
          <BngButton @click="showDefaultPanel" :accent="ACCENTS.text">Default (Blank)</BngButton>
          <BngButton @click="showProximityPanel" :accent="ACCENTS.text">Proximity</BngButton>
          <BngButton @click="showStagingPanel" :accent="ACCENTS.attentionAlt">Staging</BngButton>
          <BngButton @click="showCountdownPanel" :accent="ACCENTS.text">Countdown</BngButton>
        </div>

        <div class="button-group">
          <h4>Countdown Value</h4>
          <div style="display: flex; gap: 0.3rem;">
            <BngButton style="flex: 1; font-size: 0.75rem;" @click="setCountdownValue(10)" :accent="ACCENTS.attentionAlt">10</BngButton>
            <BngButton style="flex: 1; font-size: 0.75rem;" @click="setCountdownValue(5)" :accent="ACCENTS.attentionAlt">5</BngButton>
            <BngButton style="flex: 1; font-size: 0.75rem;" @click="setCountdownValue(4)" :accent="ACCENTS.attentionAlt">4</BngButton>
          </div>
          <div style="display: flex; gap: 0.3rem;">
            <BngButton style="flex: 1; font-size: 0.75rem;" @click="setCountdownValue(3)" :accent="ACCENTS.attentionAlt">3</BngButton>
            <BngButton style="flex: 1; font-size: 0.75rem;" @click="setCountdownValue(2)" :accent="ACCENTS.attentionAlt">2</BngButton>
            <BngButton style="flex: 1; font-size: 0.75rem;" @click="setCountdownValue(1)" :accent="ACCENTS.attentionAlt">1</BngButton>
          </div>
          <BngButton @click="setCountdownValue(0)" :accent="ACCENTS.attentionAlt">GO!</BngButton>
        </div>

        <div class="button-group">
          <h4>State</h4>
          <div class="debug-info">
            <div>Context: <span class="debug-value">{{ currentContext }}</span></div>
            <div>Panel: <span class="debug-value">{{ currentPanel }}</span></div>
            <div>Stage: <span class="debug-value">{{ currentStage }}</span></div>
            <div>Distance: <span class="debug-value">{{ currentDistance }}m</span></div>
            <div>isNear: <span class="debug-value">{{ currentIsNear }}</span></div>
            <div>isStopped: <span class="debug-value">{{ currentIsStopped }}</span></div>
            <div>isFrozen: <span class="debug-value">{{ currentIsFrozen }}</span></div>
          </div>
        </div>

        <!-- <div class="button-group">
          <h4>Combined Scenarios</h4>
          <BngButton @click="scenarioApproachingStart" :accent="ACCENTS.text">Approaching Start</BngButton>
          <BngButton @click="scenarioAtTimeControl" :accent="ACCENTS.text">At Time Control</BngButton>
          <BngButton @click="scenarioRunningLate" :accent="ACCENTS.attention">Running Late!</BngButton>
        </div> -->

        <div class="button-group">
          <h4>Context</h4>
          <div style="display: flex; gap: 0.5rem;">
            <BngButton style="flex: 1;" @click="setContextStartLine" :accent="ACCENTS.attentionAlt">Start Line</BngButton>
            <BngButton style="flex: 1;" @click="setContextTimeControl" :accent="ACCENTS.attentionAlt">Time Control</BngButton>
          </div>
        </div>

        <div class="button-group">
          <h4>Distance</h4>
          <div style="display: flex; gap: 0.3rem;">
            <BngButton style="flex: 1; font-size: 0.75rem;" @click="setDistance(-5)" :accent="ACCENTS.attentionAlt">-5m</BngButton>
            <BngButton style="flex: 1; font-size: 0.75rem;" @click="setDistance(-0.5)" :accent="ACCENTS.text">-0.5</BngButton>
            <BngButton style="flex: 1; font-size: 0.75rem;" @click="setDistance(0)" :accent="ACCENTS.text">0m</BngButton>
          </div>
          <div style="display: flex; gap: 0.3rem;">
            <BngButton style="flex: 1; font-size: 0.75rem;" @click="setDistance(0.5)" :accent="ACCENTS.text">0.5</BngButton>
            <BngButton style="flex: 1; font-size: 0.75rem;" @click="setDistance(2)" :accent="ACCENTS.text">2m</BngButton>
            <BngButton style="flex: 1; font-size: 0.75rem;" @click="setDistance(15)" :accent="ACCENTS.text">15m</BngButton>
          </div>
          <div style="display: flex; gap: 0.3rem;">
            <BngButton style="flex: 1; font-size: 0.75rem;" @click="setDistance(50)" :accent="ACCENTS.text">50m</BngButton>
            <BngButton style="flex: 1; font-size: 0.75rem;" @click="setDistance(100)" :accent="ACCENTS.text">100m</BngButton>
          </div>
        </div>

        <div class="button-group">
          <h4>Vehicle State</h4>
          <BngButton @click="toggleStopped" :accent="ACCENTS.text">Toggle Stopped</BngButton>
          <BngButton @click="toggleNear" :accent="ACCENTS.text">Toggle Near</BngButton>
          <BngButton @click="toggleFrozen" :accent="ACCENTS.text">Toggle Frozen</BngButton>
        </div>

        <!-- <div class="button-group">
          <h4>Objective</h4>
          <BngButton @click="setObjectiveTC" :accent="ACCENTS.text">TC (5 min away)</BngButton>
          <BngButton @click="setObjectiveSSStart" :accent="ACCENTS.text">SS Start (10 min)</BngButton>
          <BngButton @click="setObjectiveSSStop" :accent="ACCENTS.text">SS Stop (3 min)</BngButton>
          <BngButton @click="setObjectiveLate" :accent="ACCENTS.attention">Late (-30s penalty)</BngButton>
          <BngButton @click="setObjectiveServiceOut" :accent="ACCENTS.text">Service Out TC</BngButton>
          <BngButton @click="clearObjective" :accent="ACCENTS.text">Clear Objective</BngButton>
        </div> -->
      </div>
    </div>

    <div class="test-view-item">
      <RallyLoop />
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, nextTick, computed, ref } from 'vue'
import RallyLoop from "@/modules/apps/rallyLoop/app.vue"
import { BngButton, ACCENTS } from "@/common/components/base"

// Force reactivity update every 100ms
const forceUpdate = ref(0)
let updateInterval = null

onMounted(() => {
  updateInterval = setInterval(() => {
    forceUpdate.value++
  }, 100)
})

onUnmounted(() => {
  if (updateInterval) clearInterval(updateInterval)
})

// Helper to get app instance
function getApp() {
  return window.rallyLoopApp
}

// Computed properties for debug display
const currentContext = computed(() => {
  forceUpdate.value // Force reactivity
  const app = getApp()
  if (!app?.positioningContext) return 'N/A'
  return app.positioningContext.value
})

const currentPanel = computed(() => {
  forceUpdate.value // Force reactivity
  const app = getApp()
  if (!app?.positioningPanel) return 'N/A'
  return app.positioningPanel.value
})

const currentStage = computed(() => {
  forceUpdate.value // Force reactivity
  const app = getApp()
  if (!app?.positioningStage) return 'N/A'
  return app.positioningStage.value
})

const currentDistance = computed(() => {
  forceUpdate.value // Force reactivity
  const app = getApp()
  if (!app?.vehicleProximity) return 'N/A'
  const dist = app.vehicleProximity.distance
  return typeof dist === 'number' ? dist.toFixed(2) : 'N/A'
})

const currentIsNear = computed(() => {
  forceUpdate.value // Force reactivity
  const app = getApp()
  if (!app?.vehicleProximity) return 'N/A'
  return String(app.vehicleProximity.isNear)
})

const currentIsStopped = computed(() => {
  forceUpdate.value // Force reactivity
  const app = getApp()
  if (!app?.vehicleProximity) return 'N/A'
  return String(app.vehicleProximity.isStopped)
})

const currentIsFrozen = computed(() => {
  forceUpdate.value // Force reactivity
  const app = getApp()
  if (!app?.vehicleProximity) return 'N/A'
  return String(app.vehicleProximity.isFrozen)
})

function toggleVisibility() {
  const app = getApp()
  if (!app) return
  app.visible.value = !app.visible.value
}

// Panel layout test functions
function showDefaultPanel() {
  const app = getApp()
  if (!app) return
  app.positioningContext.value = 'default'
}

function showProximityPanel() {
  const app = getApp()
  if (!app) return
  // Set up start line approaching to show proximity panel
  app.positioningContext.value = 'startLine'
  Object.assign(app.vehicleProximity, {
    isNear: false,
    distance: 50,
    isStopped: false,
  })
  app.updateVehicleProximityTimestamp()
}

function showStagingPanel() {
  const app = getApp()
  if (!app) return
  // Set up start line staged to show staging panel
  app.positioningContext.value = 'startLine'
  Object.assign(app.vehicleProximity, {
    isNear: true,
    distance: 2,
    isStopped: true,
    isFrozen: false,
  })
  app.updateVehicleProximityTimestamp()
}

function showCountdownPanel() {
  const app = getApp()
  if (!app) return
  // Temporarily force countdown panel (will need proper logic in app.vue)
  app.positioningContext.value = 'countdown'
}

// === Rally Clock Functions ===
function setRallyClock() {
  const app = getApp()
  if (!app) return

  app.rallyLoopManager.wallClockSecs = 8 * 3600 // 08:00:00
  app.rallyLoopManager.epochTime = 0
  app.rallyLoopManager.day = 1
  app.rallyLoopManager.totalPenalty = 0
  app.rallyLoopManager.totalSSTime = 0
  app.rallyLoopManager.use24hFormat = true
}

function setRallyClockDay2() {
  const app = getApp()
  if (!app) return

  app.rallyLoopManager.wallClockSecs = 14.5 * 3600 // 14:30:00
  app.rallyLoopManager.epochTime = 0
  app.rallyLoopManager.day = 2
  app.rallyLoopManager.totalPenalty = 45
  app.rallyLoopManager.totalSSTime = 3456.7
  app.rallyLoopManager.use24hFormat = true
}

function toggleTimeFormat() {
  const app = getApp()
  if (!app) return

  app.rallyLoopManager.use24hFormat = !app.rallyLoopManager.use24hFormat
}

function advanceTime10() {
  const app = getApp()
  if (!app) return

  // Add 10 seconds to the current wall clock time
  const currentTime = app.rallyLoopManager.wallClockSecs || 8 * 3600
  app.rallyLoopManager.wallClockSecs = currentTime + 10
}

function rewindTime10() {
  const app = getApp()
  if (!app) return

  // Subtract 10 seconds from the current wall clock time
  const currentTime = app.rallyLoopManager.wallClockSecs || 8 * 3600
  app.rallyLoopManager.wallClockSecs = Math.max(0, currentTime - 10)
}

// === Context Functions ===
function setContextStartLine() {
  const app = getApp()
  if (!app) return
  app.positioningContext.value = 'startLine'
}

function setContextTimeControl() {
  const app = getApp()
  if (!app) return
  app.positioningContext.value = 'timeControl'
}

// === Countdown Functions ===
function setCountdownValue(value) {
  const app = getApp()
  if (!app) return
  app.countdownValue.value = value
}

// === Distance Functions ===
function setDistance(distance) {
  const app = getApp()
  if (!app) return

  if (app.positioningContext.value === 'startLine') {
    app.vehicleProximity.distance = distance
    app.updateVehicleProximityTimestamp()
  } else if (app.positioningContext.value === 'timeControl') {
    app.vehicleProximity.distance = distance
    app.updateVehicleProximityTimestamp()
  }
}

// === Vehicle State Functions ===
function toggleStopped() {
  const app = getApp()
  if (!app) return

  if (app.positioningContext.value === 'startLine') {
    app.vehicleProximity.isStopped = !app.vehicleProximity.isStopped
    app.updateVehicleProximityTimestamp()
  }
}

function toggleNear() {
  const app = getApp()
  if (!app) return

  if (app.positioningContext.value === 'startLine') {
    app.vehicleProximity.isNear = !app.vehicleProximity.isNear
    app.updateVehicleProximityTimestamp()
  } else if (app.positioningContext.value === 'timeControl') {
    app.vehicleProximity.isNear = !app.vehicleProximity.isNear
    app.updateVehicleProximityTimestamp()
  }
}

function toggleFrozen() {
  const app = getApp()
  if (!app) return

  if (app.positioningContext.value === 'startLine') {
    app.vehicleProximity.isFrozen = !app.vehicleProximity.isFrozen
    app.updateVehicleProximityTimestamp()
  }
}

// === Objective Functions ===
function setObjective(data) {
  const app = getApp()
  if (!app) return

  // Need to get through rallyLoopManager's objective
  const clockTime = app.rallyLoopManager.wallClockSecs || 8 * 3600

  // Create full rally clock data with objective
  Object.assign(app.rallyLoopManager, {
    wallClockSecs: clockTime,
    epochTime: data.epochTime || 0,
    day: data.day || 1,
    totalPenalty: data.totalPenalty || 0,
    totalSSTime: data.totalSSTime || 0,
    use24hFormat: app.rallyLoopManager.use24hFormat
  })

  // The objective is accessed through a separate reactive object in app.vue
  // We need to check how it's structured
  if (window.rallyLoopApp) {
    // Based on app.vue, objective is a separate reactive object
    const objData = data.objective
    window.rallyLoopApp.objective = window.rallyLoopApp.objective || {}
    Object.assign(window.rallyLoopApp.objective, {
      label: objData.label,
      eventType: objData.eventType,
      missionType: objData.missionType,
      eventWallClock: objData.eventWallClock,
      countdown: objData.countdown,
      penalty: objData.penalty || 0,
      hasPenalty: objData.hasPenalty || false
    })
  }
}

function setObjectiveTC() {
  const app = getApp()
  if (!app) return

  const currentTime = app.rallyLoopManager.wallClockSecs || 8 * 3600
  const targetTime = currentTime + 300 // 5 minutes from now

  setObjective({
    day: 1,
    totalPenalty: 0,
    totalSSTime: 123.4,
    objective: {
      label: 'TC 1',
      eventType: 'tc',
      missionType: 'roadSection',
      eventWallClock: targetTime,
      countdown: 300,
      penalty: 0,
      hasPenalty: false
    }
  })
}

function setObjectiveSSStart() {
  const app = getApp()
  if (!app) return

  const currentTime = app.rallyLoopManager.wallClockSecs || 8 * 3600
  const targetTime = currentTime + 600 // 10 minutes from now

  setObjective({
    day: 1,
    totalPenalty: 15,
    totalSSTime: 456.7,
    objective: {
      label: 'SS 1 Start',
      eventType: 'ss_start',
      missionType: 'rallyStage',
      eventWallClock: targetTime,
      countdown: 600,
      penalty: 0,
      hasPenalty: false
    }
  })
}

function setObjectiveSSStop() {
  const app = getApp()
  if (!app) return

  const currentTime = app.rallyLoopManager.wallClockSecs || 8 * 3600
  const targetTime = currentTime + 180 // 3 minutes from now

  setObjective({
    day: 1,
    totalPenalty: 0,
    totalSSTime: 789.1,
    objective: {
      label: 'SS 1 Stop',
      eventType: 'ss_stop',
      missionType: 'rallyStage',
      eventWallClock: targetTime,
      countdown: 180,
      penalty: 0,
      hasPenalty: false
    }
  })
}

function setObjectiveLate() {
  const app = getApp()
  if (!app) return

  const currentTime = app.rallyLoopManager.wallClockSecs || 8 * 3600
  const targetTime = currentTime - 30 // 30 seconds late

  setObjective({
    day: 1,
    totalPenalty: 45,
    totalSSTime: 789.1,
    objective: {
      label: 'TC 2',
      eventType: 'tc',
      missionType: 'roadSection',
      eventWallClock: targetTime,
      countdown: -30,
      penalty: 30,
      hasPenalty: true
    }
  })
}

function setObjectiveServiceOut() {
  const app = getApp()
  if (!app) return

  const currentTime = app.rallyLoopManager.wallClockSecs || 8 * 3600
  const targetTime = currentTime + 420 // 7 minutes from now

  setObjective({
    day: 1,
    totalPenalty: 0,
    totalSSTime: 1234.5,
    objective: {
      label: 'TC 3',
      eventType: 'tc',
      missionType: 'serviceOut',
      eventWallClock: targetTime,
      countdown: 420,
      penalty: 0,
      hasPenalty: false
    }
  })
}

function clearObjective() {
  if (window.rallyLoopApp?.objective) {
    window.rallyLoopApp.objective.label = null
    window.rallyLoopApp.objective.eventType = null
    window.rallyLoopApp.objective.missionType = null
    window.rallyLoopApp.objective.eventWallClock = null
    window.rallyLoopApp.objective.countdown = null
    window.rallyLoopApp.objective.penalty = 0
    window.rallyLoopApp.objective.hasPenalty = false
  }
}

// === Combined Scenario Functions ===
function scenarioApproachingStart() {
  setRallyClock()
  setStartLineApproach()
  setObjectiveSSStart()
}

function scenarioAtTimeControl() {
  setRallyClock()
  setTimeControlStop()
  setObjectiveTC()
}

function scenarioRunningLate() {
  setRallyClock()
  setTimeControlApproach()
  setObjectiveLate()
}

// === Reset Function ===
function resetAll() {
  const app = getApp()
  if (app?.reset) {
    app.reset()
  }
  if (app?.visible) {
    app.visible.value = false
  }
}

// Additional initialization
onMounted(() => {
  nextTick(() => {
    console.log('Test harness mounted, app available:', !!getApp())
    // Disable stale checking and stream updates for testing
    const app = getApp()
    if (app) {
      app.enableStaleChecking.value = false
      app.enableStreamUpdates.value = false
    }
  })
})
</script>

<style scoped lang="scss">
.test-wrapper {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  min-height: 100vh;
  width: 100vw;
}

.test-controls {
  flex-shrink: 0;
  width: 600px;
  background: #000000;
  padding: 1rem;
  border: 2px solid #00ff00;
  border-radius: 4px;
  overflow-y: auto;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  box-shadow:
    inset 0 0 20px rgba(0, 255, 0, 0.1),
    0 0 10px rgba(0, 255, 0, 0.3);

  h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.2rem;
    color: #00ff00;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-align: center;
    border-bottom: 1px solid #00ff00;
    padding-bottom: 0.5rem;
    text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
  }

  h4 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    font-size: 0.85rem;
    color: #00ff00;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.8;
    font-weight: bold;

    &::before {
      content: '> ';
      color: #00ff00;
    }
  }

  .button-groups-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    column-gap: 1.5rem;
  }

  .button-group {
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    border-left: 2px solid rgba(0, 255, 0, 0.3);
    padding-left: 0.5rem;

    .debug-info {
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: rgba(0, 255, 0, 0.05);
      border: 1px solid rgba(0, 255, 0, 0.3);
      border-radius: 4px;
      font-size: 0.75rem;

      div {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.25rem;

        &:last-child {
          margin-bottom: 0;
        }
      }

      .debug-value {
        color: #00ff00;
        font-weight: bold;
        text-transform: uppercase;
      }
    }

    :deep(button),
    :deep(.bng-button) {
      background: #000000 !important;
      background-color: #000000 !important;
      background-image: none !important;
      color: #00ff00 !important;
      border: 1px solid #00ff00 !important;
      font-family: 'Courier New', monospace !important;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      box-shadow:
        0 0 5px rgba(0, 255, 0, 0.3),
        inset 0 0 10px rgba(0, 255, 0, 0.05) !important;
      transition: all 0.2s ease;

      &::before,
      &::after {
        display: none !important;
      }

      &:hover {
        background: rgba(0, 255, 0, 0.1) !important;
        background-color: rgba(0, 255, 0, 0.1) !important;
        background-image: none !important;
        box-shadow:
          0 0 10px rgba(0, 255, 0, 0.5),
          inset 0 0 15px rgba(0, 255, 0, 0.1) !important;
        border-color: #00ff00 !important;
        color: #00ff00 !important;
      }

      &:active {
        background: rgba(0, 255, 0, 0.2) !important;
        background-color: rgba(0, 255, 0, 0.2) !important;
        background-image: none !important;
        box-shadow:
          0 0 15px rgba(0, 255, 0, 0.7),
          inset 0 0 20px rgba(0, 255, 0, 0.15) !important;
        color: #00ff00 !important;
      }

      &:focus {
        background: #000000 !important;
        background-color: #000000 !important;
        background-image: none !important;
        border-color: #00ff00 !important;
        color: #00ff00 !important;
      }

      // Override any accent-based colors
      &[class*="accent"] {
        color: #00ff00 !important;
        border-color: #00ff00 !important;
        background: #000000 !important;
        background-color: #000000 !important;
        background-image: none !important;
      }

      // Target specific button styles
      *,
      span,
      div {
        color: #00ff00 !important;
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
      }
    }
  }
}

.test-view-item {
  width: 400px;
  height: 600px;
  left: 70%;
  top: 50%;
  transform: translate(-50%, -50%);
  position: absolute;
}
</style>