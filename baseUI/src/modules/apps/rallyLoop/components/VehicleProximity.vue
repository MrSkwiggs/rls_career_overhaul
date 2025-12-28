<template>
  <div class="vehicle-proximity">
    <div class="top-row">
      <div class="proximity-status">
        <div class="proximity-status-badge" :class="[stage, { 'has-label': hasLabel }]">
          <template v-if="stage === 'stop'">STOP</template>
          <template v-else-if="stage === 'goback'">BACK</template>
          <template v-else-if="stage === 'slow'">SLOW</template>
          <template v-else-if="stage === 'staged'">STAGED</template>
          <template v-else-if="stage === 'approaching'">{{ badgeText }}</template>
        </div>
      </div>
      <div class="proximity-distance" :class="{ dimmed: distanceDimmed }">
        {{ formattedDistance }}
      </div>
    </div>
    <div v-if="instruction?.text" class="instruction-row" :class="instruction?.type || 'notice'">
      {{ instruction?.text }}
    </div>
    <div v-if="instruction2?.structuredText" class="instruction-row" :class="[instruction2?.type || 'notice', { 'flash': instruction2?.flash }]">
      <template v-for="item in instruction2?.structuredText" :key="item.id">
        <span v-if="item.type === 'clock'" :class="item.class">{{ item.val }}</span>
        <span v-else-if="item.type === 'penalty'" :class="item.class">{{ item.val }}</span>
        <span v-else>{{ item }}</span>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  vehicleProximity: {
    type: Object,
    required: true
  },
  stage: {
    type: String,
    required: true
  },
  precision: {
    type: Number,
    default: 0,
    validator: (value) => value >= 0 && value <= 2
  },
  badgeText: {
    type: String,
    default: ''
  },
  instruction: {
    type: Object,
    required: false,
    default: () => ({ text: '', type: 'notice' }),
    validator: (value) => {
      if (!value) return true // Allow null/undefined to fall back to default
      return typeof value.text === 'string' && ['alert', 'alert-sm', 'notice'].includes(value.type)
    }
  },
  instruction2: {
    type: Object,
    required: false,
    default: () => ({ structuredText: null }),
  }
})

// Compute whether distance should be dimmed
const distanceDimmed = computed(() => {
  return props.stage === 'stop' || props.stage === 'staged'
})

// Compute whether badge should have label styling
const hasLabel = computed(() => {
  return props.stage === 'approaching' && props.badgeText
})

// Format distance
const formattedDistance = computed(() => {
  const dist = props.vehicleProximity.distance

  // Show km for large distances
  if (Math.abs(dist) > 200) {
    return `${(dist / 1000).toFixed(2)}km`
  }

  // Use floor for negative distances only
  if (dist < 0) {
    const multiplier = Math.pow(10, props.precision)
    const flooredDist = Math.floor(dist * multiplier) / multiplier
    // Avoid showing -0, -0.0, -0.00, etc.
    const finalDist = flooredDist === 0 ? 0 : flooredDist
    return `${finalDist.toFixed(props.precision)}m`
  }

  // Use normal rounding for positive distances
  return `${dist.toFixed(props.precision)}m`
})
</script>

