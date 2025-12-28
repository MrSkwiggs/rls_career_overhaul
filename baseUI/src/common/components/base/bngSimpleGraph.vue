<template>
  <div class="bng-simple-graph">
    <!-- Y-axis labels column -->
    <div v-if="config.showLabels" class="y-axis">
      <div class="y-values">
        <div class="max-value">{{ yMaxFormatted }}</div>
        <div class="axis-label">
          {{ config.yAxis.label }}
          <span v-if="config.yAxis.unit" class="unit">({{ config.yAxis.unit }})</span>
        </div>
        <div class="min-value">{{ yMinFormatted }}</div>
      </div>
    </div>

    <!-- Main graph area -->
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      class="graph-svg"
    >
      <!-- Define grid pattern -->
      <defs>
        <!-- Main grid pattern -->
        <pattern
          id="grid"
          :width="gridSizes.x"
          :height="gridSizes.y"
          patternUnits="userSpaceOnUse"
        >
          <!-- Vertical line -->
          <path
            :d="`M ${gridSizes.x} 0 L ${gridSizes.x} ${gridSizes.y}`"
            :stroke="gridColor"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
            opacity="0.3"
          />
          <!-- Horizontal line -->
          <path
            :d="`M 0 ${gridSizes.y} L 100 ${gridSizes.y}`"
            :stroke="gridColor"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
            opacity="0.3"
          />
        </pattern>

        <!-- Subgrid pattern -->
        <pattern
          id="subgrid"
          :width="gridSizes.x"
          :height="gridSizes.y"
          patternUnits="userSpaceOnUse"
        >
          <!-- Vertical line -->
          <path
            :d="`M ${gridSizes.x/subgridDivider} 0 L ${gridSizes.x/subgridDivider} ${gridSizes.y}`"
            :stroke="gridColor"
            stroke-width="0.5"
            vector-effect="non-scaling-stroke"
            opacity="0.15"
          />
          <!-- Horizontal line -->
          <path
            :d="`M 0 ${gridSizes.y/subgridDivider} L 100 ${gridSizes.y/subgridDivider}`"
            :stroke="gridColor"
            stroke-width="0.5"
            vector-effect="non-scaling-stroke"
            opacity="0.15"
          />
        </pattern>
      </defs>

      <!-- Apply grid patterns conditionally -->
      <rect v-if="showSubgrid" width="100" height="100" fill="url(#subgrid)" />
      <rect width="100" height="100" fill="url(#grid)" />

      <!-- Grid layer -->
      <g class="grid">
        <!-- Keep only the zero line -->
        <line
          v-if="hasNegativeValues"
          x1="0"
          :y1="getYPosition(0)"
          x2="100"
          :y2="getYPosition(0)"
          :stroke="gridColor"
          stroke-width="2"
          vector-effect="non-scaling-stroke"
          opacity="0.75"
        />
      </g>

      <!-- Background ranges layer -->
      <g class="background-ranges">
        <rect
          v-for="range in ranges"
          :key="`range-${range.start}`"
          :x="getXPosition(range.start)"
          y="-5"
          :width="getXPosition(range.end) - getXPosition(range.start)"
          height="110"
          :fill="range.fill"
          :stroke="range.outline"
          stroke-width="2"
          vector-effect="non-scaling-stroke"
          :opacity="range.opacity"
        />
      </g>

      <!-- Vertical guides layer -->
      <g class="vertical-guides">
        <line
          v-for="guide in verticalGuides"
          :key="`guide-${guide.x}`"
          :x1="getXPosition(guide.x)"
          y1="0"
          :x2="getXPosition(guide.x)"
          y2="100"
          :stroke="guide.color"
          stroke-width="1"
          vector-effect="non-scaling-stroke"
          :opacity="guide.opacity"
        />
      </g>

      <!-- Vertical indicator -->
      <line
        v-if="currentX"
        :x1="getXPosition(currentX)"
        y1="0"
        :x2="getXPosition(currentX)"
        y2="100"
        stroke="white"
        stroke-width="1"
        vector-effect="non-scaling-stroke"
        opacity="0.8"
      />

      <!-- Data areas and lines layer -->
      <g v-for="dataset in points" :key="dataset.label">
        <!-- Area fill -->
        <path v-if="dataset.fill"
          :d="getAreaPathForDataset(dataset)"
          :fill="dataset.color || 'white'"
          :opacity="dataset.fillOpacity ?? 0.5"
        />
        <!-- Line -->
        <path
          :d="getLinePathForDataset(dataset)"
          :stroke="dataset.color || 'white'"
          fill="none"
          stroke-width="1"
          vector-effect="non-scaling-stroke"
        />
      </g>

      <!-- Single label for compact display -->
      <!-- <text
        v-if="singleLabel"
        :x="getLabelPosition().x"
        :y="getLabelPosition().y"
        :text-anchor="getLabelPosition().anchor"
        :fill="singleLabel.color || 'var(--bng-orange)'"
        font-size="11"
        font-family="sans-serif"
      >
        {{ singleLabel.text }}
      </text> -->
    </svg>

    <!-- Single label as HTML overlay (avoids SVG stretching) -->
    <div
      v-if="singleLabel"
      class="single-label"
      :style="getLabelStyle()"
    >
      {{ singleLabel.text }}
    </div>

    <!-- X-axis labels row -->
    <div v-if="config.showLabels" class="x-axis">
      <div class="x-values">
        <div class="min-value">{{ xMinFormatted }}</div>
        <div class="axis-label">
          {{ config.xAxis.label }}
          <span v-if="config.xAxis.unit" class="unit">({{ config.xAxis.unit }})</span>
        </div>
        <div class="max-value">{{ xMaxFormatted }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Configuration object for graph appearance and behavior
  config: {
    type: Object,
    default: () => ({
      showLabels: false,      // Show/hide axis labels and values
      xAxis: {
        key: 'x',            // Key for X values in data
        label: 'X Axis',     // X axis label
        unit: ''             // Unit to show in parentheses
      },
      yAxis: {
        key: 'y',           // Key for Y values in data
        label: 'Y Axis',    // Y axis label
        unit: ''            // Unit to show in parentheses
      }
    })
  },

  // Array of datasets to plot. Each dataset should have:
  // - label: string (unique identifier)
  // - unit: string (optional)
  // - color: string (CSS color or variable)
  // - fill: boolean (optional, enables area fill below line)
  // - fillOpacity: number (optional, defaults to 0.5)
  // - points: array of [x, y] coordinates
  points: {
    type: Array,
    default: () => []
  },

  // Color for grid lines (CSS color or variable)
  gridColor: {
    type: String,
    default: 'var(--bng-ter-blue-gray-500)'
  },

  // Background color for the graph area
  backgroundColor: {
    type: String,
    default: 'rgba(0, 0, 0, 0.1)'
  },

  // X value for moving vertical indicator line
  currentX: {
    type: Number,
    default: null
  },

  // Array of vertical guide lines. Each guide should have:
  // - x: number (x coordinate)
  // - color: string (CSS color or variable)
  // - opacity: number (0-1)
  verticalGuides: {
    type: Array,
    default: () => []
  },

  // Array of background ranges. Each range should have:
  // - start: number (start x coordinate)
  // - end: number (end x coordinate)
  // - fill: string (CSS color or variable)
  // - outline: string (CSS color or variable)
  // - opacity: number (0-1)
  ranges: {
    type: Array,
    default: () => []
  },

  // Grid divisions for X and Y axes
  // [x divisions, y divisions]
  // Example: [50, 20] creates 50 vertical and 20 horizontal lines
  gridDivisions: {
    type: Array,
    default: () => [50, 20]
  },

  // Divides each grid cell into smaller segments for subgrid
  // Example: 2 creates one line in the middle of each grid cell
  subgridDivider: {
    type: Number,
    default: 2
  },

  // Enable/disable subgrid display
  showSubgrid: {
    type: Boolean,
    default: true
  },

  // Single label configuration for compact graphs
  singleLabel: {
    type: Object,
    default: null
    // Expected format: { text: "strength: 80%", x: 100, y: 0.8 }
  }
})

