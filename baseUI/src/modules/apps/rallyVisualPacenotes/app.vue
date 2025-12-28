<template>
  <div class="pacenotes-app">
    <div class="notes-container">
      <div class="spacer"></div>
      <PaceNote
        v-for="(slot, index) in firstFourFromQueue"
        :key="getNoteKey(slot, index)"
        :class="{
          'pacenote-initial': !slot?.hasAnimated,
          [`position-${index}`]: true,
          'fade-out': slot && slot.isFading,
          'fade-in': slot && slot.isVisible && !slot.isFading && !slot.hasAnimated,
          'hidden': !slot || (!slot.isVisible && !slot.isFading),
          'current': slot && slot.isCurrent
        }"
        :note="getNoteWithSize(slot)"
        @animationend="onAnimationEnd(index)"
      />
    </div>

    <!-- DEV-only testing controls -->
    <div v-if="!disableDevToolsOverride && (devEnv.env || devEnv.vue)" class="dev-controls">
      <BngButton class="dbg-button" @click="testAddSequence" :accent="ACCENTS.text">Add Sequence</BngButton>
      <BngButton class="dbg-button" @click="testClearOne" :accent="ACCENTS.success">Clear One</BngButton>
      <BngButton class="dbg-button" @click="testClearAll" :accent="ACCENTS.attention">Clear All</BngButton>

      <div class="size-control">
        <span class="label">Note Size</span>
        <BngSlider
          ref="noteSizeSlider"
          :min="0.5"
          :max="3"
          :step="0.1"
          v-model="noteSize"
          @valueChanged="onSizeChanged"
        />
        <span>{{ noteSize.toFixed(1) }}</span>
        <BngButton
          :disabled="noteSize === DEFAULT_NOTE_SIZE"
          @click="resetNoteSize"
        >
          Reset
        </BngButton>
      </div>

      <div class="state-display">
        <pre>Queue: {{ incomingQueue.length }}</pre>
        <!-- <pre>Pacenotes Queue: {{ pacenotesQueue.map(p => `${p.pacenoteName}(${p.visualPacenotes.length})`).join(", ") }}</pre> -->
        <pre>Slots: {{ debugSlots }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, computed, nextTick } from 'vue'
import { useBridge } from "@/bridge"
import { useEvents } from '@/services/events'
import PaceNote from './components/PaceNote.vue'
import { BngButton, BngSlider, ACCENTS, BngIcon, icons } from "@/common/components/base"

// Constants
// const FADE_DURATION = 500 // the original value
const FADE_DURATION = 250
const TOTAL_SLOTS = 4
const DEFAULT_NOTE_SIZE = 1.8

// State Management
const incomingQueue = ref([])
const noteSize = ref(DEFAULT_NOTE_SIZE)

// Event handling
const events = useEvents()
const { lua } = useBridge()

const devEnv = reactive({
  env: window.beamng && !window.beamng.shipping,
  vue: process.env.NODE_ENV === "development"
})

const disableDevToolsOverride = true
// const disableDevToolsOverride = false

// Add debugSlots computed property
const debugSlots = computed(() =>
  incomingQueue.value.map(slot =>
    slot ? `id=${slot.note.id} pnId=${slot.pacenoteId} ts=${slot.serialNo} type=${slot.note.type} isFading=${slot.isFading} isCurrent=${slot.isCurrent}` : null
  )
)

// Add this computed property
const firstFourFromQueue = computed(() => {
  // Return the first 4 items from the queue, pad with null if less than 4 items
  const result = [...incomingQueue.value.slice(0, TOTAL_SLOTS)]
  while (result.length < 4) {
    result.push({id: -1, type: 'empty'})
  }
  return result
})

// Helper functions for template
function getNoteKey(slot, index) {
  if (!slot || !slot.note) return `empty-${index}`
  return `${slot.note.id}-${index}`
}

function getNoteWithSize(slot) {
  if (!slot || !slot.note) {
    return { type: 'empty', size: noteSize.value }
  }
  return { ...slot.note, size: noteSize.value }
}

let mockNoteCounter = 0

