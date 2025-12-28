<template>
  <Transition name="fade">
    <!-- <div v-if="visible" class="rally-loop-app" :class="{ 'show-placeholder': showSectionPlaceholder() }"> -->
    <div class="rally-countdown-app-container">

      <div v-if="!isStageActive()" class="rally-countdown-app" :class="{ 'show-active-stage': isStageActive() }">
        <!-- Vehicle Proximity Section -->
        <div v-if="activeState === ActiveState.VEHICLE_PROXIMITY" class="section-vehicle-positioning" :class="{ 'has-interact-hint': canInteract }">
          <VehicleProximity
            :vehicle-proximity="vehicleProximityData"
            :stage="proximityStage"
            :precision="distancePrecision"
            :badge-text="badgeText"
            :instruction="proximityInstruction"
            :instruction2="proximityInstruction2"
          />
        </div>

        <!-- Countdown Section -->
        <div v-if="activeState === ActiveState.COUNTDOWN" class="section-vehicle-positioning" :class="{ 'has-interact-hint': canInteract }">
          <div class="panel-countdown">
            <CountdownWidget
              :rally-loop-manager="rallyClockData.wallClockTime?.time || '--:--:--'"
              :period="rallyClockData.wallClockTime?.ampm || ''"
              :countdown="countdownData.countdown"
            />
          </div>
        </div>

        <!-- Rally Interact Input Hint -->
        <div v-if="canInteract" class="section-interact-hint">
          <DynamicComponent :template="interactLabel" bbcode />
        </div>
      </div> <!-- End of Rally Countdown App -->
    </div>

  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, computed } from 'vue'
import { useBridge } from "@/bridge"
import { useStreams } from '@/services/events'
import CountdownWidget from './components/CountdownWidget.vue'
import VehicleProximity from './components/VehicleProximity.vue'
import { DynamicComponent } from '@/common/components/utility'

const { lua } = useBridge()

const devEnv = reactive({
  env: window.beamng && !window.beamng.shipping,
  vue: process.env.NODE_ENV === "development"
})

// Stream data reactive property for showDebugInfo
const showDebugInfo = ref(false)

// Active State Enum (matches util.lua)
const ActiveState = {
  INACTIVE: 'inactive',
  VEHICLE_PROXIMITY: 'vehicleProximity',
  STAGE_ACTIVE: 'stageActive',
  COUNTDOWN: 'countdown'
}

// Rally clock data
const rallyClockData = reactive({
  wallClockTime: null,
  day: null,
  totalTime: 0,
  canSkipTimeControls: false,
  isTimeControlSkipAvailable: false,
  canSkipCountdown: false,
  isNgrcMode: false
})

// Active state (uses ActiveState enum)
const activeState = ref(ActiveState.INACTIVE)

// Vehicle proximity data
const vehicleProximityData = reactive({
  isNear: false,
  distance: 0,
  distanceToPlane: 0, // Signed plane distance (negative = behind, positive = in front)
  // straightLineDistToPos: 0, // Straight-line 3D distance to target position
  isStopped: false,
  isFrozen: false,
  usingGroundMarkerDistance: false
})

// Schedule data (timing and schedule information)
const scheduleData = reactive({
  label: null,
  eventType: null,
  ssLabel: null,
  eventWallClockStart: null,
  eventWallClockEnd: null,
  timeDiff: null,
  timeDiffWithEnd: null,
  lateness: null,
  penalty: 0,
  hasPenalty: false,
  canIncurLatePenalty: false,
  speedLimit: null,
  speedLimitDisplay: null,
  speedUnit: 'km/h',
  isSpeeding: false
})

// Stage data
const stageData = reactive({
  currentSSTime: null,
  isActive: false,
  isComplete: false,
  splits: [],
  label: null,
  completion: {
    distM: 0,
    distPct: 0
  }
})

// Countdown data
const countdownData = reactive({
  countdown: null,
  state: null
})

const themeColor = computed(() => {
  return '#07ff00' // green
})

// Computed property for interaction availability
const canInteract = computed(() => {
  return rallyClockData.canSkipTimeControls || rallyClockData.canSkipCountdown
})

