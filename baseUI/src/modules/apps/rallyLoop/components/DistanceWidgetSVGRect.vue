<template>
  <div class="distance-widget-svg">
    <svg>
      <!-- Progress bar background (white) -->
      <rect
        :x="barStartX + 'px'"
        :y="barY + '%'"
        :width="barWidth"
        :height="barHeightPct + '%'"
        fill="white"
      />

      <!-- Progress bar fill (theme color) -->
      <!-- make some manual adjustments to the height to avoid the white progress bar showing through on the edges -->
      <rect
        :x="barStartX + 'px'"
        :y="(barY - 1) + '%'"
        :width="progressWidth"
        :height="barHeightPct + 2 + '%'"
        fill="var(--theme-color)"
      />

      <!-- Start tick mark (green) -->
      <rect
        :x="(barStartX - tickSize/2) + 'px'"
        :y="'calc(' + barCenterY + '% - ' + (tickSize/2) + 'px)'"
        :width="tickSize + 'px'"
        :height="tickSize + 'px'"
        fill="var(--theme-color)"
      />

      <!-- Split tick marks -->
      <g v-for="split in splitMarkers" :key="split.key" :style="`transform: translateX(${split.x})`">
        <rect
          :x="-(tickSize/2) + 'px'"
          :y="'calc(' + barCenterY + '% - ' + (tickSize/2) + 'px)'"
          :width="tickSize + 'px'"
          :height="tickSize + 'px'"
          :stroke-width="tickStrokeWidth"
          fill="#202020"
          stroke="#ffffff"
        />
        <text
          :x="0"
          y="90%"
          text-anchor="middle"
        >
          <tspan class="tick-label">{{ split.label.val }}</tspan>
          <tspan class="tick-label-unit" dx="2">{{ split.label.unit }}</tspan>
        </text>
      </g>

      <!-- Finish tick mark (red) with label -->
      <g :style="`transform: translateX(${barEndX})`">
        <rect
          :x="-(tickSize/2) + 'px'"
          :y="'calc(' + barCenterY + '% - ' + (tickSize/2) + 'px)'"
          :width="tickSize + 'px'"
          :height="tickSize + 'px'"
          :stroke-width="tickStrokeWidth"
          fill="#202020"
          stroke="#ffffff"
        />
        <text
          :x="0"
          y="90%"
          dx="20"
          text-anchor="end"
        >
          <tspan v-if="finalSplitLabel" class="tick-label-bold">{{ finalSplitLabel.val }}</tspan>
          <tspan class="tick-label-unit" dx="2">{{ finalSplitLabel.unit }}</tspan>
        </text>
      </g>

      <!-- Current position circle with label -->
      <!-- <rect
        :x="currentX"
        :y="barCenterY + '%'"
        :width="squareSize"
        :height="squareSize"
        transform-origin="center"
        :transform="`translate(-${squareSize/2}, -${squareSize/2})`"
        fill="var(--theme-color)"
      /> -->
      <g :style="`transform: translateX(${currentX})`">
        <rect
          :x="-(trackingRectSize/2) + 'px'"
          :y="'calc(' + barCenterY + '% - ' + (trackingRectSize/2) + 'px)'"
          :width="trackingRectSize + 'px'"
          :height="trackingRectSize + 'px'"
          fill="var(--theme-color)"
        />
        <!-- <text
          :x="0"
          y="30%"
          text-anchor="middle"
          class="dot-label"
        >
          <tspan class="tick-label">{{ (distM / 1000.0).toFixed(splitPrecision) }}</tspan>
          <tspan class="tick-label-unit" dx="2">{{ unit }}</tspan>
        </text> -->
      </g>
      <!-- <text
        :x="currentXPercent + '%'"
        y="15%"
        text-anchor="middle"
        class="dot-label"
      >
        {{ (distPct * 100).toFixed(progressPrecision) }}%
      </text> -->

      <!-- Glow filter for the dot -->
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  distPct: {
    type: Number,
    required: true
  },
  totalDistM: {
    type: Number,
    required: true
  },
  splits: {
    type: Array,
    default: () => []
  },
  splitPrecision: {
    type: Number,
    default: 1
  },
  themeColor: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    default: 'km'
  }
})