// Mock data with more properties
const mockNotes = [
  {
    id: 'q1',
    pnId: '1',
    type: 'turn3',
    isLeft: false,
    turnTypeValue: '3',
    distance: '140',
    background: {
      color: 'var(--bng-ter-yellow-300)',
      strokeColor: 'var(--bng-ter-yellow-200)',
      opacity: 0.8
    }
  },
  {
    id: 'q2',
    pnId: '2',
    type: 'turnHp',
    isLeft: true,
    isInto: true,
    background: {
      color: 'var(--bng-add-red-500)',
      strokeColor: 'var(--bng-add-red-400)',
      opacity: 0.8
    },
    additionalNote: {
      icon: 'scissorsSlashed',
      color: 'var(--bng-add-red-400)'
    }
  },
  {
    id: 'q3',
    pnId: '2',
    type: 'jumpOverBump',
    isLeft: false,
    turnModifier: 'mathLessThan',
    additionalNote: {
      icon: 'circleSlashed',
      color: 'var(--bng-ter-yellow-100)'
    }
  },
  {
    id: 'q4',
    pnId: '3',
    type: 'turn6',
    isLeft: true,
    turnTypeValue: '6',
    distance: '140',
    background: {
      color: 'var(--bng-ter-yellow-300)',
      strokeColor: 'var(--bng-ter-yellow-200)',
      opacity: 0.8
    }
  },
  {
    id: 'q5',
    pnId: '3',
    type: 'rocks',
    isLeft: true,
    distance: '50',
  }
]

function updateCurrent() {
  // Find the pacenote ID at the start of the queue
  if (incomingQueue.value.length === 0) return;

  // Compact away nulls from the queue
  incomingQueue.value = incomingQueue.value.filter(item => item !== null);

  // If queue is still empty after compacting, return early
  if (incomingQueue.value.length === 0) return;

  const firstPacenoteId = incomingQueue.value[0].pacenoteId;

  // Set all slots with matching pacenote ID to current, others to not current
  incomingQueue.value.forEach(slot => {
    if (slot && !slot.isFading) {
      slot.isCurrent = (slot.pacenoteId === firstPacenoteId);
    }
  });

  // console.log(`Updated current notes for pacenote ID: ${firstPacenoteId}`);
}

// Core Queue Management with validation
function addToQueue(newItems, serialNo) {
  try {
    const itemsToAdd = Array.isArray(newItems) ? newItems : [newItems]

    itemsToAdd.forEach(note => {

      if (!note.id || !note.type) {
        console.warn('Invalid note format:', JSON.stringify(note, null, 2))
        return
      }

      // Check for duplicate IDs in active slots
      // const isDuplicate = noteSlots.value.some(function(slot) {
      //   return slot && slot.note && slot.note.id === note.id && !slot.isFading
      // })

      // if (isDuplicate) {
      //   console.warn('Duplicate note ID:', note.id)
      //   return
      // }

      const val = {
        note: note,
        isVisible: true,
        isFading: false,
        isCurrent: false,
        pacenoteId: note.pnId,
        serialNo: serialNo
      }

      incomingQueue.value.push(val)
    })

    updateCurrent()
  } catch (error) {
    console.error('Error adding to queue:', error)
  }
}

// Lua Integration
onMounted(() => {
  if (lua.pacenotes && lua.pacenotes.onPaceNotesAppMounted) {
    lua.pacenotes.onPaceNotesAppMounted()
  }

  events.on('showVisualPacenote2', (pacenoteEvent) => {
    // console.log(JSON.stringify(pacenoteEvent, null, 2))
    const serialNo = pacenoteEvent.serialNo
    const notes = pacenoteEvent.visualPacenotes
    addToQueue(notes, serialNo)
  })

  events.on('clearOneVisualPacenote', (serialNo) => {
    // console.log('clearOneVisualPacenote', JSON.stringify(serialNo, null, 2))
    clearOne(serialNo)
  })

  events.on('clearAllVisualPacenotes', () => {
    // console.log('clearAllVisualPacenotes')
    clearAll()
  })

  // console.log('RallyVisualPacenotes app mounted')
})

onUnmounted(() => {
  if (lua.pacenotes && lua.pacenotes.onPaceNotesAppUnmounted) {
    lua.pacenotes.onPaceNotesAppUnmounted()
  }
})

const testAddSequence = () => {
  console.log('Adding sequence...')
  let fakeSerialNo = 666
  let lastPnid = 0
  mockNotes.forEach(note => {
    if (note.pnId !== lastPnid) {
      fakeSerialNo++
      lastPnid = note.pnId
    }
    addToQueue(note, fakeSerialNo)
  })
  console.log('Current queue:', incomingQueue.value)
}

const clearAll = () => {
  // console.log('Clearing all notes...')
  incomingQueue.value = []
}

const clearOne = (serialNo) => {
  // console.log(`Clearing notes up to serialNo: ${serialNo}`)

  let fadeCount = 0
  let fadeExpected = 0

  incomingQueue.value.forEach((item, index) => {
    if (item.serialNo <= serialNo) {
      item.isFading = true
      item.isVisible = false
      item.isCurrent = false
      fadeExpected++
    }

    setTimeout(() => {
      if (item && item.isFading) {
        incomingQueue.value[index] = null
        fadeCount++
        if (fadeCount === fadeExpected) {
          updateCurrent()
        }
      }
    }, FADE_DURATION)
  })
}

