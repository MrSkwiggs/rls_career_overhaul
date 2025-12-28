<!-- bngProgressBar - progress bar -->
<template>
  <div class="bng-progress-bar">
    <div v-if="headerLeft || headerRight" class="header">
      <span class="header-left">{{ headerLeft }}</span>
      <span class="header-right">{{ headerRight }}</span>
    </div>
    <div class="progress-bar">
      <div v-if="showValueLabel" class="info" v-html="valueHTML"></div>
      <span v-if="indeterminate" class="progress-fill-indeterminate"></span>
      <span
        v-else
        :class="{
          'progress-fill': true,
          'progress-fill-gradient': gradient,
          'animate-progress': animateDifference && value > oldValue,
        }"
        :style="{
          backgroundColor: valueColor,
          zIndex: value < oldValue ? 2 : 1,
        }">
      </span>
      <span
        v-if="oldValue"
        :class="{
          'second-progress-fill': true,
          'progress-fill-gradient': gradient,
          'animate-progress': animateDifference && value < oldValue,
        }"
        :style="{
          backgroundColor: oldValueColor,
          zIndex: value < oldValue ? 1 : 2,
        }">
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue"

const props = defineProps({
  value: {
    type: Number,
    default: 0,
  },
  oldValue: {
    type: Number,
    default: 0,
  },
  min: {
    type: Number,
    default: 0,
  },
  max: {
    type: Number,
    required: true,
  },
  headerLeft: String,
  headerRight: String,
  showValueLabel: {
    type: Boolean,
    default: true,
  },
  valueLabelFormat: {
    type: [String, Function],
    default: "#value#",
  },
  valueColor: {
    type: String,
    default: "#ff6600",
  },
  oldValueColor: {
    type: String,
    default: "#ffffff",
  },
  indeterminate: Boolean,
  animateDifference: Boolean,
  gradient: Boolean,
})

defineExpose({
  decreaseValueBy,
  increaseValueBy,
  setValue: value => updateCurrentValue(value),
})

const currentValue = ref(null)

const valueHTML = computed(() => {
  let res
  if (typeof props.valueLabelFormat === "function") {
    res = props.valueLabelFormat(props.value, { min: props.min, max: props.max })
  } else {
    res = props.valueLabelFormat
      .replace(/ +/g, "&nbsp;")
      .replace("#value#", `<span class="value-label">${currentValue.value}</span><span>${props.max}</span>`)
  }
  return res
})

const progressFillUnits = computed(() => 1 - (currentValue.value - props.min) / (props.max - props.min))
const oldProgressFillUnits = computed(() => 1 - (props.oldValue - props.min) / (props.max - props.min))

watch(() => props.value, updateCurrentValue)

onMounted(() => {
  updateCurrentValue(props.min > props.value ? props.min : props.value)
})

/* Exposed Functions */
function decreaseValueBy(value) {
  let newValue = currentValue.value - value
  if (newValue < props.min) newValue = props.min
  updateCurrentValue(newValue)
}

function increaseValueBy(value) {
  let newValue = currentValue.value + value
  if (newValue > props.max) newValue = props.max
  updateCurrentValue(newValue)
}

function updateCurrentValue(newValue) {
  currentValue.value = newValue
}
</script>

<style scoped lang="scss">
@use "@/styles/modules/animations" as *;

$background-color: rgba(255, 255, 255, 0.15);

$font-color: #ffffff;
$font-top-line-space: 1px;

$info-z-index: 3;
$info-divider-height: 0.9em;
$info-divider-color: white;

$progress-fill-color: v-bind(valueColor);
$progress-fill-z-index: 1;

$progress-fill-gradient-color: #ffaa00;

.bng-progress-bar {
  font-family: Overpass, var(--fnt-defs);
  font-style: normal;
  font-weight: 700;
  font-size: 16px;
  line-height: 125%;

  > .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-style: italic;
  }

  > .progress-bar {
    position: relative;
    background-color: $background-color;
    height: 1.5em;
    overflow: hidden;
  }
}

.info {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding: 0.2em 1em 0;
  z-index: $info-z-index;

  :deep(.value-label) {
    position: relative;
    padding-right: 1.34em;

    &::after {
      content: "";
      position: absolute;
      top: calc(50% - ($info-divider-height / 2) - $font-top-line-space);
      right: 0.6em;
      width: 0.1em;
      height: $info-divider-height;
      background: $info-divider-color;
      transform: matrix(0.94, 0, -0.37, 1, 0, 0);
    }
  }
}

.progress-fill {
  position: absolute;
  display: inline-block;
  top: 0;
  right: calc(v-bind(progressFillUnits) * 100%);
  bottom: 0;
  &:not(.progress-fill-gradient) {
    left: 0;
  }
}

.second-progress-fill {
  position: absolute;
  display: inline-block;
  top: 0;
  left: 0;
  right: calc(v-bind(oldProgressFillUnits) * 100%);
  bottom: 0;
}

.progress-fill-gradient {
  width: 100%;
  &::before {
    content: "";
    display: inline-block;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: linear-gradient(90deg,
      rgba($progress-fill-gradient-color, 0.0),
      rgba($progress-fill-gradient-color, 0.9)
    );
    opacity: calc(1 - v-bind(progressFillUnits));
  }
}

.progress-fill-indeterminate {
  position: absolute;
  display: inline-block;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: $progress-fill-color;
  transform-origin: 0% 50%;
  z-index: $progress-fill-z-index;
  animation: indeterminateAnimation 1s infinite linear;
  @keyframes indeterminateAnimation {
    0% { transform: translateX(0) scaleX(0); }
    30% { transform: translateX(0) scaleX(0.4); }
    100% { transform: translateX(100%) scaleX(0.5); }
  }
}

.animate-progress {
  animation: pulsingBrightness 1s ease-in-out infinite;
  @keyframes pulsingBrightness {
    0% { filter: brightness(1.2); }
    50% { filter: brightness(1.7); }
    100% { filter: brightness(1.2); }
  }
}
</style>
