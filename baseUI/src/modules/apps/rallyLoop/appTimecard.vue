<template>
  <div class="rally-timecard-app-container">
    <Transition name="slide">
      <div v-if="shouldShowApp()" class="rally-timecard-app">
        <div>
          <div class="interact-label-on-timecard">
            <DynamicComponent :template="`[action=gameplay_interact]${toggleLabel} Time Card`" bbcode />
          </div>


          <div class="time-card">
            <div class="rally-card-header">

              <div class="header-top">
                <span class="rally-card-title">TIME CARD</span>
                <!-- <img class="header-ngrc-logo" :src="getAssetURL('images/ngrc_logo_light_256x77.png')" /> -->
                <img class="header-beamng-logo" :src="getAssetURL('images/beamng-logo-mono_189x174.png')" />
              </div>

              <div v-if="missionName" class="mission-name">Event: {{ missionName }}</div>
            </div>

            <div class="rally-card-content">
              <template v-for="(entry, idx) in timecardData" :key="idx">

                <div v-if="idx > 0 && entry.group !== timecardData[idx - 1].group" class="group-divider"></div>

                <div class="checklist-row"
                    :class="{
                      'completed': entry.recordedTime || entry.stageTime,
                      'stage-entry': entry.isStageEntry,
                      'early': entry.status === 'early',
                      'late': entry.status === 'late',
                      'on-time': entry.status === 'on-time',
                      'pending': !entry.recordedTime && !entry.stageTime
                    }">
                  <div class="col-label">
                    <div class="event-label-top">&nbsp;</div>
                    <div class="event-label">{{ entry.label }}</div>
                  </div>

                  <div class="event-data-container">
                    <!-- SS entries: single time widget -->
                    <div v-if="entry.isStageEntry" class="time-widget">
                      <div class="time-widget-label">Time Taken</div>
                      <div class="col-recorded-time time-widget-value time-taken-value">
                        <div v-if="entry.stageTime" class="stage-time">
                          {{ entry.stageTime}}<span v-if="entry.stageTime.ampm" class="ampm"> {{ entry.stageTime.ampm }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- TC entries: three widgets -->
                    <template v-else>
                      <div class="time-widget time-widget-due">
                        <div class="time-widget-label">Due</div>
                        <div class="col-due-time time-widget-value">
                          <div v-if="entry.scheduledTime" class="scheduled-time">
                            {{ entry.scheduledTime.time }}<span v-if="entry.scheduledTime.ampm" class="ampm"> {{ entry.scheduledTime.ampm }}</span>
                          </div>
                        </div>
                      </div>

                      <div class="time-widget-combined">
                        <div class="time-widget">
                          <div class="time-widget-label">Actual</div>
                          <div class="col-recorded-time time-widget-value actual-value">
                            <div v-if="entry.recordedTime" class="recorded-time">
                              {{ entry.recordedTime.time }}<span v-if="entry.recordedTime.ampm" class="ampm"> {{ entry.recordedTime.ampm }}</span>
                            </div>
                          </div>
                        </div>

                        <div class="time-widget">
                          <div class="time-widget-label">Status</div>
                          <div class="col-status time-widget-value status-value">
                            <span v-if="entry.status === 'early'" class="status-text early">EARLY</span>
                            <span v-else-if="entry.status === 'late'" class="status-text late">LATE</span>
                            <span v-else-if="entry.recordedTime || entry.status === 'on-time'" class="status-text ok">OK</span>
                          </div>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <div v-if="penaltyData && penaltyData.totalPenalty > 0" class="penalty-card">
            <div class="rally-card-header penalty-card-header">
              <div class="header-top">
                <span class="rally-card-title">PENALTIES</span>
                <div class="penalty-total-header">
                  <span class="total-label">Total</span>
                  <span class="total-value">{{ penaltyData.totalPenalty }}s</span>
                </div>
              </div>
            </div>
            <div class="penalty-card-content">
              <!-- <div class="penalty-divider"></div> -->
              <div v-for="(group, idx) in penaltyData.groups" :key="idx" v-show="group.totalPenalty > 0" class="penalty-group">
                <div class="penalty-group-header">
                  <span class="group-name">{{ group.eventGroup }}</span>
                  <span class="group-mid"></span>
                  <span class="group-total">{{ group.totalPenalty }}s</span>
                </div>
                <div class="penalty-list">
                  <div v-for="(penalty, pidx) in group.penalties" :key="pidx" class="penalty-item">
                    <span class="penalty-type">{{ formatPenaltyType(penalty.type) }}</span>
                    <span class="penalty-amount">{{ penalty.amount }}s (x{{ penalty.count }})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div v-else class="interact-label">
        <div>
          <DynamicComponent :template="interactLabel" bbcode />
          <div class="interact-label-text">
            <div>{{toggleLabel}}</div>
            <div>Time Card</div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, computed } from 'vue'
import { useBridge } from "@/bridge"
import { useStreams, useEvents } from '@/services/events'
import { getAssetURL } from '@/utils'
import { DynamicComponent } from '@/common/components/utility'