// Computed property for interaction label
const interactLabel = computed(() => {
  if (rallyClockData.canSkipCountdown) {
    // return '[action=gameplay_interact]Skip to Countdown'
    return '[action=gameplay_interact]Skip Clock'
  } else if (rallyClockData.canSkipTimeControls) {
    return '[action=gameplay_interact]Skip Clock'
  }
  return ''
})

// Computed property for positioning stage (based on vehicle proximity and schedule data)
const proximityStage = computed(() => {
  const eventType = scheduleData.eventType
  // Use displayed distance for stage determination (already substituted by node when ground markers active)
  const distance = vehicleProximityData.distance

  // For SS Start events, allow 'staged' state
  if (scheduleData.eventType === 'ss_start') {
    if (vehicleProximityData.isNear && vehicleProximityData.isStopped) {
      return 'staged'
    } else if (distance < 0) {
      return 'goback'
    } else if (vehicleProximityData.isNear && !vehicleProximityData.isStopped) {
      return 'stop'
    } else if (!vehicleProximityData.isNear && distance >= 0 && distance <= 25) {
      return 'slow'
    } else {
      return 'approaching'
    }
  }

  // For all other event types (tc, ss_stop, serviceIn, etc.), use standard proximity logic
  if (distance < 0) {
    return 'goback'
  } else if (vehicleProximityData.isNear) {
    return 'stop'
  } else if (!vehicleProximityData.isNear && distance >= 0 && distance <= 25) {
    return 'slow'
  } else if (scheduleData.eventType === 'ss_stop') {
    return 'slow'
  } else {
    return 'approaching'
  }
})

const distancePrecision = computed(() => {
  const distAbs = Math.abs(vehicleProximityData.distance)
  const closenessThreshold = 5

  if (scheduleData.eventType === 'ss_start') {
    if (distAbs < closenessThreshold) {
      if (proximityStage.value === 'stop' || proximityStage.value === 'goback' || proximityStage.value === 'staged' || proximityStage.value === 'slow') {
        return 2
      } else {
        return 0
      }
    }
  } else if (scheduleData.eventType === 'tc' || scheduleData.eventType === 'ss_stop') {
    if (distAbs < closenessThreshold) {
      if (proximityStage.value === 'stop' || proximityStage.value === 'goback') {
        return 1
      } else {
        return 0
      }
    }
  }

  return 0
})

const badgeText = computed(() => {
  if (scheduleData.eventType === 'ss_start') {
    return `SS${scheduleData.ssLabel}`
  } else if (scheduleData.eventType === 'tc') {
    return scheduleData.label
  } else if (scheduleData.eventType === 'ss_stop') {
    return `SLOW`
  } else if (scheduleData.eventType === 'service_in') {
    return 'SERVICE'
  }
  return ''
})

const proximityInstruction2 = computed(() => {
  const stage = proximityStage.value

  if (scheduleData.eventType === 'ss_start') {
    return {
      structuredText: [
        'Start in ',
        { type: 'clock', val: scheduleData.timeDiff, class: 'clock-badge' },
      ],
      flash: false
    }
  } else if (stage === 'approaching') {
    // Show skip availability if available for TC events
    if (rallyClockData.isTimeControlSkipAvailable && scheduleData.eventType === 'tc') {
      return {
        structuredText: [
          'Slow Down for ',
          { type: 'clock', val: 'Clock Skip', class: 'clock-badge' },
        ],
        flash: false
      }
    } else if (scheduleData.eventType === 'service_in' || scheduleData.label === "TC0") {
      return {
        structuredText: [
          'Limit ',
          { type: 'penalty', val: `${scheduleData.speedLimitDisplay}${scheduleData.speedUnit}`, class: 'penalty-badge' },
        ],
        flash: scheduleData.isSpeeding
      }
    } else if (scheduleData.eventType === 'tc') {
      return {
        structuredText: [
          'Limit ',
          { type: 'penalty', val: `${scheduleData.speedLimitDisplay}${scheduleData.speedUnit}`, class: 'penalty-badge' },
        ],
        flash: scheduleData.isSpeeding
      }
    }
  } else {
    return null
  }
})

