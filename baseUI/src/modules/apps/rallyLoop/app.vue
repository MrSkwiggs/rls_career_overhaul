<template>
  <Transition name="fade">
    <!-- <div v-if="visible" class="rally-loop-app" :class="{ 'show-placeholder': showSectionPlaceholder() }"> -->
    <div class="rally-loop-app-container">

      <div v-if="!isStageActive()" class="rally-loop-app" :class="{ 'show-active-stage': isStageActive() }">
        <!-- Rally Clock Section -->
        <RallyClock
          :wall-clock-secs="rallyClockData.wallClockSecs"
          :day="rallyClockData.day"
          :total-s-s-time="rallyClockData.totalTime"
          :total-penalty="rallyClockData.totalPenalty"
          :use24h-format="rallyClockData.use24hFormat"
          :active-state="activeState"
        />

        <div v-if="activeState === ActiveState.INACTIVE" class="inactive-placeholder">
          No Active NGRC Event
        </div>

        <!-- Vehicle Proximity Section -->
        <!-- <div v-if="activeState === ActiveState.VEHICLE_PROXIMITY" class="section-vehicle-positioning">
          <VehicleProximity
            :vehicle-proximity="vehicleProximityData"
            :stage="proximityStage"
            :precision="distancePrecision"
            :badge-text="badgeText"
            :instruction="proximityInstruction"
          />
        </div> -->

        <!-- Countdown Section -->
        <!-- <div v-if="activeState === ActiveState.COUNTDOWN" class="section-vehicle-positioning"> -->
          <!-- <div class="panel-countdown">
            <CountdownWidget
              :rally-loop-manager="formatWallClockForCountdown(rallyClockData.wallClockSecs, rallyClockData.day, rallyClockData.use24hFormat).time"
              :period="formatWallClockForCountdown(rallyClockData.wallClockSecs, rallyClockData.day, rallyClockData.use24hFormat).period"
              :countdown="countdownData.countdown"
            />
          </div> -->
        <!-- </div> -->

        <!-- Objective Section -->
        <ObjectivePanel
          v-if="showSectionObjective()"
          :scheduleStr="objectiveSchedule.scheduleStr"
          :statusStr="objectiveSchedule.statusStr"
          :latenessStr="objectiveSchedule.latenessStr"
          :latenessType="objectiveSchedule.latenessType"
          :instructions="objectiveInstructions"
        />

        <!-- Rally Interact Input Hint -->
        <div v-if="canInteract" class="section-interact-hint">
          <DynamicComponent :template="interactLabel" bbcode />
          <!-- <BngBinding
            :action="'rallyLoopInteract'"
            :show-unassigned="false"
          /> -->
        </div>

        <!-- <div v-else class="section-placeholder">
          <div class="placeholder-header">
            No Active NGRC Event
          </div>
        </div> -->

        <div v-if="rallyClockData.isNgrcMode" class="section-ngrc-mode">
          <div class="ngrc-mode-header">
            NGRC
          </div>
        </div>
      </div> <!-- End of Rally Loop App -->

      <!-- <ActiveStage
        v-else
        :stage-data="stageData"
        :schedule-data="scheduleData"
        :active-state="activeState"
        :theme-color="themeColor"
      /> -->

      <div v-if="showDebugInfo" class="debug-info">
        <div>activeState: "{{ activeState }}"</div>
        <div>rallyClock: {{ rallyClockData }}</div>
        <div>countdownData: {{ countdownData }}</div>
        <div>vehicleProximityData: {{ vehicleProximityData }}</div>
        <div>scheduleData: {{ scheduleData }}</div>
        <div>stageData: {{ stageData }}</div>
      </div>
    </div>

  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, computed, watch } from 'vue'
import { useBridge } from "@/bridge"
import { useEvents, useStreams } from '@/services/events'
import { BngButton, BngSlider, ACCENTS, BngIcon, icons, BngBinding } from "@/common/components/base"
import CountdownWidget from './components/CountdownWidget.vue'
import VehicleProximity from './components/VehicleProximity.vue'
import RallyClock from './components/RallyClock.vue'
import ObjectivePanel from './components/ObjectivePanel.vue'
// import ActiveStage from './components/ActiveStage.vue'
import { formatWallClockForCountdown, formatSSTime, formatTimeDiff, format24hTime, formatAmPm } from './utils/timeFormatters'
import { DynamicComponent } from '@/common/components/utility'

// Event handling
const events = useEvents()
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

// Visibility control
const visible = ref(true)