// Helper computed for pattern sizes
const gridSizes = computed(() => ({
  x: 100 / props.gridDivisions[0],
  y: 100 / props.gridDivisions[1]
}))

// Only need X scale globally
const xScale = computed(() => {
  // Check for manual overrides in config first
  if (props.config?.xAxis?.min !== undefined && props.config?.xAxis?.max !== undefined) {
    const range = props.config.xAxis.max - props.config.xAxis.min
    return {
      min: props.config.xAxis.min,
      max: props.config.xAxis.max,
      range: range === 0 ? 1 : range
    }
  }

  if (!props.points.length) return { min: 0, max: 1, range: 1 }

  const xValues = [
    ...props.points.flatMap(
      dataset => (dataset.points || []).map(point => point && point[0])
    ),
    ...(props.verticalGuides || []).map(guide => guide?.x),
    ...(props.ranges || []).map(range => range?.start),
    ...(props.ranges || []).map(range => range?.end)
  ].filter(val => val != null && isFinite(val))

  if (xValues.length === 0) {
    return { min: 0, max: 1, range: 1 }
  }

  const min = Math.min(...xValues)
  const max = Math.max(...xValues)

  if (!isFinite(min) || !isFinite(max)) {
    return { min: 0, max: 1, range: 1 }
  }

  const range = max - min
  return {
    min,
    max,
    range: range === 0 ? 1 : range // Prevent division by zero
  }
})

