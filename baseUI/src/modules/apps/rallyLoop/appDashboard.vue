<template>
  <Transition name="fade">
    <div class="rally-dashboard-app-container">

      <div v-if="!isStageActive()" class="rally-dashboard-app" :class="{ 'show-active-stage': isStageActive() }">
        <!-- Rally Clock Section -->
        <div class="dashboard-widget widget-rally-clock">
          <div class="widget-label">Event Clock</div>
          <div class="widget-value clock-value" :class="{ 'flash-pink': clockFlash }">
            {{ formattedWallClock.time }}<span v-if="formattedWallClock.period" class="period">{{ formattedWallClock.period }}</span>
          </div>
        </div>

        <div class="dashboard-widget widget-rally-sstime">
          <div class="widget-label">Your Time</div>
          <div class="widget-value">{{ rallyClockData.totalTime }}</div>
        </div>

        <div class="dashboard-widget widget-rally-objective">
          <div class="widget-label">Instructions</div>
          <!-- <div class="widget-value">{{ objectiveText }}</div> -->
          <div class="widget-value">
            <span v-for="item in objectiveText" :key="item">
              <span v-if="item.type === 'badge'" :class="item.class">{{ item.val }}</span>
              <span v-else-if="item.type === 'clock'" :class="item.class">{{ item.val.time }}{{ item.val.period }}</span>
              <span v-else>{{ item }}</span>
            </span>
            <DynamicComponent :template="recoverVehicleTemplate" bbcode />
          </div>
        </div>

      </div> <!-- End of Rally Loop App -->
    </div>

  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, computed } from 'vue'
import { useBridge } from "@/bridge"
import { useStreams, useEvents } from '@/services/events'
import { DynamicComponent } from '@/common/components/utility'

const { lua } = useBridge()

const events = useEvents()

const recoverVehicleTemplate = computed(() => {
  return ' Press [action=reset_physics] to recover vehicle.'
})

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
  canSkipCountdown: false,
  isNgrcMode: false
})

// Active state (uses ActiveState enum)
const activeState = ref(ActiveState.INACTIVE)

// Clock flash state
const clockFlash = ref(false)

// Handle interact event - flash the clock
// events.on('RallyGameplayInteract', () => {
//   clockFlash.value = false
//   setTimeout(() => {
//     clockFlash.value = true
//   }, 0)
//   setTimeout(() => {
//     clockFlash.value = false
//   }, 1000)
// })

// Handle clock skip event - flash the clock
events.on('RallyClockSkipped', () => {
  clockFlash.value = false
  setTimeout(() => {
    clockFlash.value = true
  }, 0)
  setTimeout(() => {
    clockFlash.value = false
  }, 1000)
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
  speedUnit: 'km/h'
})

// Computed property for formatted wall clock
const formattedWallClock = computed(() => {
  // wallClockTime is now a table {time: "HH:MM:SS", ampm?: "AM/PM"}
  if (!rallyClockData.wallClockTime) {
    return { time: '--:--:--', period: '' }
  }
  return {
    time: rallyClockData.wallClockTime.time || '--:--:--',
    period: rallyClockData.wallClockTime.ampm || ''
  }
})

// Computed property for objectiveText
const objectiveText = computed(() => {
  const obj = scheduleData
  if (!obj || !obj.eventType) return []

  // Service In event
  if (obj.eventType === 'service_in') {
    // return 'Drive through the service park and pull into your bay.'
    return [
      'Drive to your ',
      {type: 'badge', val: 'service bay', class: 'tc-badge'},
      '.',
    ]
  }

  // Road section + TC event
  if (obj.eventType === 'tc' && obj.label === "TC0") {
    // return `Reverse out of the service bay and drive to ${obj.label}.`
    return [
      'Reverse out and reach ',
      {type: 'badge', val: obj.label, class: 'tc-badge'},
      ' between ',
      {type: 'clock', val: obj.eventWallClockStart, class: 'clock-badge'},
      ' - ',
      {type: 'clock', val: obj.eventWallClockEnd, class: 'clock-badge'},
      '. Penalty for each minute early or late: ',
      {type: 'badge', val: `+10s`, class: 'penalty-badge'},
      '.',
    ]
  }
  // Road section + TC event
  if (obj.eventType === 'tc') {
    // return `Drive to the ${obj.label}`
    return [
      'Reach ',
      {type: 'badge', val: obj.label, class: 'tc-badge'},
      ' between ',
      {type: 'clock', val: obj.eventWallClockStart, class: 'clock-badge'},
      ' - ',
      {type: 'clock', val: obj.eventWallClockEnd, class: 'clock-badge'},
      '. Penalty for each minute early or late: ',
      {type: 'badge', val: `10sec`, class: 'penalty-badge'},
      '.',
    ]
  }

  // SS Start event
  // if (obj.eventType === 'ss_start') {
    // return `Drive to the SS${obj.ssLabel} Start Line and prepare for the special stage.`
  // }

  // SS Stop event
  // if (obj.eventType === 'ss_stop') {
    // return `Stop after the SS${obj.ssLabel} flying finish.`
  // }

  return []
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
  // console.log('rallyDashboardApp onMounted')
})