// Rally clock data
const rallyClockData = reactive({
  wallClockSecs: null,
  epochTime: null,
  day: null,
  totalPenalty: 0,
  totalTime: 0,
  use24hFormat: true,  // Default to 24h format
  canSkipTimeControls: false,
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
  canIncurLatePenalty: false
})

// Objective data (player instructions)
const objectiveData = reactive({
  // label: null,
  // eventType: null,
  // ssLabel: null,
  // eventWallClock: null,
  // timeDiff: null,
  // penalty: 0,
  // hasPenalty: false
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
  // return '#DA5706' // beamng orange
  return '#07ff00' // green
  // return '#49b9ff' // blue
  // return '#a349ff' // purple
})

// Computed property for interaction availability
const canInteract = computed(() => {
  return rallyClockData.canSkipTimeControls || rallyClockData.canSkipCountdown
})

// Computed property for interaction label
const interactLabel = computed(() => {
  if (rallyClockData.canSkipCountdown) {
    return '[action=gameplay_interact]Skip to Countdown'
  } else if (rallyClockData.canSkipTimeControls) {
    return '[action=gameplay_interact]Skip to Time Control'
  }
  return ''
})

// Data staleness tracking
// const PROXIMITY_DISPLAY_DURATION = 1000 // 1 second in milliseconds
// const vehicleProximityLastUpdate = ref(-Infinity)
// const currentTime = ref(Date.now())
// const enableStaleChecking = ref(true) // Can be disabled for testing
// const enableStreamUpdates = ref(true) // Can be disabled for testing

// Event listeners for UI visibility
// events.on('RallyUIShow', () => {
//   visible.value = true
// })

// events.on('RallyUIHide', () => {
//   visible.value = false
// })

// events.on('RallyUIStageInProgress', () => {
//   console.log('RallyUIStageInProgress')
//   stageInProgress.value = true
// })

// Event listeners for context changes
// events.on('RallyUIContextEnter_TC', (data) => {
//   positioningContext.value = 'timeControl'
//   visible.value = true
//   stageInProgress.value = false
// })

// events.on('RallyUIContextEnter_START_LINE', (data) => {
//   positioningContext.value = 'startLine'
//   visible.value = true
//   stageInProgress.value = false
// })


// events.on('RallyUIContextReset', (data) => {
  // positioningContext.value = 'default'
  // if (data && data.show !== undefined) {
  //   visible.value = data.show
  // }
// })

// Computed property for data staleness
// const isVehicleProximityDataStale = computed(() => {
//   if (!enableStaleChecking.value) return false // Never stale when checking is disabled
//   return (currentTime.value - vehicleProximityLastUpdate.value) > PROXIMITY_DISPLAY_DURATION
// })


// Watch for stale data and auto-switch to default if enabled
// watch([isVehicleProximityDataStale], () => {
//   if (!enableStaleChecking.value) return

//   // If current context's data is stale, switch to default
//   if ((positioningContext.value === 'startLine' || positioningContext.value === 'timeControl' || positioningContext.value === 'stopControl' || positioningContext.value === 'serviceIn') && isVehicleProximityDataStale.value) {
//     positioningContext.value = 'default'
//   }
// })


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

// Computed property for objective display label (domain logic for what to show)
const objectiveDisplayLabel = computed(() => {
  // if (scheduleData.eventType === 'service_in') {
    // return 'SERVICE'
  // }
  return scheduleData.label
})

// Computed property for objective instructions
const objectiveInstructions = computed(() => {
  const obj = scheduleData
  if (!obj || !obj.eventType) return ''

  // Service In event
  if (obj.eventType === 'service_in') {
    return 'Drive through the service park and pull into your bay.'
  }

  // Road section + TC event
  if (obj.eventType === 'tc' && obj.label === "TC0") {
    return `Drive to the ${obj.label} Time Control and stop. TC0 marks the official start of the rally.`
  }
  // Road section + TC event
  if (obj.eventType === 'tc') {
    return `Drive to the ${obj.label} Time Control and stop. +30s penalty for not following the required route.`
  }

  // SS Start event
  if (obj.eventType === 'ss_start') {
    return `Drive to the SS${obj.ssLabel} Start Line and prepare for the special stage.`
  }

  // SS Stop event
  if (obj.eventType === 'ss_stop') {
    return `Stop after the SS${obj.ssLabel} flying finish.`
  }

  return ''
})

