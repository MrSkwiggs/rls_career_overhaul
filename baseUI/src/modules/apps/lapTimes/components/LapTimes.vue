<template>
  <div class="laptimes-section">
    <h3 @click="toggleCollapse" class="collapsible-header">
      <span class="collapse-icon">{{ isCollapsed ? '▶' : '▼' }}</span>
      Lap Times
    </h3>
    <div v-show="!isCollapsed" class="collapsible-content">
      <!-- Historical Lap Times Table -->
      <div v-if="(slowData.lapTimes && slowData.lapTimes.length > 0) || (slowData.status === 'started' || slowData.status === 'paused')" class="laptimes-table" :class="{ 'single-lap': staticData.totalLaps <= 1 }">
      <div class="table-header">
        <span>Lap</span>
        <span>Time</span>
        <span>Duration</span>
        <span v-if="staticData.totalLaps > 1">Diff to Best</span>
        <span v-if="staticData.totalLaps > 1">Diff to Prev</span>
      </div>


      <!-- Historical Lap Times -->
      <div
        v-for="lap in slowData.lapTimes"
        :key="lap.lap"
        class="table-row"
        :class="{ 'best-lap': lap.lapFlavor === 'best', 'current-lap': lap.isCurrent }"
      >
        <span>{{ lap.lap }}</span>
        <span>{{ lap.timeFormatted || lap.endTimeFormatted || 'N/A' }}</span>
        <span>{{ lap.durationFormatted }}</span>
        <span v-if="staticData.totalLaps > 1" :class="getDiffFlavorClass(lap.diffToBestFlavor)">
          {{ lap.diffToBestFormatted || 'N/A' }}
        </span>
        <span v-if="staticData.totalLaps > 1" :class="getDiffFlavorClass(lap.diffToPreviousFlavor)">
          {{ lap.diffToPreviousFormatted || 'N/A' }}
        </span>
      </div>

      <!-- Current Lap Row (when race is started) -->
      <div
        v-if="(slowData.status === 'started' || slowData.status === 'paused') && fastData.currentLapTimeFormatted"
        class="table-row current-lap-row"
      >
        <span>{{ slowData.currentLap || 1 }}</span>
        <span>{{ fastData.currentTimeFormatted }}</span>
        <span>{{ fastData.currentLapTimeFormatted }}</span>
        <span v-if="staticData.totalLaps > 1" :class="getDiffFlavorClass(fastData.currentLapDiffToBestFlavor)">
          {{ fastData.currentLapDiffToBestFormatted || 'N/A' }}
        </span>
        <span v-if="staticData.totalLaps > 1" :class="getDiffFlavorClass(fastData.currentLapDiffToPreviousFlavor)">
          {{ fastData.currentLapDiffToPreviousFormatted || 'N/A' }}
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