// Computed property for VehicleProximity component instruction
const proximityInstruction = computed(() => {
  const stage = proximityStage.value

  let text = ''
  let type = 'notice'

  // Determine instruction text
  if (stage === 'slow') {
    if (scheduleData.eventType === 'ss_start') {
      text = 'Stage vehicle at start line.'
    } else if (scheduleData.eventType === 'tc') {
      // text = 'stop within 5m of time control'
    } else if (scheduleData.eventType === 'ss_stop') {
      // text = 'slow down for stop control'
      // type = 'alert-sm'
    }
  } else if (stage === 'stop') {
    if (scheduleData.eventType === 'ss_start') {
      // text = 'stop for countdown'
    }
  } else if (stage === 'goback') {
    // text = 'back up!!!'
    // type = 'alert'
  } else if (stage === 'staged') {
    if (vehicleProximityData.isFrozen) {
      // text = 'VEHICLE FROZEN'
    } else {
      // text = 'Hold handbrake.'
      // text = 'HOLD HANDBRAKE'
      // type = 'alert'
    }
  } else if (stage === 'approaching') {
    if (scheduleData.eventType === 'ss_start') {
      // text = `drive to SS${scheduleData.ssLabel} START`
      text = 'Stage vehicle at start line.'
    } else if (scheduleData.eventType === 'tc') {
      // text = `drive to time control`
    } else if (scheduleData.eventType === 'service_in' || scheduleData.eventType === 'service_out') {
      // text = 'pull into service bay'
    }
  }

  return { text, type }
})

// Streams Integration
const streamsList = ['rallyLoop']

// Create a buffer for stream data
let streamBuffer = {
  rallyLoop: null
}
let rafId = null

// Process buffered updates at 60fps
function processStreamUpdates() {
  // Process unified rallyLoop stream
  if (streamBuffer.rallyLoop) {
    const data = streamBuffer.rallyLoop

    // Update active state
    activeState.value = data.activeState || ActiveState.INACTIVE

    // Update rally clock data from rallyClock sub-table
    if (data.rallyClock) {
      Object.assign(rallyClockData, data.rallyClock)
    }

    // Update scheduleData if present
    if (data.scheduleData) {
      Object.assign(scheduleData, data.scheduleData)
    }

    // Update stage data if present
    if (data.stageData) {
      Object.assign(stageData, data.stageData)
    }

    // Update countdown data if present
    if (data.countdownData) {
      Object.assign(countdownData, data.countdownData)
    }

    // Update vehicle proximity from unified vehicleProximity data
    if (data.vehicleProximity) {
      Object.assign(vehicleProximityData, data.vehicleProximity)
    }

    // Update showDebugInfo from stream data
    if (data.showDebugInfo !== undefined) {
      showDebugInfo.value = data.showDebugInfo
    }

    // Clear buffer
    streamBuffer.rallyLoop = null
  }

  rafId = requestAnimationFrame(processStreamUpdates)
}

// Start processing stream updates
rafId = requestAnimationFrame(processStreamUpdates)

// Subscribe to streams
useStreams(streamsList, (streams) => {
  if (streams.rallyLoop) {
    streamBuffer.rallyLoop = streams.rallyLoop
  }
})

onMounted(() => {
  // console.log('rallyCountdownApp onMounted')
})

onUnmounted(() => {
  // console.log('rallyCountdownApp onUnmounted')
  if (rafId) cancelAnimationFrame(rafId)
})

function showSectionObjective() {
  return activeState.value !== ActiveState.INACTIVE && scheduleData.label !== null
}

function showSectionPlaceholder() {
  return activeState.value === ActiveState.INACTIVE
}

function isStageActive() {
  return activeState.value === ActiveState.STAGE_ACTIVE
}

// Only expose to window in dev environment
if (devEnv.env || devEnv.vue) {
  window.rallyLoopApp = {
    activeState,
    vehicleProximityData,
    rallyClockData,
    scheduleData,
    stageData,
    countdownData,
    proximityStage,
    distancePrecision,
    badgeText
  }
}