const testClearAll = () => {
  clearAll()
}

const testClearOne = () => {
  const serialNo = incomingQueue.value[0].serialNo
  clearOne(serialNo)
}

// Only expose to window in dev environment
if (devEnv.env || devEnv.vue) {
  window.testPaceNotes = {
    addSequence: testAddSequence,
    clearAll: testClearAll,
    clearOne: testClearOne,
    getState: () => ({
      queue: incomingQueue.value,
      slots: debugSlots.value
    })
  }
}

// Add animation end handler
function onAnimationEnd(index) {
  // console.log('Animation ended for slot:', index)
  const slot = incomingQueue.value[index]
  if (slot && slot.isVisible && !slot.isFading) {
    slot.hasAnimated = true
  }
}

// Note Size Slider, make it appear only in UI-apps Edit mode
const noteSizeSlider = ref(null)

function onSizeChanged(value) {
  // console.log('Size changed:', value)
  noteSize.value = value
}

function resetNoteSize() {
  noteSize.value = DEFAULT_NOTE_SIZE
}

</script>

<style lang="scss" scoped>
.pacenotes-app {
  // disabling these seems to let the UI app sit inside the UI layout stuff.
  // position: fixed;
  // top: 30%;
  // left: 50%;
  // transform: translate(-50%, -50%);
  // z-index: 100;
  pointer-events: none;
  // width: 96rem;
  height: 16rem;
  --color-distance: var(--bng-off-white);

  .notes-container {
    $rem: calc(16px * v-bind('noteSize'));
    display: grid;
    grid-template-columns: calc($rem * 3 * 4.5) repeat(4, calc($rem * 4.5));
    grid-template-rows: 1fr;
    grid-auto-rows: 0;
    grid-auto-columns: 0;
    gap: 0;
    align-items: stretch;
    justify-content: center;
    min-height: 0;
    overflow: hidden;
    width: 100%;
    height: 100%;

    .spacer {
      grid-column: 1;
      background: transparent;
    }

    .pacenote-initial {
      opacity: 0;
      transform: scale(0.4);
    }

    .pacenote {
      opacity: 1;
      transform: scale(0.8) translateX(0);
    }

    .fade-in {
      animation: noteEnter 0.2s ease-out forwards;
    }

    .current {
      opacity: 1;
      animation: noteCurrent 0.2s ease-out forwards;
    }

    .fade-out {
      animation: noteExit 0.4s ease-out forwards;
    }

    .hidden {
      opacity: 0;
      transform: scale(0.6) translateX(-100%);
      pointer-events: none;
    }
  }
}

@keyframes noteEnter {
  0% {
    opacity: 0;
    transform: scale(0.25) translateX(50%);
  }
  100% {
    opacity: 1;
    transform: scale(0.8) translateX(0);
  }
}

@keyframes noteCurrent {
  0% {
    transform: scale(0.8) translateX(0);
  }
  100% {
    transform: scale(1) translateX(0);
  }
}

@keyframes noteExit {
  0% {
    opacity: 1;
    transform: scale(1) translateX(0);
  }
  75% {
    opacity: 0.25;
    transform: scale(0.8) translateX(-50%);
  }
  100% {
    opacity: 0;
    transform: scale(0.6) translateX(-100%);
  }
}

// Position classes for transitions
@for $i from 0 through 3 {
  .position-#{$i} {
    grid-column: #{$i + 2}; // Start after spacer
    grid-row: 1;
    transition: all 0.3s ease-in-out;
  }
}

.dev-controls {
  position: relative;
  width: 64rem;
  bottom: 2rem;
  margin-left: auto;
  margin-right: auto;
  // left: 50%;
  // transform: translateX(-50%);
  display: grid;
  // display: none;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
  flex-direction: column;
  align-items: center;
  background: rgba(0, 0, 0, 0.8);
  padding: 1rem;
  border-radius: 0.5rem;
  pointer-events: auto;
  .dbg-button {
    grid-column: span 1;
    grid-row: 1;
  }

  .size-control {
    display: flex;
    gap: 0.5rem;
    grid-column: span 5;
    grid-row: 2;
    align-items: center;
    margin-top: 1rem;

    .label {
      color: var(--bng-cool-gray-100);
    }
  }

  .state-display {
    grid-column: span 5;
    grid-row: 3;
    color: white;
    font-family: monospace;
    margin-top: 0.5rem;
    font-size: 0.75em;
  }
}
</style>