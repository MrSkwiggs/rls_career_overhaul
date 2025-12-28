<template>
  <div class="laptimes-section">
    <h3 @click="toggleCollapse" class="collapsible-header">
      <span class="collapse-icon">{{ isCollapsed ? '▶' : '▼' }}</span>
      Segment Times
    </h3>

    <div v-show="!isCollapsed" class="collapsible-content">
      <!-- Historical Segment Times Table -->
      <div v-if="(slowData.segmentTimes && slowData.segmentTimes.length > 0) || (slowData.status === 'started' || slowData.status === 'paused')" class="laptimes-table" :class="{ 'single-lap': staticData.totalLaps <= 1 }">
      <div class="table-header">
        <span>Segment</span>
        <span>Time</span>
        <span>Duration</span>
        <span v-if="staticData.totalLaps > 1">Diff to Best</span>
        <span v-if="staticData.totalLaps > 1">Diff to Prev</span>
      </div>



      <!-- Historical Segment Times -->
      <div
        v-for="segment in slowData.segmentTimes"
        :key="segment.segment"
        class="table-row"
        :class="{ 'best-segment': segment.segmentFlavor === 'best', 'current-segment': segment.isCurrent }"
      >
        <span>{{ segment.segment }}</span>
        <span>{{ segment.timeFormatted || segment.endTimeFormatted || 'N/A' }}</span>
        <span>{{ segment.durationFormatted }}</span>
        <span v-if="staticData.totalLaps > 1" :class="getDiffFlavorClass(segment.diffToBestFlavor)">
          {{ segment.diffToBestFormatted || 'N/A' }}
        </span>
        <span v-if="staticData.totalLaps > 1" :class="getDiffFlavorClass(segment.diffToPreviousFlavor)">
          {{ segment.diffToPreviousFormatted || 'N/A' }}
        </span>
      </div>

      <!-- Current Segment Row (when race is started) -->
      <div
        v-if="(slowData.status === 'started' || slowData.status === 'paused') && fastData.currentSegmentTimeFormatted"
        class="table-row current-segment-row"
        >
        <span>{{ slowData.currentLap || 1 }}-{{ slowData.currentSegment || 1 }}</span>
        <span>{{ fastData.currentTimeFormatted }}</span>
        <span>{{ fastData.currentSegmentTimeFormatted }}</span>
        <span v-if="staticData.totalLaps > 1" :class="getDiffFlavorClass(fastData.currentSegmentDiffToBestFlavor)">
          {{ fastData.currentSegmentDiffToBestFormatted || 'N/A' }}
        </span>
        <span v-if="staticData.totalLaps > 1" :class="getDiffFlavorClass(fastData.currentSegmentDiffToPreviousFlavor)">
          {{ fastData.currentSegmentDiffToPreviousFormatted || 'N/A' }}
        </span>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
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
  }
})

// Collapsible state
const isCollapsed = ref(false)
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// Helper function to get CSS class for diff flavors
const getDiffFlavorClass = (flavor) => {
  if (!flavor) return ''
  return {
    'diff-better': flavor === 'better',
    'diff-worse': flavor === 'worse',
    'diff-same': flavor === 'same'
  }
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