// SVG dimensions and layout (mixed: pixels for horizontal, percentage for vertical)
const PAD_PX = 20 // padding in pixels from left edge
const PADRIGHT_PX = 26 // padding in pixels from right edge
const barHeightPct = 8 // bar height as percentage of SVG height
const barCenterY = 50 // center of SVG vertically (percentage)
const tickStrokeWidth = 2
const tickSize = 12 // width and height of tick mark rectangles
const trackingRectSize = 14 // width and height of current position rectangle

// Total distance is now provided directly from the backend

// Bar dimensions (pixels for x, percentage for width)
const barStartX = PAD_PX
const barY = barCenterY - barHeightPct / 2

// Percentage versions for text/circle elements (don't support calc)
const barEndXPercent = 100 - PADRIGHT_PX

// Calculate current position on the bar (percentage of total width)
const currentXPercent = computed(() => {
  // Position as percentage of SVG width, accounting for padding
  const availableWidth = 100 - PAD_PX - PADRIGHT_PX
  return PAD_PX + (availableWidth * props.distPct)
})

// For calc-compatible attributes (rect)
const currentX = computed(() => {
  return `calc(${PAD_PX}px + (100% - ${PAD_PX + PADRIGHT_PX}px) * ${props.distPct})`
})

// Bar width and progress width use calc for responsive sizing
const barWidth = `calc(100% - ${PAD_PX + PADRIGHT_PX}px)`
const progressWidth = computed(() => {
  return `calc((100% - ${PAD_PX + PADRIGHT_PX}px) * ${props.distPct})`
})
const barEndX = `calc(100% - ${PADRIGHT_PX}px)`

// Filter and calculate positions for split tick marks
const splitMarkers = computed(() => {
  if (!props.splits) return []

  return props.splits
    .filter(s => typeof s?.pathnodeType === 'string' && s.pathnodeType.startsWith('split_'))
    .map((s, idx) => {
      const pct = s.distPct || 0
      const x = `calc(${PAD_PX}px + (100% - ${PAD_PX + PADRIGHT_PX}px) * ${pct})`

      return {
        key: s.pathnodeId ?? idx,
        x,
        label: { val: s.splitLabel, unit: props.unit }
      }
    })
})

// Get the final split label for the finish tick
const finalSplitLabel = computed(() => {
  if (!props.splits || props.splits.length === 0) return { val: null, unit: null }

  // Find the last split (finish line)
  const lastSplit = props.splits[props.splits.length - 1]
  return { val: lastSplit?.splitLabel, unit: props.unit }
})
</script>

<style lang="scss" scoped>
.distance-widget-svg {
  // --font-xxxl: 3.0rem;
  --theme-color: v-bind(themeColor);
  // border: 1px solid var(--color-red);

  padding: 4px;
  background-color: var(--color-black-alpha-80);
  color: var(--color-white);
  width: 100%;
  box-sizing: border-box;
  display: block;

  // font-family: Overpass;
  font-family: 'Noto Sans';
  // font-family: monospace;

  // font-size: var(--font-xxl);
  font-size: 1.1rem;

  svg {
    width: 100%;
    height: 60px;
    display: block;
  }

  .tick-label-unit {
    fill: var(--color-white);
    font-size: 0.9rem;
  }

  .tick-label {
    fill: var(--color-white);
    font-size: 1.1rem;
  }

  .tick-label-bold {
    fill: var(--color-white);
    font-size: 1.1rem;
    font-weight: bold;
  }

  .dot-label {
    fill: var(--color-white);
    font-size: 1.1rem;
  }
}
</style>

