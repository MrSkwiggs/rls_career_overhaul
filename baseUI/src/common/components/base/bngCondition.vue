<template>
  <div :class="{
    'bng-condition': true,
    'cond-warn': integrityWarning,
  }" :style="{
    backgroundColor: cssColour,
    '--bng-condition-clip-path': `polygon(${cssClipPoly})`
  }" v-bng-tooltip="tooltip"></div>
</template>

<script setup>
import { computed } from "vue"
import { vBngTooltip } from "@/common/directives"
import { $translate } from "@/services/translation"

const props = defineProps({
  integrity: {
    type: Number,
    default: 1.0,
  },
  integrityWarning: Boolean,
  color: {
    // either string colour or RGB array
    type: [String, Array],
    default: "#000",
  },
  showTooltip: Boolean,
})

const integrity = computed(() => typeof props.integrity === "number" ? Math.min(Math.max(props.integrity, 0.0), 1.0) : 1.0)

const tooltip = computed(() => {
  if (!props.showTooltip) return undefined
  let tip = `${$translate.instant("ui.condition.integrity")}: ${~~(integrity.value * 100)}%`
  if (props.integrityWarning) tip += `\n${$translate.instant("ui.condition.needsRepair")}`
  return tip
})

const cssColour = computed(() => {
  let clr = props.color
  if (!Array.isArray(clr))
    return clr
  clr = [...clr]
  if (clr.length > 3) {
    clr.splice(3)
    if (!clr.some(c => c > 1)) // if all values in range of 0..1
      clr = clr.map(c => c * 255)
  }
  return `rgb(${clr.join(",")})`
})

const cssClipPoly = computed(() => {
  const val = integrity.value
  // corners addt.:   < 90        < 180      < 270     < 360
  const corners = ["100% 0%", "100% 100%", "0% 100%", "0% 0%"]
  let poly = "0% 0%" // none
  if (val === 1.0) { // =1.0 for integrity, =0.0 for wear
    poly = corners.join(", ") // full rect
  } else if (val > 0.0) { // >0.0 for integrity, <1.0 for wear
    const deg = (1.0 - val) * 360 // (1.0 - val) for integrity, (val) for wear
    const x = 50 + 50 * Math.sin((deg * Math.PI) / 180)
    const y = 50 - 50 * Math.cos((deg * Math.PI) / 180)
    poly = `50% 0%, 50% 50%, ${~~x}% ${~~y}%, `
      + corners.slice(-Math.ceil((360 - deg) / 90)).join(", ") // add ending corner points
  }
  return poly
})
</script>

<style lang="scss" scoped>
$size: 1.25em;
$border-size: $size * 0.15;

.bng-condition {
  position: relative;
  display: inline-block;
  width: $size - $border-size;
  min-width: $size - $border-size;
  height: $size - $border-size;
  min-height: $size - $border-size;
  margin: $border-size;
  border: $border-size solid #000;
  border-radius: 100%;
  background-image: radial-gradient(
    circle at top left,
    rgba(0,0,0, 0.0) 55%,
    rgba(0,0,0, 0.4) 70%,
    rgba(0,0,0, 0.8) 100%
  );

  &::before,
  &::after {
    position: absolute;
    top: -$border-size;
    left: -$border-size;
    right: -$border-size;
    bottom: -$border-size;
    border: #{$border-size * 0.75} solid #fff;
    border-radius: 100%;
  }

  &.cond-warn::before {
    content: "";
    border-width: #{$border-size * 0.5};
    border-color: #e33;
  }

  &::after {
    content: "";
    clip-path: var(--bng-condition-clip-path);
  }
}
</style>