onUnmounted(() => {
  // console.log('rallyDashboardApp onUnmounted')
  if (rafId) cancelAnimationFrame(rafId)
})

function isStageActive() {
  return activeState.value === ActiveState.STAGE_ACTIVE
}

</script>

<style lang="scss" scoped>

.rally-dashboard-app-container {
  --color-white: rgba(255, 255, 255, 1);
  --color-black-alpha-80: rgba(0, 0, 0, 0.8);
  --color-black-alpha-70: rgba(0, 0, 0, 0.7);
  --font-md: 1.2rem;
  --font-xxl: 2.0rem;
}

.rally-dashboard-app {
  display: flex;
  gap: 1rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  padding-top: 0.2rem;
  padding-bottom: 0.2rem;
  // background-color: var(--color-black-alpha-70);
  background-color: rgba(66, 70, 81, 0.8);
  border-bottom-right-radius: 1rem;
  border-bottom-left-radius: 1rem;
  height: 100%;
  width: 100%;

  .dashboard-widget {
    display: flex;
    flex-direction: column;
    .widget-label {
      font-size: 0.7rem;
      color: var(--color-white);
      text-align: center;
      text-transform: uppercase;
    }
  }

  .widget-rally-clock {
    min-width: 150px;
    .clock-value {
      font-family: monospace;
      font-weight: bold;
      font-size: var(--font-xxl);
      text-align: center;
      color: rgb(225, 123, 225);
      text-shadow: 0 0 10px rgba(225, 123, 225, 0.5);
      border-radius: 0.5rem;

      &.flash-pink {
        animation: flashPink 1s ease-out;
      }

      .period {
        padding-left: 0.25em;
        font-size: 0.6em;
      }
    }
  }

  @keyframes flashPink {
    0% {
      background-color: rgba(255, 105, 180, 0.6);
      box-shadow: 0 0 20px rgba(255, 105, 180, 1), 0 0 10px rgba(255, 105, 180, 0.8);
    }
    100% {
      background-color: transparent;
      box-shadow: none;
    }
  }

  .widget-rally-sstime {
    min-width: 150px;
    .widget-value {
      text-align: center;
      font-size: var(--font-xxl);
      font-weight: bold;
      color: #f0f0f0;
    }
  }

  .widget-rally-objective {
    width: 100%;

    .widget-label {
      text-align: left;
    }
    .widget-value {
      text-align: left;
      font-size: var(--font-md);
      color: #f0f0f0;
    }
  }

  .tc-badge {
    color: var(--color-white);

    // background-color: rgb(0, 122, 196);

    background-color: rgb(43, 136, 194);

    border-radius: 8px;
    padding: 0.1rem 0.3rem;
    font-family: monospace;
    font-weight: bold;
  }
  .clock-badge {
    color: var(--color-white);

    // background-color: rgb(225, 123, 225);

    // background-color: rgb(180, 90, 180);

    background-color: rgb(184, 107, 184);

    border-radius: 8px;
    padding: 0.1rem 0.3rem;
    font-family: monospace;
    font-weight: bold;
  }
  .penalty-badge {
    color: var(--color-white);

    // background-color: rgb(176, 16, 16);

    background-color: rgb(165, 57, 57);

    border-radius: 8px;
    padding: 0.1rem 0.3rem;
    font-family: monospace;
    font-weight: bold;
  }
}
</style>
