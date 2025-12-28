<template>
  <div class="laptimes-section" v-if="placementData.placements && Object.keys(placementData.placements).length > 1">
    <h3 @click="toggleCollapse" class="collapsible-header">
      <span class="collapse-icon">{{ isCollapsed ? '▶' : '▼' }}</span>
      Race Positions
    </h3>

    <div v-show="!isCollapsed" class="collapsible-content">

    <!-- Player's Current Placement -->
    <div class="laptimes-data-grid" style="margin-bottom: 1rem;">
      <div class="data-item">
        <span class="label">Your Position:</span>
        <span class="value">{{ playerPlacement || 'N/A' }}</span>
      </div>
      <div class="data-item">
        <span class="label">Total Racers:</span>
        <span class="value">{{ totalRacers }}</span>
      </div>
    </div>

    <!-- Race Positions Table -->
    <div class="laptimes-table">
      <div class="table-header">
        <span>Pos</span>
        <span>Vehicle</span>
        <span v-if="shouldShowLapColumn">Lap</span>
        <span v-if="shouldShowSegmentColumn">Segment</span>
        <span>Time Diff</span>
      </div>
      <div
        v-for="(racer, index) in sortedRacers"
        :key="racer.vehicleId"
        class="table-row"
        :class="{ 'player-row': racer.isPlayer, 'leader-row': index === 0 }"
      >
        <span>{{ racer.placement }}</span>
        <span>{{ racer.vehicleId === playerVehicleId ? 'You' : `Vehicle ${racer.vehicleId}` }}</span>
        <span v-if="shouldShowLapColumn">{{ racer.currentLap || 0 }}</span>
        <span v-if="shouldShowSegmentColumn">{{ racer.currentSegment || 0 }}</span>
        <span :class="getTimeDiffClass(racer.timeDiff)">
          {{ racer.timeDiffFormatted }}
        </span>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  fastData: {
    type: Object,
    required: true
  },
  slowData: {
    type: Object,
    required: true
  },
  staticData: {
    type: Object,
    required: true
  },
  placementData: {
    type: Object,
    required: true
  }
})

// Collapsible state
const isCollapsed = ref(false)
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// Get player vehicle ID (assuming it's the first vehicle or we can determine it)
const playerVehicleId = computed(() => {
  // Try to get player vehicle ID from the data
  if (props.placementData.vehicleStates) {
    const vehicleIds = Object.keys(props.placementData.vehicleStates)
    return vehicleIds.length > 0 ? parseInt(vehicleIds[0]) : null
  }
  return null
})

// Get player's current placement
const playerPlacement = computed(() => {
  if (!playerVehicleId.value || !props.placementData.placements) return null
  return props.placementData.placements[playerVehicleId.value]
})

// Get total number of racers
const totalRacers = computed(() => {
  return props.placementData.placements ? Object.keys(props.placementData.placements).length : 0
})

// Determine if we should show lap column
const shouldShowLapColumn = computed(() => {
  if (!props.staticData.pathConfig) return false

  const pathConfig = props.staticData.pathConfig
  // Show lap column if path is closed AND has more than 1 lap
  return pathConfig.isClosed && pathConfig.lapCount > 1
})

// Determine if we should show segment column
const shouldShowSegmentColumn = computed(() => {
  if (!props.staticData.pathConfig) return false

  const pathConfig = props.staticData.pathConfig
  // Show segment column if path is open OR (path is closed AND has more than 1 lap)
  return !pathConfig.isClosed || (pathConfig.isClosed && pathConfig.lapCount > 1)
})

// Create sorted racers array with all necessary data
const sortedRacers = computed(() => {
  if (!props.placementData.placements || !props.placementData.vehicleStates) return []

  const racers = []

  // Create racer objects with all data
  Object.entries(props.placementData.placements).forEach(([vehicleId, placement]) => {
    const vehicleIdNum = parseInt(vehicleId)
    const vehicleState = props.placementData.vehicleStates[vehicleId]

    // Get time difference from the new data structure
    const timeDiffData = props.placementData.timeDifferencesToFirst?.[vehicleId]
    const timeDiff = timeDiffData?.timeDifference || 0

    racers.push({
      vehicleId: vehicleIdNum,
      placement: placement,
      currentLap: vehicleState?.currentLap || 0,
      currentSegment: vehicleState?.currentSegment || 0,
      isPlayer: vehicleIdNum === playerVehicleId.value,
      timeDiff: timeDiff,
      timeDiffFormatted: timeDiffData?.timeDifferenceFormatted || '0.000'
    })
  })

  // Sort by placement (1st, 2nd, 3rd, etc.)
  return racers.sort((a, b) => a.placement - b.placement)
})

// Note: Time differences are now calculated and formatted in the race system
// and passed through the placementData.timeDifferencesToFirst structure

// Get CSS class for time difference color
const getTimeDiffClass = (timeDiff) => {
  if (timeDiff === null || timeDiff === undefined) return ''

  return {
    'diff-red': timeDiff > 0, // Behind first place (bad)
    'diff-green': timeDiff < 0, // Ahead of first place (good, but shouldn't happen)
    'diff-neutral': timeDiff === 0 // Tied with first place
  }
}
</script>

<style scoped lang="scss">
@use "../common.scss";

.player-row {
  background: rgba(33, 150, 243, 0.2) !important;
  color: #2196F3 !important;

  span {
    background: rgba(33, 150, 243, 0.2) !important;
    color: #2196F3 !important;
  }
}

.leader-row {
  background: rgba(255, 215, 0, 0.2) !important;
  color: #FFD700 !important;

  span {
    background: rgba(255, 215, 0, 0.2) !important;
    color: #FFD700 !important;
  }
}

// Time difference color classes
.diff-red {
  color: #f44336 !important; // Red for behind first place
}

.diff-green {
  color: #4caf50 !important; // Green for ahead of first place
}

.diff-neutral {
  color: #ffffff !important; // White for tied with first place
}

.collapsible-header {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;

  &:hover {
    opacity: 0.8;
  }
}

.collapse-icon {
  margin-right: 0.5rem;
  font-size: 0.8rem;
  transition: transform 0.2s ease;
}

.collapsible-content {
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