const latenessStr = computed(() => {
  const canIncurLatePenalty = scheduleData.canIncurLatePenalty
  if (!canIncurLatePenalty) {
    return ''
  }

  const latenessType = scheduleData.lateness
  const word = scheduleData.lateness

  let penalty = ''
  const latePenalty = scheduleData.penalty
  if (latePenalty > 0) {
    const totalPenalty = latePenalty
    penalty = `+${totalPenalty}s`
  }

  if (latenessType === 'late') {
    return `${word} &rarr; +10s/min penalty (${penalty})`
  } else if (latenessType === 'early') {
    // Use plane distance for lateness check (not ground marker distance)
    const distance = vehicleProximityData.distanceToPlane
    // only show early penalty if within 50m of the event
    if (distance < 50) {
      return `${word} &rarr; +10s/min penalty (${penalty})`
    } else {
      return ''
    }
  } else if (latenessType === 'on-time') {
    // Show time remaining until late
    const timeUntilLate = Math.abs(scheduleData.timeDiffWithEnd)
    const timeStr = formatTimeDiff(timeUntilLate, true)
    return `${word} for ${timeStr}`
  }

  return ''
})

const statusStr = computed(() => {
  const timeDiff = scheduleData.timeDiff
  if (timeDiff === null || timeDiff === undefined) {
    return ''
  }
  const timeStr = formatTimeDiff(timeDiff, true)

  const timeDiffWithEnd = scheduleData.timeDiffWithEnd
  if (timeDiffWithEnd === null || timeDiffWithEnd === undefined) {
    return ''
  }
  const timeStrWithEnd = formatTimeDiff(timeDiffWithEnd, true)

  const canIncurLatePenalty = scheduleData.canIncurLatePenalty
  if (!canIncurLatePenalty) {

    if (scheduleData.eventType === 'ss_start') {
      return `${timeStr} from now`;
    }

    return ''
  }

  const latenessType = scheduleData.lateness
  if (latenessType === 'late') {
    return `${timeStrWithEnd} ago`
  } else if (latenessType === 'early') {
    return `${timeStr} from now`
  } else if (latenessType === 'on-time') {
    // return `on time`
    return ''
  }
})

const scheduleStr = computed(() => {
  let timeStr = ''
  if (scheduleData.eventWallClockStart !== null && scheduleData.eventWallClockStart !== undefined) {
    if (rallyClockData.use24hFormat) {
      const startStr = format24hTime(scheduleData.eventWallClockStart, false)
      // const endStr = format24hTime(scheduleData.eventWallClockEnd, false)
      // timeStr = `${startStr} - ${endStr}`
      timeStr = startStr
    } else {
      const startStr = formatAmPm(scheduleData.eventWallClockStart, false, true)
      // const endStr = formatAmPm(scheduleData.eventWallClockEnd, false)
      // timeStr = `${startStr} - ${endStr}`
      timeStr = startStr
      timeStr = `${startStr.time}${startStr.period}`
    }
  }

  if (scheduleData.eventType === 'ss_stop') {
    return `${objectiveDisplayLabel.value}`
  } else {
    return `${objectiveDisplayLabel.value} at ${timeStr}`
  }
})

