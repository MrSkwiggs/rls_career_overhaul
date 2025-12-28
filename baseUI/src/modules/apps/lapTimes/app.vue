<template>
  <div class="hotlapping-app">
    <!-- Header with lap and segment info -->
    <div class="hotlapping-header" >
      <div class="header-flex">
        <BngSimpleDataDisplay v-if="staticData.totalLaps > 1" class="header-cell" label="Lap" :value="getLapValue()" />
        <BngSimpleDataDisplay v-if="staticData.totalSegments > 1" class="header-cell" label="Split" :value="getSegmentValue()" />
        <BngSimpleDataDisplay
            class="header-cell"
            label="Race Clock"
            :minutes="getTotalRaceTimeMinutes()"
            :seconds="getTotalRaceTimeSeconds()"
            :milliseconds="getTotalRaceTimeMilliseconds()"
          />
      </div>
    </div>

    <!-- Main content area -->
    <div class="hotlapping-content">
      <!-- Current race time -->

      <!-- Times grid (laps or segments) -->
      <div class="times-grid" :class="{ 'single-lap': shouldHideVsPrevBest() }">
        <!-- Header row -->
        <div
          class="grid-header clickable-header"
          :class="{ 'has-toggle': shouldShowToggleIcon() }"
          @click="shouldShowToggleIcon() ? cycleDisplayMode() : null"
        >
          {{ getTableHeaderLabel() }}
        </div>
        <div class="grid-header">Duration</div>
        <div v-if="!shouldHideVsPrevBest()" class="grid-header">Vs prev</div>
        <div class="grid-header">Total</div>

        <!-- Current item (lap or segment) if racing -->
        <template v-if="isRacing() && getCurrentTimeFormatted()">
          <div class="grid-item current-item">{{ getCurrentItemNumber() }}</div>
          <div class="grid-item current-item">{{ getCurrentTimeFormatted() }}</div>
          <div v-if="!shouldHideVsPrevBest()" class="grid-item current-item" :class="getCurrentLapDiffClass()">{{ getCurrentDiff() }}</div>
          <div class="grid-item current-item">{{ getCurrentTotalTime() }}</div>
        </template>

        <!-- Historical items from combined data -->
        <template v-for="item in getFilteredCombinedItems()" :key="getItemKey(item)">
          <div class="grid-item" :class="{ 'best-item left-indicator': item.flavor === 'best', 'is-lap': item.type === 'lap' }">{{ getItemNumber(item) }}</div>
          <div class="grid-item" :class="{ 'best-item': item.flavor === 'best' }">{{ item.durationFormatted }}</div>
          <div v-if="!shouldHideVsPrevBest()" class="grid-item" :class="[{ 'best-item': item.flavor === 'best' }, getDiffClass(item.diffToPreviousFlavor, item.diffToPreviousFormatted)]">{{ item.diffToPreviousFormatted || '' }}</div>
          <div class="grid-item" :class="{ 'best-item': item.flavor === 'best' }">{{ item.endTimeFormatted || '' }}</div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useEvents, useStreams } from '@/services/events'
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { BngIcon } from '@/common/components/base'
import BngSimpleDataDisplay from '@/common/components/appsUtilities/bngSimpleDataDisplay.vue'

const events = useEvents()

// Stream data refs
const fastData = ref({})
const slowData = ref({})
const staticData = ref({})
const placementData = ref({})

// Display mode: 'combined', 'segments', 'laps'
const displayMode = ref('combined')

onMounted(() => {
  // Subscribe to all four lapTimes streams
  useStreams(["lapTimes_fast", "lapTimes_slow", "lapTimes_static", "lapTimes_placement"], (streams) => {
    if (streams.lapTimes_fast) {
      fastData.value = streams.lapTimes_fast
    }
    if (streams.lapTimes_slow) {
      slowData.value = streams.lapTimes_slow
    }
    if (streams.lapTimes_static) {
      staticData.value = streams.lapTimes_static
    }
    if (streams.lapTimes_placement) {
      placementData.value = streams.lapTimes_placement
    }
  })
})

onUnmounted(() => {
  // Cleanup if needed
})

// Helper methods for the template
const getLapInfo = () => {
  const current = slowData.value?.currentLap || 0
  const total = staticData.value?.totalLaps || 0
  return `Lap ${current}/${total}`
}

const getLapValue = () => {
  const current = slowData.value?.currentLap || 0
  const total = staticData.value?.totalLaps || 0
  return `${current}/${total}`
}

