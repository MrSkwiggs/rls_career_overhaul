<template>
  <div class="countdown-top">
    <!-- Green rectangle for state 6 (go) -->
    <div v-if="stage === 6" class="countdown-go"></div>

    <!-- Red squares for states 1-5 -->
    <template v-else>
      <div class="countdown-square" :class="{ visible: stage >= 1 }"></div>
      <div class="countdown-square" :class="{ visible: stage >= 2 }"></div>
      <div class="countdown-square" :class="{ visible: stage >= 3 }"></div>
      <div class="countdown-square" :class="{ visible: stage >= 4 }"></div>
      <div class="countdown-square" :class="{ visible: stage >= 5 }"></div>
    </template>
  </div>
  <div class="countdown-bottom">
    <div class="rally-loop-manager-text">
      <span class="time-main">{{ rallyLoopManager }}</span>
      <span v-if="period" class="time-period">{{ period }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  rallyLoopManager: {
    type: String,
    default: '--:--:--'
  },
  period: {
    type: String,
    default: null // 'AM' or 'PM' or null for 24h format
  },
  countdown: {
    type: Number,
    default: 10 // countdown value in seconds
  }
})

// Calculate stage based on countdown value
// > 5: empty (0)
// 5: 1 square (1)
// 4: 2 squares (2)
// 3: 3 squares (3)
// 2: 4 squares (4)
// 1: 5 squares (5)
// <= 0: green GO! (6)
const stage = computed(() => {
  if (props.countdown <= 0) return 6 // GO!
  if (props.countdown > 5) return 0 // empty
  return 6 - props.countdown // 5->1, 4->2, 3->3, 2->4, 1->5
})
</script>

<style scoped lang="scss">
.countdown-top {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--spacing-sm);
  padding-top: var(--spacing-md);
  padding-left: var(--spacing-md);
  padding-right: var(--spacing-md);
  align-items: center;

  .countdown-square {
    aspect-ratio: 1;
    background-color: transparent;
    border: 2px solid rgba(128, 128, 128, 0.3);
    border-radius: 5px;
    box-shadow: none;
    // transition: all 0.15s ease;

    &.visible {
      background-color: var(--color-red);
      border-color: transparent;
      box-shadow: 0 0 15px 3px var(--color-red-alpha-70);
    }
  }

  .countdown-go {
    grid-column: 1 / -1;
    // 5 squares wide + 4 gaps, same height as 1 square
    // Width is 5 units, height should be 1 unit
    aspect-ratio: 5.5 / 1;
    background-color: rgb(0, 255, 0);
    border-radius: 5px;
    box-shadow: 0 0 15px 3px rgba(0, 255, 0, 0.7);
  }
}

.countdown-bottom {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 var(--spacing-md);
  margin-top: 1.0rem;
  margin-bottom: 1.0rem;

  .rally-loop-manager-text {
    font-size: 4.6rem;
    font-weight: bold;
    // color: var(--color-white);
    color: rgb(225, 123, 225);
    text-shadow: 0 0 10px rgba(225, 123, 225, 0.5);
    letter-spacing: 0.05em;
    white-space: nowrap;
    line-height: 0.7;
    display: flex;
    align-items: baseline;
    gap: 0.3rem;

    .time-period {
      font-size: 2.0rem;
      opacity: 0.9;
    }
  }
}
</style>

