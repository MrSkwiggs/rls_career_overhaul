<template>
  <div class="laptimes-section">
    <h3 @click="toggleCollapse" class="collapsible-header">
      <span class="collapse-icon">{{ isCollapsed ? '▶' : '▼' }}</span>
      Best Times
    </h3>

    <div v-show="!isCollapsed" class="collapsible-content">
      <!-- Best Lap -->
      <div class="laptimes-data-grid" style="margin-bottom: 1rem;">
        <div class="data-item">
          <span class="label">Best Lap:</span>
          <span class="value">{{ getBestLapDisplay() }}</span>
        </div>
      </div>

      <!-- Best Segment Times -->
      <div class="laptimes-data-grid" v-if="slowData.bestSegmentTimesFormatted && Object.keys(slowData.bestSegmentTimesFormatted).length > 0">
        <div class="data-item" v-for="(segmentData, segment) in slowData.bestSegmentTimesFormatted" :key="segment">
          <span class="label">Best Segment {{ parseInt(segment) + 1 }}:</span>
          <span class="value">{{ getBestSegmentDisplayFromData(segmentData) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  slowData: {
    type: Object,
    required: true
  }
})

// Collapsible state
const isCollapsed = ref(false)
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// Helper function to format best lap display
const getBestLapDisplay = () => {
  const bestTime = props.slowData.bestLapTimeFormatted || 'N/A'
  const bestIndex = props.slowData.bestLapIndex !== -1 ? props.slowData.bestLapIndex : null

  if (bestTime === 'N/A' || bestIndex === null) {
    return 'N/A'
  }

  return `${bestTime} in Lap ${bestIndex}`
}

// Helper function to format best segment display with lap information from backend data
const getBestSegmentDisplayFromData = (segmentData) => {
  if (!segmentData || typeof segmentData !== 'object') {
    return 'N/A'
  }

  const time = segmentData.time || 'N/A'
  const lap = segmentData.lap

  if (lap) {
    return `${time} in Lap ${lap}`
  }

  return time
}
</script>

<style scoped lang="scss">
@use "../common.scss";

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
