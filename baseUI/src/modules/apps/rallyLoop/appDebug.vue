<template>
  <div class="rally-debug-app-container">
    <div v-if="showDebugInfo" class="debug-info">
      <div>activeState: "{{ activeState }}"</div>
      <div>rallyClock: {{ rallyClockData }}</div>
      <div>countdownData: {{ countdownData }}</div>
      <div>vehicleProximityData: {{ vehicleProximityData }}</div>
      <div>scheduleData: {{ scheduleData }}</div>
      <div>timecardData: {{ timecardData }}</div>
      <div>penaltyData: {{ penaltyData }}</div>
      <div>stageData: {{ stageData }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import { useBridge } from "@/bridge"
import { useStreams } from '@/services/events'

const { lua } = useBridge()
// Active State Enum (matches util.lua)
const ActiveState = {
  INACTIVE: 'inactive',
  VEHICLE_PROXIMITY: 'vehicleProximity',
  STAGE_ACTIVE: 'stageActive',
  COUNTDOWN: 'countdown'
}

// const showDebugInfo = ref(false)
const showDebugInfo = ref(true)

// Core reactive state
const activeState = ref(ActiveState.INACTIVE)
const timecardData = ref([])
const penaltyData = ref({ totalPenalty: 0, groups: [] })

// Debug-only reactive data
const rallyClockData = reactive({})
const vehicleProximityData = reactive({})
const scheduleData = reactive({})
const stageData = reactive({})
const countdownData = reactive({})

// Streams Integration
const streamsList = ['rallyLoop']

let streamBuffer = {
  rallyLoop: null
}
let rafId = null

// Process buffered updates at 60fps
function processStreamUpdates() {
  if (streamBuffer.rallyLoop) {
    const data = streamBuffer.rallyLoop

    activeState.value = data.activeState || ActiveState.INACTIVE

    if (data.rallyClock) {
      Object.assign(rallyClockData, data.rallyClock)
    }

    if (data.scheduleData) {
      Object.assign(scheduleData, data.scheduleData)
    }

    if (data.timecardData) {
      timecardData.value = data.timecardData
    }

    if (data.penaltyData) {
      penaltyData.value = data.penaltyData
    }

    if (data.stageData) {
      Object.assign(stageData, data.stageData)
    }

    if (data.countdownData) {
      Object.assign(countdownData, data.countdownData)
    }

    if (data.vehicleProximity) {
      Object.assign(vehicleProximityData, data.vehicleProximity)
    }

    streamBuffer.rallyLoop = null
  }

  rafId = requestAnimationFrame(processStreamUpdates)
}

rafId = requestAnimationFrame(processStreamUpdates)


useStreams(streamsList, (streams) => {
  if (streams.rallyLoop) {
    streamBuffer.rallyLoop = streams.rallyLoop
  }
})

onMounted(() => {
  // console.log('rallyDebugApp onMounted')
})

onUnmounted(() => {
  // console.log('rallyDebugApp onUnmounted')
  if (rafId) cancelAnimationFrame(rafId)
})

</script>

<style lang="scss" scoped>

.rally-debug-app-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  height: 100%;
  width: 100%;
}

.debug-info {
  height: 100%;
  width: 100%;
  padding: 0.5rem;
  background-color: rgba(0, 0, 0, 0.9);
  color: #0f0;
  font-size: 0.7rem;
  font-family: monospace;
  word-wrap: break-word;

  div {
    margin: 0.25rem;
    padding: 0.25rem;
    &:not(:first-child) {
      border-top: 1px solid #0f0;
    }
  }
}
</style>