const getXPosition = (value) => {
  if (value == null || !isFinite(value)) return 0
  const result = ((value - xScale.value.min) / xScale.value.range) * 100
  return isFinite(result) ? result : 0
}

// Computed paths for each dataset
const datasetPaths = computed(() => {
  if (!props.points.length || !xScale.value) return []

  return props.points.map(dataset => {
    // Ensure dataset has valid points
    if (!dataset.points || !Array.isArray(dataset.points) || dataset.points.length === 0) {
      return {
        datasetId: dataset.label || 'unknown',
        linePath: '',
        areaPath: ''
      }
    }

    // Generate line points with M command
    const linePoints = dataset.points.map((point, index) => {
      if (!point || point.length < 2) return ''
      const x = getXPosition(point[0])
      const y = getYPosition(point[1])
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    }).filter(p => p).join(' ')

    // Generate area points without M command for fill
    const areaPoints = dataset.points.map((point) => {
      if (!point || point.length < 2) return ''
      const x = getXPosition(point[0])
      const y = getYPosition(point[1])
      return `L ${x} ${y}`
    }).filter(p => p).join(' ')

    let areaPath = ''
    if (dataset.fill && dataset.points.length > 0) {
      const firstPoint = dataset.points[0]
      const lastPoint = dataset.points[dataset.points.length - 1]

      if (firstPoint && lastPoint && firstPoint.length >= 2 && lastPoint.length >= 2) {
        const firstY = getYPosition(firstPoint[1])
        const lastY = getYPosition(lastPoint[1])
        areaPath = `M -5 105 L -5 ${firstY} ${areaPoints} L 105 ${lastY} L 105 105 Z`
      }
    }

    return {
      datasetId: dataset.label || 'unknown',
      linePath: linePoints,
      areaPath
    }
  })
})

// Helper functions to get paths for specific dataset
const getLinePathForDataset = (dataset) => {
  const path = datasetPaths.value.find(p => p.datasetId === dataset.label)
  return path ? path.linePath : ''
}

const getAreaPathForDataset = (dataset) => {
  const path = datasetPaths.value.find(p => p.datasetId === dataset.label)
  return path ? path.areaPath : ''
}

const getYPosition = (value) => {
  // Safety check for invalid values
  if (value == null || !isFinite(value)) {
    return 50 // Return middle position for invalid values
  }

  // Use global bounds for all datasets
  const yMin = yBounds.value.min
  const yMax = yBounds.value.max

  // Safety check for invalid bounds
  if (yMin == null || yMax == null || !isFinite(yMin) || !isFinite(yMax)) {
    return 50 // Return middle position for invalid bounds
  }

  // If min and max are the same (no range), return middle
  if (yMin === yMax) {
    return 50
  }

  // If all values are positive or all negative
  if (yMin >= 0 || yMax <= 0) {
    const yRange = yMax - yMin
    if (yRange === 0) return 50
    const result = 97.5 - (((value - yMin) / yRange) * 95)
    return isFinite(result) ? result : 50
  }

  // When we have both positive and negative values,
  // scale everything relative to zero line
  const yRange = Math.max(Math.abs(yMin), Math.abs(yMax))
  if (yRange === 0) return 50

  // Position zero line based on the proportion of positive to negative range
  const totalRange = Math.abs(yMin) + Math.abs(yMax)
  if (totalRange === 0) return 50

  const zeroLinePosition = (Math.abs(yMin) / totalRange) * 95 + 2.5

  let result
  if (value >= 0) {
    // Scale positive values from zero line to top
    result = zeroLinePosition - ((value / yRange) * (zeroLinePosition - 2.5))
  } else {
    // Scale negative values from zero line to bottom
    result = zeroLinePosition + ((Math.abs(value) / yRange) * (97.5 - zeroLinePosition))
  }

  return isFinite(result) ? result : 50
}

