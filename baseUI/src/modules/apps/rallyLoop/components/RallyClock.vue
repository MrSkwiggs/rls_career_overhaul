<template>
  <div class="rally-clock">
    <div class="clock-row">
      <span class="clock-label">Rally Clock</span>
      <span class="clock-value rally-clock-value">
        {{ formattedWallClock.time }}<span v-if="formattedWallClock.period" class="period">{{ formattedWallClock.period }}</span>
      </span>
    </div>
    <div class="clock-row">
      <span class="clock-label">Total SS Time</span>
      <span class="clock-value">{{ formattedSSTime }}</span>
    </div>
    <div class="clock-row">
      <span class="clock-label">Total Penalty</span>
      <span class="clock-value penalty-value">{{ formattedPenalty }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatWallClock, formatSSTime, formatPenalty } from '../utils/timeFormatters'

const props = defineProps({
  wallClockSecs: {
    type: Number,
    default: null
  },
  day: {
    type: Number,
    default: 1
  },
  totalSSTime: {
    type: Number,
    default: 0
  },
  totalPenalty: {
    type: Number,
    default: 0
  },
  use24hFormat: {
    type: Boolean,
    default: true
  },
  activeState: {
    type: String,
    required: true
  }
})

// Computed formatters
const formattedWallClock = computed(() => {
  return formatWallClock(props.wallClockSecs, props.day, props.use24hFormat, props.activeState)
})

const formattedSSTime = computed(() => {
  return formatSSTime(props.totalSSTime, props.activeState)
})

const formattedPenalty = computed(() => {
  return formatPenalty(props.totalPenalty, props.activeState)
})
</script>

<style lang="scss" scoped>
.rally-clock {
  padding: 0.25rem 0.75rem 0.25rem 0.75rem;
  border-bottom: 4px solid var(--color-theme-alpha-80);

  // CSS Variables (inherited from parent)
  // --color-theme: #ff8400;
  // --color-theme-alpha-80: color-mix(in srgb, var(--color-theme) 80%, transparent);
  // --color-white: rgba(255, 255, 255, 1);
  // --color-red-light: #ff6666;
  // --spacing-xs: 0.25rem;
  // --spacing-md: 0.75rem;
  // --border-thin: 1px;
  // --border-thick: 4px;
  // --font-sm: 1rem;
  // --font-md: 1.2rem;
  // --font-xxl: 2.0rem;

  .clock-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: var(--spacing-xs);
    padding-bottom: var(--spacing-xs);
    border-bottom: var(--border-thin) solid var(--color-theme-alpha-80);
    font-size: var(--font-sm);

    &:last-child {
      margin-bottom: 0;
      border-bottom: none;
    }

    .clock-label {
      font-style: italic;
      font-weight: bold;
      color: var(--color-theme);
      font-size: var(--font-md);
    }

    .clock-value {
      font-family: monospace;
      color: var(--color-white);
      font-size: var(--font-xxl);

      .period {
        padding-left: 0.25em;
        font-size: 0.6em;
      }
    }

    .rally-clock-value {
      color: var(--color-white);
    }

    .penalty-value {
      color: var(--color-red-light);
    }
  }
}
</style>