</script>

<style lang="scss" scoped>

.rally-countdown-app-container {
  --color-theme: v-bind(themeColor);
  --color-theme-alpha-80: color-mix(in srgb, var(--color-theme) 80%, transparent);
  --color-theme-alpha-70: color-mix(in srgb, var(--color-theme) 70%, transparent);
  --color-theme-alpha-30: color-mix(in srgb, var(--color-theme) 30%, transparent);
  --color-white: rgba(255, 255, 255, 1);
  --color-white-alpha-20: rgba(255, 255, 255, 0.2);
  --color-black-alpha-80: rgba(0, 0, 0, 0.8);
  --color-black-alpha-70: rgba(0, 0, 0, 0.7);
  --color-black-alpha-50: rgba(0, 0, 0, 0.5);
  --color-red-light: #ff6666;
  --color-red: #ff0000;
  --color-red-alpha-70: color-mix(in srgb, var(--color-red) 70%, transparent);
  --color-goback: #ff0099;
  --color-goback-alpha-50: color-mix(in srgb, var(--color-goback) 50%, transparent);
  --color-goback-alpha-70: color-mix(in srgb, var(--color-goback) 70%, transparent);
  --color-slow: #ffff00;
  --color-slow-alpha-70: color-mix(in srgb, var(--color-slow) 70%, transparent);
  --color-staged: #ff8400;
  --color-staged-alpha-70: color-mix(in srgb, var(--color-staged) 70%, transparent);
  --color-black: #000000;
  --color-green: #66ff66;

  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 0.75rem;
  --spacing-lg: 2rem;

  --border-thin: 1px;
  --border-thick: 4px;

  --font-xs: 0.95rem;
  --font-sm: 1rem;
  --font-md: 1.2rem;
  --font-lg: 1.3rem;
  --font-xl: 1.5rem;
  --font-xxl: 2.0rem;
  --font-xxxl: 3.0rem;

  --border-radius: 0.5rem;

  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.rally-countdown-app {
  flex: 1;
  max-width: 400px;
  margin: 0 auto;
  color: var(--color-white);
  font-family: monospace;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.show-placeholder {
    background-color: rgba(0, 0, 0, 0.0);
  }

  &.show-active-stage {
    background-color: transparent;
  }


  .section-vehicle-positioning {
    border-radius: var(--border-radius);
    // background-color: var(--color-black-alpha-80);
    // background-color: var(--color-black-alpha-70);
    background-color: rgba(66, 70, 81, 0.8);

    .panel-countdown {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
  }


  .section-placeholder {
    width: 100%;
    background-color: rgba(0, 0, 0, 0.4);
    padding: var(--spacing-md);
    font-family: "Noto Sans", "Noto Sans JP", "Noto Sans KR", "Noto Sans SC", sans-serif;

    .placeholder-header {
      text-align: center;
      font-size: 1.1rem;
      font-weight: thin;
    }
  }

  .inactive-placeholder {
    color: var(--color-white);
    text-align: center;
    font-style: italic;
    font-size: var(--font-lg);
    margin-top: var(--spacing-md);
  }

  .section-interact-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    // background-color: rgba(0, 92, 150, 0.8);
    // background-color: rgb(225, 123, 225, 0.8);
    margin-top: 1rem;
    border-radius: var(--border-radius);
    font-family: 'Noto Sans';
    font-size: var(--font-xl);
    width: fit-content;
    margin-right: auto;
    margin-left: auto;
    animation: pulsate 1s ease-in-out infinite;
    font-weight: bold;
  }

  @keyframes pulsate {
    0%, 100% {
      // background-color: rgba(0, 92, 150, 0.5);
      background-color: rgb(135, 60, 135);
    }
    50% {
      // background-color: rgba(0, 92, 150, 1);
      background-color: rgb(225, 123, 225, 1);
    }
  }
}

// Fade transition for visibility
.fade-enter-active {
  transition: opacity 0.3s ease;
}

.fade-leave-active {
  transition: opacity 0.6s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
