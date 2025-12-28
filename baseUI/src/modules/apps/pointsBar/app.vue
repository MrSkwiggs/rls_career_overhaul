<template>
  <div class="main-container-grid">
    <div class="progress-bar-container" :style="{'--threshold-percentage': thresholdPercentages[0] || 0}">
      <div class="points-display">{{ $t(pointsLabel) }}</div>
      <div class="progress-bar"
           :style="{
             width: `${fillPercent * 100}%`,
           }">
      </div>
      <template v-for="i in thresholdIndices" :key="i">
        <div
            class="limit-marker"
            :class="{ 'passed': thresholdsReached[i] }"
            :style="{ left: `${thresholdPercentages[i]}%` }">
          <div class="star-wrapper">
            <BngIcon
              :type="thresholdsReached[i] ? icons.star : icons.starSecondary"
              class="star-icon"
              :class="{ 'passed': thresholdsReached[i] }"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { BngIcon, icons } from "@/common/components/base"
import { useStreams } from '@/services/events'
import { useBridge } from '@/bridge'

const { lua } = useBridge()

// State
const fillPercent = ref(0)
const pointsLabel = ref('0')
const thresholdPercentages = ref([])
const thresholdsReached = ref([])
const thresholdCount = ref(0)

// Computed properties
const thresholdIndices = computed(() => {
  return Array.from({length: thresholdCount.value}, (_, index) => index);
})

// Lifecycle hooks
onMounted(() => {
  lua.extensions.load('ui_apps_pointsBar')
  lua.ui_apps_pointsBar.requestAllData()
})

onUnmounted(() => {})

const streamsList = ['pointsBar']
useStreams(streamsList, (streams) => {
  for (const stream of streamsList) { if (!streams[stream]) { return } }

  fillPercent.value = streams.pointsBar.fillPercent
  pointsLabel.value = streams.pointsBar.pointsLabel

  if (streams.pointsBar.thresholdPercentages && Array.isArray(streams.pointsBar.thresholdPercentages)) {
    thresholdPercentages.value = streams.pointsBar.thresholdPercentages
  }
  if (streams.pointsBar.thresholdsReached && Array.isArray(streams.pointsBar.thresholdsReached)) {
    thresholdsReached.value = streams.pointsBar.thresholdsReached
  }

  thresholdCount.value = streams.pointsBar.thresholdCount
})

</script>

<style scoped lang="scss">
.main-container-grid {
  padding: 0 0;
  color: white;
  font-family: Overpass-mono, var(--fnt-defs);
}

.progress-bar-container {
  // width: 100%;
  height: 1.25rem;
  background-color: rgba(0, 0, 0, 0.35);
  background:
    linear-gradient(
    to right,
    rgba(var(--bng-cool-gray-750-rgb), 0.8) calc(var(--threshold-percentage) * 1% - 0.01px),
    rgba(var(--bng-cool-gray-850-rgb), 0.45) calc(var(--threshold-percentage) * 1%));
  border-radius: 0.625rem;
  position: relative;
  // box-shadow: 0 0 0.25rem rgba(0, 0, 0, 0.25);
  overflow: hidden;
  outline: solid 0.125rem rgba(var(--bng-off-white-rgb), 0.15);
  // box-shadow: inset 0 0 0.125rem rgba(var(--bng-off-white-rgb), 1);
  margin: 0.125rem;
}

.progress-bar {
  height: 100%;
  background-image:
    linear-gradient(
      to left,
      rgba(var(--bng-ter-yellow-100-rgb), 1),
      rgba(var(--bng-ter-yellow-100-rgb), 0) 75px
    ),
    linear-gradient(
      to right,
      rgba(var(--bng-off-black-rgb), 0.1),
      rgba(var(--bng-off-black-rgb), 0.0) 75px
    ),
    // repeating-linear-gradient(
    //   125deg,
    //   oklch(22% 0 0),
    //   oklch(22% 0 0) 10px,
    //   oklch(32% 0 0) 11px,
    //   oklch(32% 0 0) 20px
    // );
    repeating-linear-gradient(
      125deg,
      rgba(var(--bng-off-white-rgb), 0),
      rgba(var(--bng-off-white-rgb), 0) 9px,
      rgba(var(--bng-off-white-rgb), 0.15) 10px,
      rgba(var(--bng-off-white-rgb), 0.15) 19px,
      rgba(var(--bng-off-white-rgb), 0) 20px
    ),
    linear-gradient(
      to right,
      rgba(var(--bng-orange-500-rgb), 1),
      rgba(var(--bng-orange-400-rgb), 1) 100%
    );
  transition: width 0.3s ease;
  will-change: width;
}

.limit-marker {
  position: absolute;
  top: -0.25rem;
  width: 2px;
  height: calc(100% + 0.5rem);
  background-color: var(--bng-off-white);
  transform: translateX(0);
  transition: background-color 0.3s ease;

  &.passed {
    background-color: var(--bng-off-white);
  }
}

.star-wrapper {
  position: absolute;
  right: -1.5rem;
  top: 0.125rem;
  transform: scale(0.7);
  transition: transform 0.3s ease;
}

.star-icon {
  color: white;
  transition: color 0.3s ease;

  &.passed {
    color: var(--bng-off-white);
    animation: starPopup 0.5s ease-out;
  }
}

@keyframes starPopup {
  0% {
    transform: scale(0.7);
  }
  50% {
    transform: scale(1.5);
  }
  100% {
    transform: scale(0.7);
  }
}

.points-display {
  position: absolute;
  left: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  font-family: Overpass-mono, var(--fnt-defs);
  z-index: 1;
  text-shadow: 0 0.0625rem 0.125rem rgba(0, 0, 0, 0.5);
}
</style>