<style lang="scss" scoped>
.vehicle-proximity {
  display: flex;
  flex-direction: column;
  padding-bottom: 0.8rem;
  padding-top: 0.8rem;
  padding-left: 0.8rem;
  padding-right: 0.8rem;
  // gap: 0.5rem;

  // CSS Variables (inherited from parent)
  // --color-theme: #ff8400;
  // --color-theme-alpha-70: color-mix(in srgb, var(--color-theme) 70%, transparent);
  // --color-white: rgba(255, 255, 255, 1);
  // --color-red: #ff0000;
  // --color-red-alpha-70: color-mix(in srgb, var(--color-red) 70%, transparent);
  // --color-goback: #ff0099;
  // --color-goback-alpha-50: color-mix(in srgb, var(--color-goback) 50%, transparent);
  // --color-goback-alpha-70: color-mix(in srgb, var(--color-goback) 70%, transparent);
  // --color-slow: #ffff00;
  // --color-slow-alpha-70: color-mix(in srgb, var(--color-slow) 70%, transparent);
  // --color-black: #000000;
  // --spacing-xs: 0.25rem;
  // --spacing-sm: 0.5rem;

  .top-row {
    display: flex;
    flex-direction: row;
    height: fit-content;

    .proximity-distance {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 3rem;

      &.dimmed {
        color: #aaaaaa;
      }
    }

    .proximity-status {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      // height: 5rem;

      .proximity-status-badge {
        color: var(--color-white);
        padding: var(--spacing-xs) var(--spacing-sm);
        font-size: 1.2rem;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;

        // Stage: Stop
        &.stop {
          color: var(--color-white);
          border-radius: 10px;
          box-shadow: 0 0 10px 0 var(--color-red-alpha-70);
          font-weight: bold;
          background-color: var(--color-red);
          font-size: 3rem;
        }

        // Stage: Go Back
        &.goback {
          color: var(--color-goback);
          border-radius: 10px;
          border: 1px solid var(--color-goback);
          box-shadow: inset 0 0 20px 0 var(--color-goback-alpha-50), 0 0 30px 0 var(--color-goback-alpha-70);
          font-weight: bold;
          background-color: var(--color-black);
          font-size: 3rem;
          animation: flash 1s infinite;
        }

        @keyframes flash {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }

        // Stage: Slow
        &.slow {
          color: var(--color-black);
          border-radius: 10px;
          box-shadow: 0 0 10px 0 var(--color-slow-alpha-70);
          font-weight: bold;
          background-color: var(--color-slow);
          font-size: 3rem;
        }

        // Stage: Staged
        &.staged {
          color: var(--color-black);
          border-radius: 10px;
          box-shadow: 0 0 10px 0 var(--color-staged-alpha-70);
          font-weight: bold;
          background-color: var(--color-staged);
          font-size: 3rem;
        }

        // Stage: Approaching
        &.approaching {
          color: var(--color-white);
          font-size: 1.2rem;

          // When there's a label, show it as a badge
          &.has-label {
            color: var(--color-white);

            // v1
            // background-color: rgb(0, 122, 196);
            // box-shadow: 0 0 10px 0 rgba(0, 122, 196, 0.7);

            // v2 - less saturated
            background-color: rgb(43, 136, 194);
            box-shadow: 0 0 10px 0 rgba(43, 136, 194, 0.7);

            border-radius: 10px;
            font-weight: bold;
            font-size: 3rem;
          }
        }
      }
    }
  }

  .instruction-row {
    text-align: center;
    color: var(--color-white);
    // min-height: 3rem; // Fixed height for 2 lines
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 0.4rem;
    font-family: "Noto Sans";
    // margin-bottom: 0.8rem;

    &.alert {
      font-size: 2.5rem;
      animation: flash-alert 1s infinite;
    }

    &.alert-sm {
      font-size: 1.5rem;
      animation: flash-alert 1s infinite;
    }

    &.notice {
      font-size: 1.5rem;
      // line-height: 1.5rem;
    }

    &.flash {
      animation: flash-row 0.420s infinite;
    }
  }

  @keyframes flash-alert {
    0%, 50% {
      opacity: 1;
    }
    51%, 100% {
      opacity: 0;
    }
  }

  @keyframes flash-row {
    0%, 49% {
      opacity: 1;
    }
    50%, 100% {
      opacity: 0;
    }
  }
}

.clock-badge {
  color: var(--color-white);
  // background-color: rgb(225, 123, 225);
  // box-shadow: 0 0 10px 0 rgba(225, 123, 225, 0.7);
  // background-color: rgb(180, 90, 180);
  background-color: rgb(184, 107, 184);

  // box-shadow: 0 0 10px 0 rgba(180, 90, 180, 0.6);
  border-radius: 8px;
  padding: 0.1rem 0.3rem;
  margin-left: 0.4rem;
  margin-right: 0.4rem;
  font-family: monospace;
  font-weight: bold;
}

.penalty-badge {
  margin-left: 0.4rem;
  color: var(--color-white);
  background-color: rgb(165, 57, 57);
  // background-color: rgb(176, 16, 16);
  // box-shadow: 0 0 10px 0 rgba(176, 16, 16, 0.7);
  border-radius: 8px;
  padding: 0.1rem 0.3rem;
  font-family: monospace;
  font-weight: bold;
}



</style>

