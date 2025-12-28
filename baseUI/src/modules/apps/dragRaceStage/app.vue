<template>
  <div>
    {{ stageDistance }}
  </div>
  <div v-show="isVisible && stageDistance >= -4 && stageDistance <= 4" class="stage-indicator-container">
    <div class="stage-bar">
      <div v-if="isDetailedView" class="segment grey-segment top"></div>
      <div class="middle-section" :class="{
        'align-top': !isDetailedView && stageDistance < -1,
        'align-bottom': !isDetailedView && stageDistance > 1
      }">
        <template v-if="isDetailedView">
          <div class="segment deep-stage" style="height: 20px"></div>
          <div class="segment stage" style="height: 40px"></div>
          <div class="segment pre-stage" style="height: 40px"></div>
        </template>
        <template v-else>
          <div class="segment green-segment" :class="{
            'top': stageDistance < -1,
            'bottom': stageDistance > 1
          }"></div>
        </template>
      </div>
      <div v-if="stageDistance <= 1" class="segment grey-segment bottom"></div>
    </div>

    <div class="distance-indicator" :style="{ top: indicatorPosition + '%' }">
      <div class="indicator-line">
        <div class="car-icon" :class="{ 'car-icon-detailed': isDetailedView }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useLibStore } from '@/services';
import { useEvents } from '@/services/events'

const events = useEvents()
const stageDistance = ref(-100);
const isVisible = ref(true);
let hideTimeout;

const isDetailedView = computed(() => {
  return stageDistance.value > -1 && stageDistance.value < 1;
});

const indicatorPosition = computed(() => {
  // For distances between -1 and 1, use the detailed view scaling (middle 40%)
  if (isDetailedView) {
    // Map -1 to 1 range to 70% to 30% (remember that CSS top percentage goes from top to bottom)
    return 70 - ((stageDistance.value + 1) * 20); // 40% range centered in container
  }

  // For distances less than -1 (approaching from bottom)
  if (stageDistance.value < -1) {
    // Map -4 to -1 range to 100% to 70%
    return 10 - ((stageDistance.value)); // 30% range in bottom section
  }

  // For distances greater than 1 (approaching from top)
  // Map 1 to 4 range to 30% to 0%
  return 30 - ((stageDistance.value - 1) * (30/3)); // 30% range in top section
});

let lastUpdate = 0;
const THROTTLE_MS = 1;
const HIDE_DELAY_MS = 5000;  // 5 seconds

function updateStageApp(distance) {
  const now = performance.now();
  if (now - lastUpdate < THROTTLE_MS) return;

  if (stageDistance.value !== distance) {
    stageDistance.value = distance;
    lastUpdate = now;
    isVisible.value = true;

    // Clear existing timeout and set a new one
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      isVisible.value = false;
    }, HIDE_DELAY_MS);
  }
}

onMounted(() => {
  events.on('updateStageApp', updateStageApp);
});

onUnmounted(() => {
  lastUpdate = 0;
  clearTimeout(hideTimeout);
  events.off('updateStageApp', updateStageApp);
});
</script>

<style scoped lang="scss">

.stage-indicator-container {
  position: relative;
  width: 100%;
  height: 90%;
  background: black;
  border-top-right-radius: 2rem;
  border-bottom-right-radius: 2rem;
}

.stage-bar {
  display: flex;
  flex-direction: column;
  height: 90%;
  width: 40%;
  padding: 10% 10% 10% 10%;

  .grey-segment {
    background: #333333;  // Darker grey to match image
    &.top {
      border-radius: var(--bng-corners-1);
    }

    &.bottom {
      border-radius: var(--bng-corners-1);
    }
  }

  .middle-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: #333333;  // Darker grey to match image
    border-radius: var(--bng-corners-1);
    position: relative;
    &.align-top {
      justify-content: flex-start;
    }

    &.align-bottom {
      justify-content: flex-end;
    }

    .segment {
      height: 30px;

      &.green-segment {
        background: #FFA500;
      }

      &.deep-stage {
        background: red;  // Changed to red to match image
      }

      &.stage {
        background: #32CD32;  // Green
      }

      &.pre-stage {
        background: #FFA500;  // Orange

      }
    }
  }
}

.distance-indicator {
  position: absolute;
  width: 100%;
  transition: top 0.1s ease-out;
  pointer-events: none;
  transform: translateZ(0);
  will-change: top;
  padding-right: 30%;
  padding-left: 10%;
  box-sizing: border-box;
}

.indicator-line {
  position: relative;
  width: 100%;
  height: 0.25rem;
  background: white;
}

</style>