// Format numbers to be more readable - just floor the values
const formatNumber = (num) => {
  if (num == null || !isFinite(num)) return "0"
  return Math.floor(num).toString()
}

// Get global Y min/max across all datasets
const yBounds = computed(() => {
  // Check for manual overrides in config first
  if (props.config?.yAxis?.min !== undefined && props.config?.yAxis?.max !== undefined) {
    return {
      min: props.config.yAxis.min,
      max: props.config.yAxis.max
    }
  }

  if (!props.points.length) return { min: 0, max: 0 }

  const allYValues = props.points.flatMap(
    dataset => (dataset.points || []).map(point => point && point[1])
  ).filter(val => val != null && isFinite(val))

  if (allYValues.length === 0) {
    return { min: 0, max: 1 } // Default range if no valid data
  }

  const min = Math.min(...allYValues)
  const max = Math.max(...allYValues)

  // Ensure we have a valid range
  if (!isFinite(min) || !isFinite(max)) {
    return { min: 0, max: 1 }
  }

  return { min, max }
})

const xMinFormatted = computed(() => formatNumber(xScale.value?.min || 0))
const xMaxFormatted = computed(() => formatNumber(xScale.value?.max || 0))
const yMinFormatted = computed(() => formatNumber(yBounds.value.min))
const yMaxFormatted = computed(() => formatNumber(yBounds.value.max))

const hasNegativeValues = computed(() => {
  return yBounds.value.min < 0
})

// Smart positioning for single label (like old steering curves)
const getLabelPosition = () => {
  if (!props.singleLabel) return { x: 0, y: 0, anchor: "start" }

  const labelX = props.singleLabel.x !== undefined ? getXPosition(props.singleLabel.x) : 95
  const labelY = props.singleLabel.y !== undefined ? getYPosition(props.singleLabel.y) : 50

  // Smart positioning logic (like old options)
  // If Y position is high (>= 75%), place label below the point
  // If Y position is low (< 75%), place label above the point
  const adjustedY = labelY >= 25 ? labelY + 4 : labelY - 2 // 25% because Y is inverted in SVG

  // If X position is near right edge, anchor to end; otherwise anchor to start
  const anchor = labelX >= 80 ? "end" : "start"
  const adjustedX = anchor === "end" ? Math.min(labelX, 98) : Math.max(labelX, 2)

  return {
    x: adjustedX,
    y: adjustedY,
    anchor
  }
}