const getSegmentInfo = () => {
  const current = slowData.value?.currentSegment || 0
  const total = staticData.value?.totalSegments || 0
  return `Split ${current}/${total}`
}

const getSegmentValue = () => {
  const current = slowData.value?.currentSegment || 0
  const total = staticData.value?.totalSegments || 0
  return `${current}/${total}`
}

const getTotalRaceTime = () => {
  return fastData.value?.currentTimeFormatted || '00:00.000'
}

const parseTimeString = (timeStr) => {
  // Expected format: MM:SS.mmm or SS.mmm
  if (!timeStr) return { minutes: '00', seconds: '00', milliseconds: '000' }

  const parts = timeStr.split(':')
  if (parts.length === 2) {
    // MM:SS.mmm format
    const minutes = parts[0].padStart(2, '0')
    const secondsParts = parts[1].split('.')
    const seconds = secondsParts[0].padStart(2, '0')
    const milliseconds = secondsParts[1] ? secondsParts[1].padEnd(3, '0') : '000'
    return { minutes, seconds, milliseconds }
  } else {
    // SS.mmm format (no minutes)
    const secondsParts = parts[0].split('.')
    const seconds = secondsParts[0].padStart(2, '0')
    const milliseconds = secondsParts[1] ? secondsParts[1].padEnd(3, '0') : '000'
    return { minutes: '00', seconds, milliseconds }
  }
}

const getTotalRaceTimeMinutes = () => {
  const timeStr = getTotalRaceTime()
  return parseTimeString(timeStr).minutes
}

const getTotalRaceTimeSeconds = () => {
  const timeStr = getTotalRaceTime()
  return parseTimeString(timeStr).seconds
}

const getTotalRaceTimeMilliseconds = () => {
  const timeStr = getTotalRaceTime()
  return parseTimeString(timeStr).milliseconds
}


const getBestLapLabel = () => {
  return (slowData.value?.bestLapIndex !== undefined && slowData.value.bestLapIndex !== -1)
    ? `Lap ${slowData.value.bestLapIndex}`
    : 'Best Lap'
}

const getBestLapTime = () => {
  return slowData.value?.bestLapTimeFormatted || '00:00.000'
}

const getBestLapDiff = () => {
  // For the best lap, we typically don't show a diff or show it as baseline
  return ''
}

const getBestLapDiffColor = () => {
  return '#4CAF50' // Green for best
}

const isRacing = () => {
  return slowData.value?.status === 'started' || slowData.value?.status === 'paused'
}

const getCurrentLapDiff = () => {
  return fastData.value?.currentLapDiffToBestFormatted || ''
}

const getCurrentLapDiffClass = () => {
  const flavor = fastData.value?.currentLapDiffToBestFlavor
  if (flavor === 'better') return 'diff-better'
  if (flavor === 'worse') return 'diff-worse'
  return 'diff-neutral'
}

const getDiffClass = (flavor, value) => {
  if (!value || value === '' || value === 'N/A') return 'diff-neutral'
  if (flavor === 'better') return 'diff-better'
  if (flavor === 'worse') return 'diff-worse'
  return 'diff-neutral'
}

// Toggle and display logic
const shouldShowToggleIcon = () => {
  return (staticData.value?.totalLaps || 0) > 1
}

const shouldShowSegmentsByDefault = () => {
  return (staticData.value?.totalLaps || 0) <= 1
}

const isShowingSegments = () => {
  return displayMode.value === 'segments' || (shouldShowSegmentsByDefault() && displayMode.value === 'combined')
}

const cycleDisplayMode = () => {
  if (shouldShowToggleIcon()) {
    const modes = ['combined', 'laps', 'segments']
    const currentIndex = modes.indexOf(displayMode.value)
    displayMode.value = modes[(currentIndex + 1) % modes.length]
  }
}

const getTableHeaderLabel = () => {
  if (displayMode.value === 'combined') return 'Combined'
  if (displayMode.value === 'segments') return 'Split'
  return 'Lap'
}

const shouldHideVsPrevBest = () => {
  return (staticData.value?.totalLaps || 0) <= 1
}

// Current item display methods
const getCurrentTimeFormatted = () => {
  if (displayMode.value === 'segments' || (shouldShowSegmentsByDefault() && displayMode.value === 'combined')) {
    return fastData.value?.currentSegmentTimeFormatted
  }
  return fastData.value?.currentLapTimeFormatted
}