// Computed property for formatted objective summary
const objectiveSchedule = computed(() => {
  if (!objectiveDisplayLabel.value) {
    return {
      scheduleStr: '',
      statusStr: '',
      latenessStr: latenessStr.value,
      latenessType: null
    }
  }

  // For service_in events without scheduled time, just show label
  if (scheduleData.eventType === 'service_in') {
    return {
      scheduleStr: objectiveDisplayLabel.value,
      statusStr: '',
      latenessStr: latenessStr.value,
      latenessType: null
    }
  }


  return {
    scheduleStr: scheduleStr.value,
    statusStr: statusStr.value,
    latenessStr: latenessStr.value,
    latenessType: scheduleData.lateness
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
      text = 'stop within 1m of start line to stage vehicle'
    } else if (scheduleData.eventType === 'tc') {
      text = 'stop within 5m of time control'
    } else if (scheduleData.eventType === 'ss_stop') {
      text = 'slow down for stop control'
      type = 'alert-sm'
    }
  } else if (stage === 'stop') {
    if (scheduleData.eventType === 'ss_start') {
      text = 'stop for countdown'
    }
  } else if (stage === 'goback') {
    text = 'back up!!!'
    type = 'alert'
  } else if (stage === 'staged') {
    if (vehicleProximityData.isFrozen) {
      text = '(vehicle frozen until launch)'
    } else {
      text = 'PREPARE TO LAUNCH'
      type = 'alert'
    }
  } else if (stage === 'approaching') {
    if (scheduleData.eventType === 'ss_start') {
      text = `pull to SS${scheduleData.ssLabel} START`
    } else if (scheduleData.eventType === 'tc') {
      text = `drive to time control`
    } else if (scheduleData.eventType === 'service_in') {
      text = 'pull into service bay'
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

    // Update objectiveData if present
    // if (data.objectiveData) {
    //   Object.assign(objectiveData, data.objectiveData)
    // }

    // Update stage data if present
    if (data.stageData) {
      Object.assign(stageData, data.stageData)
    }

    // Update countdown data if present
    if (data.countdownData) {
      Object.assign(countdownData, data.countdownData)
    }

    // Update vehicle proximity from unified vehicleProximity data
    // Only update if NOT in default context and activeState is vehicleProximity
    // if (positioningContext.value !== 'default' && data.activeState === ActiveState.VEHICLE_PROXIMITY && data.vehicleProximity) {
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

// function checkRallyLoopExtension() {
//   const isLoaded = lua.extensions.isExtensionLoaded('gameplay_rallyLoop')
//   // isLoaded is a promise, resolve it
//   isLoaded.then(result => {
//     // console.log('isLoaded gameplay_rallyLoop', result)
//     activeState.value = ActiveState.INACTIVE
//   }).catch(err => {
//     console.error('Failed to check isLoaded gameplay_rallyLoop', err)
//   })
// }

// Start processing stream updates
rafId = requestAnimationFrame(processStreamUpdates)

// let intervalId = null

// Subscribe to streams
useStreams(streamsList, (streams) => {
  if (streams.rallyLoop) {
    streamBuffer.rallyLoop = streams.rallyLoop
  }
})

onMounted(() => {
  // console.log('rallyLoopApp onMounted')
  // intervalId = setInterval(() => {
  //   checkRallyLoopExtension()
  // }, 1000)
})

onUnmounted(() => {
  // console.log('rallyLoopApp onUnmounted')
  if (rafId) cancelAnimationFrame(rafId)
  // clearInterval(intervalId)
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
    // objectiveData,
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

.rally-loop-app-container {
  --color-theme: v-bind(themeColor);
  --color-theme-alpha-80: color-mix(in srgb, var(--color-theme) 80%, transparent);
  --color-theme-alpha-70: color-mix(in srgb, var(--color-theme) 70%, transparent);
  --color-theme-alpha-30: color-mix(in srgb, var(--color-theme) 30%, transparent);
  --color-white: rgba(255, 255, 255, 1);
  --color-white-alpha-20: rgba(255, 255, 255, 0.2);
  --color-black-alpha-80: rgba(0, 0, 0, 0.8);
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


  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
//   border: 1px solid green;
}

.debug-info {
  flex-shrink: 0;
  // min-width: 400px;
  // max-width: 400px;
  padding: var(--spacing-sm);
  background-color: rgba(0, 0, 0, 0.9);
  color: #0f0;
  font-size: 0.7rem;
  font-family: 'Courier New', monospace;
  border-top: 2px solid #0f0;
  overflow-y: auto;
  overflow-x: hidden;
  word-wrap: break-word;

  div {
    margin: 0.25rem;
    padding: 0.25rem;
    &:not(:first-child) {
      border-top: 1px solid #0f0;
    }
  }
}

.rally-loop-app {
  flex: 1;
  min-height: 0;
  // border: 1px solid blue;

  min-width: 400px;
  max-width: 400px;
  // width: 400px;
  // max-height: 800px;
  // height: 800px;

  // CSS Variables

  background-color: var(--color-black-alpha-80);
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
    overflow-y: hidden;
    padding: var(--spacing-md);
    border-bottom: var(--border-thick) solid var(--color-theme-alpha-80);

    // Panel: Countdown (top and bottom cells)
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
      // color: var(--color-theme);
      text-align: center;
      // font-style: italic;
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
    background-color: var(--color-black-alpha-50);
    border-top: var(--border-thin) solid var(--color-theme-alpha-70);
    font-family: monospace;

    .hint-label {
      color: var(--color-theme);
      font-size: var(--font-md);
      font-weight: bold;
    }
  }

  .section-ngrc-mode {
    margin-top: auto;
    padding: var(--spacing-sm);

    background-color: var(--color-black-alpha-50);
    // border-top: var(--border-thin) solid var(--color-theme-alpha-70);
    text-align: center;
    margin-left: auto;
    margin-right: auto;
    width: fit-content;

    .ngrc-mode-header {
      color: var(--color-white);
      font-size: var(--font-lg);
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