// Convert SVG position to CSS positioning for HTML overlay with smart collision avoidance
const getLabelStyle = () => {
  if (!props.singleLabel) return {}

  const basePos = getLabelPosition()

  // Estimate label dimensions (approximate based on text length and font size + padding)
  const textLength = props.singleLabel.text.length
  const estimatedWidth = textLength * 6.5 + 6 // ~6.5px per character at 11px font + 3px padding on each side
  const estimatedHeight = 14 + 4 // ~14px height for 11px font + 2px padding top/bottom

  // Convert percentage position to approximate pixel position for collision detection
  // (assuming a reasonable graph size for calculations)
  const containerWidth = 300 // reasonable assumption for percentage calculations
  const containerHeight = 80  // 5em ≈ 80px

  const pixelX = (basePos.x / 100) * containerWidth
  const pixelY = (basePos.y / 100) * containerHeight

  // Smart repositioning logic
  let finalX = basePos.x
  let finalY = basePos.y
  let anchor = basePos.anchor
  let verticalAlign = "middle"

  // Horizontal collision detection and adjustment
  if (anchor === "start") {
    // Label extends to the right - check right edge collision
    if (pixelX + estimatedWidth > containerWidth - 10) {
      // Move to left side of the point
      anchor = "end"
    }
  } else {
    // Label extends to the left - check left edge collision
    if (pixelX - estimatedWidth < 10) {
      // Move to right side of the point
      anchor = "start"
    }
  }

  // Minimum gap between label and point (in percentage of container height)
  const minGapFromPoint = 4 // 4% minimum gap from the point itself for better visibility

  // Vertical collision detection with proper spacing from point
  const topBuffer = 8  // Buffer for top edge
  const bottomBuffer = 8  // Buffer for bottom edge

  // Calculate if label would overflow the visible area
  const wouldOverflowTop = pixelY - estimatedHeight/2 < topBuffer
  const wouldOverflowBottom = pixelY + estimatedHeight/2 > containerHeight - bottomBuffer

  if (wouldOverflowBottom) {
    // Too close to bottom - position above the point with gap
    verticalAlign = "bottom"
    finalY = Math.max(basePos.y - minGapFromPoint, 15) // Ensure gap above point
  } else if (wouldOverflowTop) {
    // Too close to top - position below the point with gap
    verticalAlign = "top"
    finalY = Math.min(basePos.y + minGapFromPoint, 85) // Ensure gap below point
  } else {
    // Safe to center, but ensure we're not right on the line
    // For Y values like 0.77-0.81, we need to offset from the point
    const pointY = basePos.y

    // Always maintain gap - decide whether to go above or below the point
    // For Y data values 0.77-0.81, pointY should be ~19-23% (from top)
    if (pointY > 75) {
      // Point in lower portion - position label above it with gap
      verticalAlign = "bottom"
      finalY = pointY - minGapFromPoint
    } else if (pointY < 25) {
      // Point in upper portion - position label below it with gap
      verticalAlign = "top"
      finalY = pointY + minGapFromPoint
    } else {
      // Point in middle portion - position label above it with gap
      // This creates consistent spacing for most values
      verticalAlign = "bottom"
      finalY = pointY - minGapFromPoint
    }
  }

  // Calculate final transform based on anchoring
  let transformX = "translateX(0)"
  let transformY = "translateY(-50%)" // Default: center vertically

  if (anchor === "end") {
    transformX = "translateX(-100%)"
  }

  if (verticalAlign === "bottom") {
    transformY = "translateY(-100%)"
  } else if (verticalAlign === "top") {
    transformY = "translateY(0)"
  }

  return {
    position: "absolute",
    left: `${finalX}%`,
    top: `${finalY}%`,
    transform: `${transformX} ${transformY}`,
    color: props.singleLabel.color || "var(--bng-orange)",
    fontSize: "11px",
    fontFamily: "sans-serif",
    pointerEvents: "none",
    whiteSpace: "nowrap"
  }
}
</script>

<style lang="scss" scoped>
.bng-simple-graph {
  width: 100%;
  height: 100%;
  display: grid;
  position: relative;
  grid-template-columns: minmax(0, v-bind('config.showLabels ? "2rem" : "0"')) 1fr;
  grid-template-rows: 1fr minmax(0, v-bind('config.showLabels ? "2rem" : "0"'));

  .y-axis {
    grid-column: 1;
    grid-row: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    .y-values {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      font-size: 0.65rem;
      color: var(--color-text, #fff);
      max-width: 100%;

      .max-value, .min-value {
        opacity: 0.7;
        writing-mode: vertical-rl;
        transform: rotate(180deg);
        padding: 4px 0;
        max-height: 3rem;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .axis-label {
        writing-mode: vertical-rl;
        transform: rotate(180deg);
        white-space: nowrap;
        text-align: center;
        font-size: 0.75rem;
        max-height: 8rem;
        overflow: hidden;
        text-overflow: ellipsis;

        .unit {
          opacity: 0.7;
        }
      }
    }
  }

  .graph-svg {
    grid-column: 2;
    grid-row: 1;
    width: 100%;
    height: 100%;
    background-color: v-bind(backgroundColor);
  }

  .single-label {
    grid-column: 2;
    grid-row: 1;
    z-index: 10;
    font-weight: 500;
    padding: 2px 3px;
  }

  .x-axis {
    grid-column: 2;
    grid-row: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    .x-values {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 4px;
      font-size: 0.65rem;
      color: var(--color-text, #fff);

      .max-value, .min-value {
        opacity: 0.7;
        padding: 0 4px;
        max-width: 4rem;
        overflow: hidden;
        text-overflow: ellipsis;
        text-align: center;
      }

      .axis-label {
        white-space: nowrap;
        text-align: center;
        font-size: 0.75rem;
        max-width: 8rem;
        overflow: hidden;
        text-overflow: ellipsis;

        .unit {
          opacity: 0.7;
        }
      }
    }
  }
}
</style>