const { lua } = useBridge()

const events = useEvents()

const penaltyData = ref({ totalPenalty: 0, groups: [] })

const displayMode = ref(1)

const devEnv = reactive({
  env: window.beamng && !window.beamng.shipping,
  vue: process.env.NODE_ENV === "development"
})


events.on('RallyGameplayInteract', (data) => {
  // If forceShowTimecard is true, always show the timecard
  if (data && data.forceShowTimecard) {
    displayMode.value = 1
  } else {
    // Otherwise, toggle between show/hide
    if (displayMode.value === 1) {
      displayMode.value = 0
    } else {
      displayMode.value = 1
    }
  }
})

const toggleLabel = computed(() => {
  return displayMode.value === 1 ? 'Hide' : 'Show'
})

const interactLabel = computed(() => {
  return '[action=gameplay_interact]'
})

// Active State Enum (matches util.lua)
const ActiveState = {
  INACTIVE: 'inactive',
  VEHICLE_PROXIMITY: 'vehicleProximity',
  STAGE_ACTIVE: 'stageActive',
  COUNTDOWN: 'countdown'
}

// Core reactive state
const showDebugInfo = ref(false)
const missionName = ref('')
const activeState = ref(ActiveState.INACTIVE)
const timecardData = ref([])

// Debug-only reactive data
const rallyClockData = reactive({})
const vehicleProximityData = reactive({})
const scheduleData = reactive({})
const stageData = reactive({})
const countdownData = reactive({})

const themeColor = computed(() => {
  return '#07ff00' // green
})

function shouldShowApp() {
  // return activeState.value !== ActiveState.INACTIVE
  return displayMode.value === 1
}

function formatPenaltyType(type) {
  // Replace underscores with spaces
  return type ? type.replace(/_/g, ' ') : ''
}

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

    if (data.showDebugInfo !== undefined) {
      showDebugInfo.value = data.showDebugInfo
    }

    if (data.missionName !== undefined) {
      missionName.value = data.missionName || ''
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
  // console.log('rallyTimecardApp onMounted')
})

onUnmounted(() => {
  // console.log('rallyTimecardApp onUnmounted')
  if (rafId) cancelAnimationFrame(rafId)
})

</script>

<style lang="scss" scoped>

.rally-timecard-app-container {
  --color-theme: v-bind(themeColor);
  --color-theme-alpha-80: color-mix(in srgb, var(--color-theme) 80%, transparent);
  --color-theme-alpha-70: color-mix(in srgb, var(--color-theme) 70%, transparent);
  --color-theme-alpha-30: color-mix(in srgb, var(--color-theme) 30%, transparent);
  --color-white: rgba(255, 255, 255, 1);
  --color-white-alpha-20: rgba(255, 255, 255, 0.2);
  --color-black-alpha-80: rgba(0, 0, 0, 0.8);
  --color-black-alpha-50: rgba(0, 0, 0, 0.5);
  --color-black-alpha-20: rgba(0, 0, 0, 0.2);
  --color-black-alpha-05: rgba(0, 0, 0, 0.05);
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
  --color-yellow-light: #fffd6e;
  --color-gray-light: #e8e8e8;

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

  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  height: 100%;
  width: 100%;
  font-family: 'Noto Sans';
}

.rally-timecard-app {
  flex: 1;
  min-height: 0;
  width: 100%;
  height: 100%;
  color: var(--color-white);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.time-widget-combined {
  display: flex;
  gap: 0;
  flex: 0 0 auto;

  .time-widget {
    &:not(:last-child) {
      .time-widget-value {
        border-right: none;
      }
    }
  }
}

.time-widget {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 0;

  &.time-widget-due {
    margin-right: 1rem;
  }

  .time-widget-label {
    align-self: flex-start;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 0px;
  }

  .time-widget-value {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-sm);
    border: 1px solid var(--color-black);
    padding: 0px var(--spacing-xs);
    min-height: 1.6rem;
    max-height: 1.6rem;
    font-weight: 700;

    &.time-taken-value {
      background-color: var(--color-yellow-light);
    }

    &.actual-value,
    &.status-value {
      background-color: var(--color-gray-light);
    }

    .ampm {
      font-size: 0.8em;
      opacity: 0.8;
      margin-left: 0.2em;
    }
  }
}

