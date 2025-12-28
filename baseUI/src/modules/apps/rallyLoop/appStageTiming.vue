<template>
  <Transition name="fade">
    <div v-if="shouldShowApp()" class="rally-stage-timing-app">
      <div class="section-active-stage">
        <div class="stage-header">STAGE {{ stageData.label }} / {{ scheduleData.totalSSCount }}</div>
        <div class="stage-time">{{ formatSSTime(stageData.currentSSTime, activeState) }}</div>
        <div class="splits-header" v-if="completedSplits.length > 0">SPLITS</div>
        <div class="stage-splits" v-if="completedSplits.length > 0">
          <div class="stage-split" v-for="split in completedSplits" :key="split.pathnodeId">
            <div class="stage-split-label">
              <span>
                {{ split.splitLabel }}
              </span>
              <span class="stage-split-label-unit">
                {{ splitUnit }}
              </span>
            </div>
            <div class="stage-split-time">{{ formatSSTime(split.time, activeState) }}</div>
          </div>
        </div>

        <img
          v-if="rallyClockData.isNgrcMode"
          class="stage-ngrc-badge"
          :src="getAssetURL('images/ngrc_logo_dark_128x40.png')"
          alt="NGRC"
        />

      </div>


    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, computed } from 'vue'
import { useBridge } from "@/bridge"
import { useStreams } from '@/services/events'
import { formatSSTime } from './utils/timeFormatters'
import { getAssetURL } from '@/utils'
import { rallyStageThemeColor } from './utils/colorTheme'

const { lua } = useBridge()

const ActiveState = {
  INACTIVE: 'inactive',
  VEHICLE_PROXIMITY: 'vehicleProximity',
  STAGE_ACTIVE: 'stageActive',
  COUNTDOWN: 'countdown'
}

const rallyClockData = reactive({
  wallClockSecs: null,
  epochTime: null,
  day: null,
  totalPenalty: 0,
  totalTime: 0,
  use24hFormat: true,
  canSkipTimeControls: false,
  canSkipCountdown: false,
  isNgrcMode: false
})

const activeState = ref(ActiveState.INACTIVE)

const vehicleProximityData = reactive({
  isNear: false,
  distance: 0,
  distanceToPlane: 0,
  isStopped: false,
  isFrozen: false,
  usingGroundMarkerDistance: false
})

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

const themeColor = computed(() => {
  // return '#07ff00'
  return rallyStageThemeColor(true)
})

const completedSplits = computed(() => {
  return stageData.splits?.filter(split => split.time != null) || []
})

const splitUnit = computed(() => {
  return 'km'
})

const streamsList = ['rallyLoop']
let streamBuffer = { rallyLoop: null }
let rafId = null

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

    if (data.stageData) {
      Object.assign(stageData, data.stageData)
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
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
})

function shouldShowApp() {
  // return activeState.value === ActiveState.STAGE_ACTIVE
  return true
}
</script>

<style lang="scss" scoped>

.rally-stage-timing-app {
  // --color-theme: v-bind(themeColor);
  --color-theme: #009a1ae0;
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
  flex: 1;
  min-height: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: transparent;
  color: var(--color-white);
  font-family: monospace;
}

.section-active-stage {
  // --theme-color: v-bind(themeColor);
  background-color: transparent;
  color: var(--color-white);
  min-width: 10rem;
  // width: 15rem;
  max-width: 100%;
  font-family: 'Noto Sans';
  font-size: var(--font-xxl);

  .stage-header {
    padding: var(--spacing-xs);
    text-align: center;
    font-style: italic;
    letter-spacing: 0.08rem;
    background-color: var(--color-black-alpha-80);
    font-size: var(--font-md);
  }

  .stage-time {
    font-size: var(--font-xxxl);
    background-color: var(--color-theme);
    padding-top: 0;
    padding-bottom: 0;
    width: 100%;
    font-weight: 600;
    text-align: center;
    overflow: hidden;
  }

  .splits-header {
    background-color: var(--color-black-alpha-80);
    // padding-top: var(--spacing-md);
    text-align: center;
    font-style: italic;
    font-size: var(--font-md);
    letter-spacing: 0.08rem;
  }

  .stage-split-label-unit {
    padding-left: 4px;
    font-size: var(--font-sm);
    font-weight: 400;
  }

  .stage-splits {
    background-color: var(--color-black-alpha-80);
    padding: var(--spacing-sm);
    font-size: var(--font-xl);

    .stage-split {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }

    .stage-split-label {
      font-weight: 600;
    }
  }

  .stage-ngrc-badge {
    text-align: center;
    font-size: var(--font-md);
    letter-spacing: 0.08rem;
    height: 42px;
    display: block;
    margin-left: auto;
    margin-right: auto;
    background-color: rgba(0, 0, 0);
    padding-left: var(--spacing-sm);
    padding-right: var(--spacing-sm);
    padding-top: 8px;
    padding-bottom: 8px;
    margin-top: 0px;
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
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
