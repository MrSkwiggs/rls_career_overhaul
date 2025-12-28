<template>
  <div class="bng-input-bar" :class="{ bidirectional: isBidirectional, vertical: isVertical }">
    <div class="track">
      <div
        v-if="showTarget"
        class="fill target"
        :style="targetStyle"
      ></div>
      <div
        class="fill actual"
        :style="actualStyle"
      ></div>
    </div>
    <div class="knob" :style="knobStyle"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Values are expected normalized: [0..1] or [-1..1] when bidirectional
  value: { type: Number, default: 0 }, // actual
  targetValue: { type: Number, default: 0 },
  isBidirectional: { type: Boolean, default: false },
  // Layout: if true -> vertical, else horizontal
  vertical: { type: Boolean, default: false },
})
const isVertical = computed(() => props.vertical)

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

const toUnits = (v, bidir) => {
  const vv = clamp(v, bidir ? -1 : 0, 1)
  return bidir ? (vv + 1) / 2 : vv // map [-1..1] to [0..1]
}

const zeroUnits = computed(() => (props.isBidirectional ? 0.5 : 0))
const actualUnits = computed(() => toUnits(props.value, props.isBidirectional))
const targetUnits = computed(() => toUnits(props.targetValue, props.isBidirectional))

const isLeft = v => props.isBidirectional && v < zeroUnits.value

const makeFillStyle = (units) => {
  if (!isVertical.value) {
    if (props.isBidirectional) {
      const start = Math.min(units, zeroUnits.value)
      const end = Math.max(units, zeroUnits.value)
      return { left: `${start * 100}%`, right: `${(1 - end) * 100}%` }
    }
    // single-direction: LTR
    return { left: '0%', right: `${(1 - units) * 100}%` }
  }
  // vertical orientation
  if (props.isBidirectional) {
    const start = Math.min(units, zeroUnits.value)
    const end = Math.max(units, zeroUnits.value)
    return { bottom: `${start * 100}%`, top: `${(1 - end) * 100}%` }
  }
  // single-direction: bottom to top
  return { bottom: '0%', top: `${(1 - units) * 100}%` }
}

const actualStyle = computed(() => makeFillStyle(actualUnits.value))
const targetStyle = computed(() => makeFillStyle(targetUnits.value))
const showTarget = computed(() => props.targetValue !== undefined && props.targetValue !== null)

const knobStyle = computed(() => (
  !isVertical.value
    ? { left: `calc(${actualUnits.value * 100}% - 2px)` }
    : { bottom: `calc(${actualUnits.value * 100}% - 2px)` }
))
</script>

<style scoped lang="scss">
// Colors aligned with Figma node variables
// Allow parent components to override the border via CSS var `--bng-input-bar-border`
$border: var(--bng-input-bar-border, var(--bng-ter-blue-gray-600, #4a697e));
$target: var(--bng-ter-blue-gray-500, #6a8ba1);
$actual: var(--bng-orange-200, #ffa37c);
$knob: var(--bng-off-white, #ececec);
$track: var(--bng-input-bar-track, var(--bng-ter-blue-gray-850, #ececec));

.bng-input-bar {
  position: relative;
  height: 12px; // horizontal thickness
  border: 1px solid $border;
  border-radius: 2px;
  background: transparent;
  .track {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: inherit;
    background: $track;
  }
  .fill {
    position: absolute;
    top: 0;
    bottom: 0;
    &.target { background: $target; opacity: 1; }
    &.actual { background: $actual; }
  }
  .knob {
    position: absolute;
    top: -3px;
    bottom: -3px;
    width: 4px;
    height: auto;
    background: $knob;
    border-radius: 1px;
  }
}

.bng-input-bar.vertical {
  height: 100%;
  width: 8px; // vertical thickness
  .fill {
    left: 0;
    right: 0;
  }
  .knob {
    left: -3px;
    right: -3px;
    top: auto;
    width: auto;
    height: 4px;
  }
}
</style>


