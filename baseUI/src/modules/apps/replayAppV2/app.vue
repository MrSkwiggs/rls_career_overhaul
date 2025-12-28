<template>
  <div class="replay-app-container" ref="appContainerRef">
    <!-- Top control bar -->
    <div v-if="!props.hideFileControls" class="file-controls" :class="{ narrow: layoutState.isFileControlsNarrow }">
      <div class="left-controls">
        <!-- Open file button (when not renaming and not recording) -->
        <BngButton
          class="recordings-button"
          @click="listRecordings"
          icon="folder"
          tooltip="Open recordings"
          :accent="ACCENTS.text"
        />

        <!-- Close button (when not renaming and not recording) -->
        <BngButton
          class="recordings-button"
          v-if="loadedFile && state !== 'recording' && !renaming"
          @click="stop"
          icon="xmark"
          :disabled="state !== 'playback'"
          tooltip="Close replay"
          :accent="ACCENTS.text"
        />

        <!-- Cancel recording button (when recording) -->
        <BngButton
          class="recordings-button"
          v-if="state === 'recording'"
          @click="cancelRecording"
          icon="undo"
          :accent="ACCENTS.attention"
          tooltip="Cancel recording"
        />
      </div>
      <div class="filename-container">
        <!-- Filename input -->
        <template v-if="loadedFile && state !== 'recording'">
          <template v-if="renaming">
            <BngButton
              @click="cancelRename"
              icon="xmark"
              :accent="ACCENTS.ghost"
              class="cancel-rename-button"
            >
            </BngButton>

            <BngInput
              id="replay-filename-input"
              class="filename-input"
              :prefix="replayFolder"
              :suffix="replayFileExtension"
              v-model="loadedFile"
              placeholder="(no file)"
              :disabled="state === 'recording' || !loadedFile"
              v-on:keyup.enter="acceptRename"
            />
          </template>
          <template v-else>
            <div class="filename">
            {{ replayFolder }}{{ loadedFile }}{{ replayFileExtension }}
            </div>
          </template>
          <BngButton
            @click="renaming ? acceptRename() : startRenaming()"
            :icon="renaming ? 'checkmark' : 'edit'"
            :accent="renaming ? ACCENTS.main : ACCENTS.ghost"
          >
          </BngButton>
        </template>
        <template v-else>
          <div class="filename">
            No File loaded
          </div>
        </template>
      </div>

      <!-- Right controls -->
      <div class="right-controls">

        <!-- Record button (when not in playback) -->
        <BngButton
          @click="toggleRecording"
          :icon="state === 'recording' ? 'square' : 'bigDot'"
          :accent="ACCENTS.text"
          :disabled="state === 'playback'"
          :tooltip="state === 'recording' ? 'Save recording' : 'Record new replay'"
          class="recordings-button record-button"
        />
      </div>
    </div>
    <div class="replay-controls-container">
      <div class="replay-controls" :class="{ narrow: layoutState.isReplayControlsNarrow }" ref="replayControlsRef">
        <!-- Play/pause button -->
        <div class="play-controls">
          <BngButton
            @click="togglePlay"
            class="play-button"
            :icon="(state === 'playback' && !paused) ? 'pause' : 'play'"
            :disabled="state === 'recording' || !loadedFile"
            :accent="ACCENTS.ghost"
          />
          <!-- Speed controls -->
          <div class="speed-controls" v-if="state !== 'inactive'">
            <BngButton
              class="speed-button small"
              @click="toggleSpeed(-1)"
              icon="mathMinus"
              :disabled="!loadedFile"
              :accent="ACCENTS.text"
            />
            <div class="playback-speed-display" :class="{ disabled: !loadedFile }">{{ speed.toFixed(2) }}x</div>
            <BngButton
              class="speed-button small"
              @click="toggleSpeed(1)"
              icon="mathPlus"
              :disabled="!loadedFile"
              :accent="ACCENTS.text"
            />
          </div>
        </div>

        <!-- Time display -->
        <div class="time-display" :class="{ active: loadedFile, seeking: isSeeking }">
          <div class="svg-time-container">
            <!-- Outer SVG container -->
            <svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
              <!-- Use a viewBox that matches the text content's natural size -->
              <svg viewBox="0 0 200 50" width="100%" height="100%" overflow="visible">
                <!-- Group with the text, centered -->
                <g transform="translate(100, 25)">
                  <text text-anchor="middle" dominant-baseline="middle" class="time-text" font-size="40" line-height="1">
                    {{ formatTime(positionSeconds) }}
                  </text>
                </g>
              </svg>
            </svg>
          </div>
          <span class="time-display-total">({{ formatTime(totalSeconds) }})</span>
        </div>
      </div>
      <div class="position-slider">
        <BngSlider
          v-model="positionPercent"
          :min="0"
          :max="1"
          :step="0.001"
          @input="seek"
          :disabled="state !== 'playback' || !loadedFile"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick, shallowRef } from 'vue'