.rally-card-header {
  // padding: var(--spacing-xs);
  // padding-top: 0px;

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  // .header-ngrc-logo {
  .header-beamng-logo {
    height: 24px;
    width: auto;
  }

  .rally-card-title {
    font-size: var(--font-lg);
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .mission-name {
    font-size: var(--font-xs);
    font-weight: 600;
    // margin-top: var(--spacing-xs);
    opacity: 0.8;
    padding-bottom: 0.5rem;
  }
}

// Schedule Checklist Section
.time-card {
  width: fit-content;
  height: fit-content;
  color: var(--color-black);
  background-color: var(--color-white);
  padding: var(--spacing-sm);
}

.penalty-card {
  // margin-top: 1rem;
  // width: fit-content;
  width: 100%;
  height: fit-content;
  color: #4b0000; //dark red
  background-color: #fbffca; //light yellow
  padding: var(--spacing-sm);
  border-top: 2px solid var(--color-black);

  .penalty-total-header {
    display: flex;
    font-weight: 700;
    font-size: 0.9rem;
    border: 1px solid currentColor;
    width: fit-content;

    .total-label {
      letter-spacing: 0.05em;
      padding: 0px 4px;
    }

    .total-value {
      border-left: 1px solid currentColor;
      padding: 0px 4px;
      text-align: right;
    }
  }
}

.penalty-card-content {
  font-size: 0.8rem;

  .penalty-empty {
    font-style: italic;
    opacity: 0.7;
    padding: var(--spacing-xs);
  }

  // .penalty-divider {
  //   width: 100%;
  //   height: 2px;
  //   background-color: currentColor;
  //   margin: var(--spacing-xs) 0 var(--spacing-xs) 0;
  // }

  .penalty-group {
    margin-bottom: var(--spacing-xs);

    &:last-child {
      margin-bottom: 0;
    }

    .penalty-group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 700;
      // font-size: var(--font-sm);
      padding: 0;
      // border-bottom: 1px dotted currentColor;
      margin-bottom: 2px;

      .group-mid {
        flex: 1;
        height: 10px;
        border-bottom: 1px dotted currentColor;
        margin: 0 var(--spacing-xs);
      }

      .group-name {
        text-transform: uppercase;
      }

      .group-total {
        font-weight: 700;
      }
    }

    .penalty-list {
      padding-left: var(--spacing-md);

      .penalty-item {
        display: flex;
        justify-content: space-between;
        // font-size: var(--font-sm);
        padding: 0;
        line-height: 1.1;

        .penalty-type {
          font-weight: 600;
          text-transform: lowercase;
          &::first-letter {
            text-transform: uppercase;
          }
        }

        .penalty-amount {
          font-weight: 600;
          margin-left: var(--spacing-sm);
        }
      }
    }
  }
}

.group-divider {
  width: 100%;
  margin: 3px auto;
  border-top: 2px solid var(--color-black);
}

.checklist-row {
  display: flex;
  align-items: stretch;
  font-size: var(--font-sm);

  > div {
    padding: var(--spacing-xs);
    display: flex;
    align-items: center;
  }

  .event-data-container {
    display: flex;
    gap: 0;
    align-items: flex-start;
    flex: 1;
    width: 100%;
    padding-top: 0px;
    padding-bottom: 0px;
  }

  &.stage-entry {
    .event-data-container {
      justify-content: flex-end;
    }

    .time-widget-value {
      min-width: 6rem;
    }
  }

  .col-label {
    flex: 0 0 auto;
    flex-direction: column;
    min-width: 60px;
    white-space: nowrap;
    align-items: flex-start;
    align-self: flex-start;
    justify-content: flex-start;
    background-color: var(--color-black);
    color: var(--color-white);
    padding-top: 0px;
    padding-bottom: 0px;

    .event-label-top {
      // margin-top: 6px;
      font-size: 0.7rem;
      font-weight: 700;
      // min-height: 0.2rem;
      text-align: left;
    }

    .event-label {
      font-size: var(--font-md);
      font-weight: 600;
      text-align: left;
    }
  }

  .col-due-time,
  .col-recorded-time {
    flex: 0 0 auto;
    min-width: 60px;
    justify-content: flex-end;
  }

  .col-status {
    flex: 0 0 auto;
    width: 50px;
    height: var(--font-xxl);
    justify-content: center;

    .status-text {
      font-size: 0.9rem;
      font-weight: 500;

      &.early,
      &.late {
        color: rgb(193, 0, 0);
      }
    }
  }
}

// Slide transition for visibility
.slide-enter-active,
.slide-leave-active {
  position: absolute;
  top: 0;
  left: 0;
}

.slide-enter-active {
  transition: transform 0.4s ease-out, opacity 0.4s ease-out;
}

.slide-leave-active {
  transition: transform 0.3s ease-in, opacity 0.3s ease-in;
}

.slide-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.interact-label-text {
  font-size: var(--font-sm);
}

.interact-label {
  color: rgba(255, 255, 255, 0.9);
  background-color: rgba(66, 70, 81, 0.8);
  font-family: 'Noto Sans';
  font-size: var(--font-xl);
  // font-weight: bold;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  padding: var(--spacing-xs);
}

.interact-label-on-timecard {
  // flex: 0;
  // max-width: 100%;
  // margin-top: 1rem;
  // border-top: 2px solid #888888;
  // border-bottom-left-radius: 8px;
  // border-bottom-right-radius: 8px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  // background-color: #242424d6;
  background-color: rgba(66, 70, 81, 0.8);
  color: #ffffff;
  font-style: italic;
  font-size: 0.8rem;
  width: 100%;
  text-align: center;
  padding: var(--spacing-xs);
}

</style>
