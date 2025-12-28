<template>
  <div class="laptimes-section">
    <h3 @click="toggleCollapse" class="collapsible-header">
      <span class="collapse-icon">{{ isCollapsed ? '▶' : '▼' }}</span>
      Race Info
    </h3>

    <div v-show="!isCollapsed" class="collapsible-content">
      <div class="laptimes-data-grid">
        <div class="data-item" v-if="slowData.status === 'started' || slowData.status === 'paused'">
          <span class="label">Current Time:</span>
          <span class="value">{{ fastData.currentTimeFormatted || '00:00.000' }}</span>
        </div>
        <div class="data-item" v-else>
          <span class="label">Status:</span>
          <span class="value" :class="{ 'active': slowData.status === 'started', 'paused': slowData.status === 'paused' }">
            {{ slowData.status?.toUpperCase() || 'STOPPED' }}
          </span>
        </div>
        <div class="data-item">
          <span class="label">Lap:</span>
          <span class="value">{{ (slowData.currentLap || 0) }}/{{ staticData.totalLaps || 0 }}</span>
        </div>
        <div class="data-item">
          <span class="label">Segment:</span>
          <span class="value">{{ (slowData.currentSegment || 0) }}/{{ staticData.totalSegments || 0 }}</span>
        </div>
        <div class="data-item">
          <span class="label">Current Lap Time:</span>
          <span class="value">{{ fastData.currentLapTimeFormatted || '00:00.000' }}</span>
        </div>
        <div class="data-item">
          <span class="label">Current Segment Time:</span>
          <span class="value">{{ fastData.currentSegmentTimeFormatted || '00:00.000' }}</span>
        </div>
      </div>

      <!-- Current Lap Diffs -->
      <div class="laptimes-data-grid" v-if="fastData.currentLapDiffToBestFormatted || fastData.currentLapDiffToPreviousFormatted" style="margin-top: 1rem;">
        <div class="data-item" v-if="fastData.currentLapDiffToBestFormatted">
          <span class="label">Lap Diff to Best:</span>
          <span class="value" :class="'diff-' + (fastData.currentLapDiffToBestFlavor || 'default')">{{ fastData.currentLapDiffToBestFormatted }}</span>
        </div>
        <div class="data-item" v-if="fastData.currentLapDiffToPreviousFormatted">
          <span class="label">Lap Diff to Previous:</span>
          <span class="value" :class="'diff-' + (fastData.currentLapDiffToPreviousFlavor || 'default')">{{ fastData.currentLapDiffToPreviousFormatted }}</span>
        </div>
      </div>

      <!-- Current Segment Diffs -->
      <div class="laptimes-data-grid" v-if="fastData.currentSegmentDiffToBestFormatted || fastData.currentSegmentDiffToPreviousFormatted" style="margin-top: 1rem;">
        <div class="data-item" v-if="fastData.currentSegmentDiffToBestFormatted">
          <span class="label">Segment Diff to Best:</span>
          <span class="value" :class="'diff-' + (fastData.currentSegmentDiffToBestFlavor || 'default')">{{ fastData.currentSegmentDiffToBestFormatted }}</span>
        </div>
        <div class="data-item" v-if="fastData.currentSegmentDiffToPreviousFormatted">
          <span class="label">Segment Diff to Previous:</span>
          <span class="value" :class="'diff-' + (fastData.currentSegmentDiffToPreviousFlavor || 'default')">{{ fastData.currentSegmentDiffToPreviousFormatted }}</span>
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
  staticData: {
    type: Object,
    required: true
  },
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