import { useEvents } from '@/services/events'
import { lua } from '@/bridge'
import { BngButton, BngInput, BngSlider, ACCENTS } from '@/common/components/base'
import { BngIcon } from '@/common/components/base'

const replayFolder = 'replays/'
const replayFileExtension = '.rpl'

// State variables
const state = ref('inactive')
const speed = ref(1)
const paused = ref(false)
const renaming = ref(false)
const isSeeking = ref(false)
const loadedFile = ref('')
const positionSeconds = ref(0)
const totalSeconds = ref(0)
const positionPercent = ref(0)
const fpsRec = ref(0)
const fpsPlay = ref(0)

// Original filename for renaming
let originalFilename = ''
let lastSeek = 0

const events = useEvents()

const resizeObserver = ref(null)
const replayControlsRef = ref(null)
const containerWidth = shallowRef(0)

const layoutState = computed(() => {
  const width = containerWidth.value
  return {
    isReplayControlsNarrow: width < 301,
    isFileControlsNarrow: width < 361
  }
})

const props = defineProps({
  hideFileControls: {
    type: Boolean,
    default: false
  }
})

// Format time as mm:ss.sss
const formatTime = (seconds) => {
  const date = new Date(seconds * 1000)
  return date.toISOString().substr(14, 8)
}

const debounce = (fn, delay) => {
  let timer = null
  return (...args) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
      timer = null
    }, delay)
  }
}

// Methods
const listRecordings = () => {
  window.bngVue.gotoGameState('menu.replay')
}

const startRenaming = () => {
  renaming.value = true
  originalFilename = loadedFile.value
}

const cancelRename = () => {
  renaming.value = false
  loadedFile.value = originalFilename
}

const acceptRename = () => {
  if (loadedFile.value === originalFilename) {
    cancelRename()
    return
  }

  renaming.value = false
  lua.core_replay.acceptRename(replayFolder + originalFilename + replayFileExtension, replayFolder + loadedFile.value + replayFileExtension)
}

const toggleSpeed = (val) => {
  lua.core_replay.toggleSpeed(val)
}

const togglePlay = () => {
  lua.core_replay.togglePlay()
}

const toggleRecording = () => {
  lua.core_replay.toggleRecording(true)
}

const cancelRecording = () => {
  lua.core_replay.cancelRecording()
}

const stop = () => {
  lua.core_replay.stop()
}

const seek = () => {
  if (state.value !== 'playback') return
  lastSeek = Date.now()
  lua.core_replay.pause(true)
  lua.core_replay.seek(positionPercent.value)
}

// Watch for position changes
watch(positionSeconds, (newVal, oldVal) => {
  const msSinceSeek = Date.now() - lastSeek
  if (msSinceSeek > 500 && totalSeconds.value > 0) {
    positionPercent.value = newVal / totalSeconds.value
  }
})

const setupResizeObserver = () => {
  if (!replayControlsRef.value) return

  let rafId = null

  // Create a debounced update function
  const updateWidth = debounce((width) => {
    containerWidth.value = width
  }, 100) // 100ms debounce

  resizeObserver.value = new ResizeObserver((entries) => {
    // Cancel any pending animation frame
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
    }

    // Use requestAnimationFrame to batch updates
    rafId = requestAnimationFrame(() => {
      for (const entry of entries) {
        // Use the debounced update function
        updateWidth(entry.contentRect.width)
      }
      rafId = null
    })
  })

  resizeObserver.value.observe(replayControlsRef.value)
}

