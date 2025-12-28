<template>
  <div class="debug-simple-graph">
    <BngSimpleGraph
      :exit-override="exitOverride"
      :config="graphConfig"
      :points="graphData"
      :current-x="currentRPM"
      :vertical-guides="verticalGuides"
      :ranges="ranges"
      :grid-divisions="[50, 20]"
      :subgrid-divider="2"
      :show-subgrid="true"
      grid-color="var(--bng-ter-blue-gray-500)"
      background-color="var(--bng-black-o4)"
    />
  </div>
</template>

<script setup>
import { ref } from "vue"
import { BngSimpleGraph } from "@/common/components/base"

defineProps({
  exitOverride: Function
})

const graphConfig = ref({
  showLabels: false,
  xAxis: {
    key: "x",
    label: "Time",
    unit: "ms"
  },
  yAxis: {
    key: "y",
    label: "Value",
    unit: "float"
  }
})

const generateFloatPoints = (count, start, step) => {
  return Array.from({ length: count }, (_, i) => {
    const x = start + (i * step)
    // Generate sine wave between -2 and 2
    const y = Math.sin(i * 0.5) * 2
    return [x, y]
  })
}

const generateNegativeXPoints = (count, start, step) => {
  return Array.from({ length: count }, (_, i) => {
    const x = start + (i * step) // start will be negative
    // Generate cosine wave between -2 and 2
    const y = Math.cos(i * 0.5) * 2
    return [x, y]
  })
}

const graphData = ref([
  {
    label: "Float Data",
    unit: "float",
    color: "white",
    fill: false,
    fillOpacity: 0.2,
    points: generateFloatPoints(100, 0, 100)
  },
  {
    label: "Negative X Data",
    unit: "float",
    color: "white",
    fill: true,
    fillOpacity: 0.2,
    points: generateNegativeXPoints(50, -2000, 100) // Start at -2000, 50 points
  }
])

// Demo animation of the vertical line
const currentRPM = ref(1000)

// Animate RPM for demo purposes
let increasing = true
const updateRPM = () => {
  if (increasing) {
    currentRPM.value += 50
    if (currentRPM.value >= 10000) increasing = false
  } else {
    currentRPM.value -= 50
    if (currentRPM.value <= 1000) increasing = true
  }
  requestAnimationFrame(updateRPM)
}

// Start animation
updateRPM()

// Renamed from regions to ranges
const ranges = ref([
  {
    start: 586,
    end: 12480,
    fill: "var(--bng-add-red-400)",
    outline: "var(--bng-add-red-500)",
    opacity: 0.1
  }
])

// Guides at specific points
const verticalGuides = ref([
  { x: 128, color: "var(--bng-add-red-400)", opacity: 0.4 },
  { x: 256, color: "var(--bng-add-red-400)", opacity: 0.4 },
  { x: 4432, color: "var(--bng-add-red-400)", opacity: 0.4 },
  { x: 12400, color: "var(--bng-add-red-400)", opacity: 0.4 }
])
</script>

<style lang="scss" scoped>
.debug-simple-graph {
  width: 600px;
  height: 300px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--bng-corners-2);
}
</style>