const getCurrentItemNumber = () => {
  if (displayMode.value === 'segments' || (shouldShowSegmentsByDefault() && displayMode.value === 'combined')) {
    const lap = slowData.value?.currentLap || 1
    const segment = slowData.value?.currentSegment || 1
    return `${lap}-${segment}`
  }
  return slowData.value?.currentLap || 1
}

const getCurrentDiff = () => {
  if (displayMode.value === 'segments' || (shouldShowSegmentsByDefault() && displayMode.value === 'combined')) {
    return fastData.value?.currentSegmentDiffToBestFormatted || ''
  }
  return fastData.value?.currentLapDiffToBestFormatted || ''
}

const getCurrentTotalTime = () => {
  return fastData.value?.currentTimeFormatted || ''
}

// Filter combined items based on display mode
const getFilteredCombinedItems = () => {
  if (!slowData.value || !slowData.value.combinedTimes || !Array.isArray(slowData.value.combinedTimes)) {
    return []
  }

  let filtered = []

  if (displayMode.value === 'combined') {
    // Show all items in the combined list
    filtered = [...slowData.value.combinedTimes]
  } else if (displayMode.value === 'laps') {
    // Show only lap items
    filtered = slowData.value.combinedTimes.filter(item => item.type === 'lap')
  } else if (displayMode.value === 'segments') {
    // Show only segment items
    filtered = slowData.value.combinedTimes.filter(item => item.type === 'segment')
  }

  // Return in reverse order (most recent first)
  return filtered.reverse()
}

// Item display helper methods
const getItemKey = (item) => {
  return `${item.type}-${item.identifier}`
}

const getItemNumber = (item) => {
  return item.identifier
}
</script>

<style scoped lang="scss">
.hotlapping-app {
  color: white;
  font-size: 0.875rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: calc(100% - 0.5rem);
  gap: 0.25rem;
  padding: 0.25rem;

  .header-cell {
    padding-bottom: 0.25rem;
    padding-top: 0.25rem;
    flex: 1 1 auto;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    > * {
      justify-content: center;
    }
    :deep(.time-container) {
      justify-content: flex-start;
    }
  }
}

.hotlapping-header {
  width: 100%;
  flex: 0 0 auto;

  .header-flex {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.25rem;
    width: 100%;
  }
}

.hotlapping-content {
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1 1 auto;

  background-color: rgba(var(--bng-off-black-rgb), 0.5);
  border-radius: var(--bng-corners-1);
  .race-time-display {
    display: flex;
    justify-content: center;
  }

  .times-grid {
    display: grid;
    width: 100%;

    gap: 0.25rem;
    padding: 0.25rem 0.5rem;

    // Default layout with 4 columns (item, duration, vs prev best, total)
    &:not(.single-lap) {
      grid-template-columns: 1fr 2fr 2.5fr 2.5fr;
    }

    // Single lap layout with 3 columns (item, duration, total)
    &.single-lap {
      grid-template-columns: 1fr 2fr 2fr;
    }

    .grid-header {
      text-align: center;
      color: white;
      &.clickable-header.has-toggle {
        cursor: pointer;
        transition: background-color 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      }
    }

    .grid-item {
      text-align: center;
      border-left: 2px solid transparent;

      &.current-item {
        font-weight: bold;
      }

      &.best-item {
        //color: #4CAF50;
        font-weight: bold;
      }

      &.diff-better {
        color: #4CAF50;
      }

      &.diff-worse {
        color: #f44336;
      }

      &.diff-neutral {
        color: #ccc;
      }
      &.left-indicator {
        //border-left: 2px solid rgba(#4CAF50, 1);
        position: relative;
        &:before {
          content: '';
          display: block;
          width: 0.2rem;
          height: 0.2rem;
          position: absolute;
          border-radius: 80%;
          top: 50%;
          transform: translateY(-50%);
          inset-inline-start: 0;
          //background-color: rgba(#4CAF50, 1);
          border: 2px solid rgba(#4CAF50, 1);
        }
      }
      &.is-lap:before {
          background-color: #4CAF50;
        }
    }
  }
}

// Custom scrollbar for the content area
.hotlapping-content::-webkit-scrollbar {
  width: 8px;
}

.hotlapping-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.hotlapping-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;

  &:hover {
    background: rgba(255, 255, 255, 0.5);
  }
}

</style>