onMounted(async () => {
  // Initialize the replay state
  try {
    lua.core_replay.onInit()
  } catch (e) {
    console.error('Error initializing replay state:', e)
  }

  // Main event listener
  events.on('replayStateChanged', (val) => {
    if (!renaming.value) {
      loadedFile.value = val.loadedFile.replace(replayFolder, '').replace(replayFileExtension, '')
    }

    positionSeconds.value = val.positionSeconds
    totalSeconds.value = val.totalSeconds
    speed.value = val.speed
    paused.value = val.paused
    fpsRec.value = val.fpsRec
    fpsPlay.value = val.fpsPlay
    state.value = val.state
    isSeeking.value = val.jumpOffset !== 0

    const msSinceSeek = Date.now() - lastSeek
    if (msSinceSeek > 500 && totalSeconds.value > 0) {
      positionPercent.value = positionSeconds.value / totalSeconds.value
    } else {
      isSeeking.value = true
    }
  })

  // Wait for DOM to be ready
  await nextTick()
  setupResizeObserver()
})

onUnmounted(() => {
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
    resizeObserver.value = null
  }

  events.off('replayStateChanged')
})
</script>

<style scoped lang="scss">
.replay-app-container {
  width: 100%;
  height: auto;
  max-height: 100%;
  color: rgba(255, 255, 255, 0.9);
  background-color: rgba(var(--bng-cool-gray-900-rgb), 0.6);
  display: flex;
  flex-direction: column;
  font-family: 'Overpass', var(--fnt-defs);
  border-radius: var(--bng-corners-2);

  .file-controls {
    display: grid;
    grid-template-columns: auto 1fr 1fr auto;
    align-items: center;
    --bng-icon-size: 1.25em;

    &.narrow {
      grid-template-columns: 1fr 1fr;
      .filename-container {
        grid-row: 2;
      }
      .right-controls {
        grid-column: 2;
      }
    }

    .left-controls, .right-controls {
      display: flex;
      align-items: center;
    }

    .left-controls {
      grid-column: 1;
    }

    .right-controls {
      grid-column: 4;
      justify-content: flex-end;
    }

    .filename-container {
      grid-column: span 2;
      display: flex;
      flex-flow: row nowrap;
      align-items: center;
      overflow: hidden;
      .cancel-rename-button {
        padding-left: 0.25rem;
        padding-right: 0.25rem;
        :deep(.icon) {
          color: var(--bng-add-red-500);
        }
      }
      .filename {
        flex: 1 1 auto;
        padding: 0 0.5rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }
      .filename-input {
        flex: 1;
        > :deep(.icons-input-wrapper) {
          height: 1.9em;
        }
      }
    }
  }

  .replay-controls-container {
    display: flex;
    flex-flow: column nowrap;
    overflow: hidden;
    overflow-y: auto;
    &::-webkit-scrollbar {
      width: 0.25rem;
      &-track, &-thumb {
        border-radius: calc(var(--bng-corners-1) * 0.5);
      }
    }
  }

  .replay-controls {
    display: grid;
    grid-template-columns: 1fr 4fr 1fr;
    grid-auto-rows: auto;
    position: relative;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;

    &.narrow {
      grid-template-columns: 1fr;
    }

    .play-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-flow: column nowrap;
      .play-button {
        justify-self: center;
        --bng-icon-size: 2.75em;
        padding: 0.125em;
        margin: 0;
      }
      .speed-controls {
        display: flex;
        align-items: center;
        font-size: 0.75em;
        .speed-button {
          --bng-icon-size: 1em;
          flex: 0 0 auto;
        }
        .playback-speed-display {
          flex: 1 5em;
          text-align: center;
          font-family: var(--fnt-mono);
          &.disabled {
            color: lightgrey;
          }
        }
      }
    }

    .time-display {
      flex: 1;
      text-align: center;
      font-family: var(--fnt-mono);
      color: white;
      display: flex;
      flex-flow: column nowrap;
      font-weight: 700;
      align-items: stretch;

      .svg-time-container {
        flex: 0 0 auto;
        width: 100%;
        min-height: 2rem;
        height: min(3rem, 15vw);
        max-height: 5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: visible;
        padding: 0 0.5rem;
      }

      .time-display-total {
        font-size: 0.75em;
        font-weight: 500;
        color: var(--bng-cool-gray-300);
      }
    }
  }

  .position-slider {
    flex: 1;
    padding: 0 16px;
  }

  .record-button {
    :deep(.icon) {
      color: var(--bng-add-red-500);
    }
  }
  .recordings-button {
    &:not(:first-child) {
      margin-left: 0.125rem;
    }
    &:not(:last-child) {
      margin-right: 0.125rem;
    }
  }
}

.time-text {
  font-family: var(--fnt-mono);
  font-weight: 700;
  fill: white;
  paint-order: stroke;
  stroke: rgba(0,0,0,0.2);
  stroke-width: 1px;
}
</style>