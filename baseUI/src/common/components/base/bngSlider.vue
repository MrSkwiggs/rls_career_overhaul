<template>
  <div v-bng-scoped-nav="{ bubbleWhitelistEvents: ['menu'] }" class="bng-slider-container" v-bng-disabled="disabled">
    <input
      ref="slider"
      class="bng-slider"
      type="range"
      :disabled="disabled"
      v-model.number="value"
      :min="+min"
      :max="+max"
      :step="+step"
      v-bng-on-ui-nav-focus.repeat="uiNavFocusFunction"
      @input="notify" />
    <BngInput
      v-if="withInput"
      class="bng-slider-input"
      :disabled="disabled"
      v-model="inputProps.value"
      type="number"
      :min="inputProps.min"
      :max="inputProps.max"
      :step="inputProps.step"
      :suffix="unit"
      @valueChanged="onInputChange" />
    <BngButton v-if="withReset" class="bng-slider-reset" :accent="ACCENTS.text" :icon="icons.undo" :disabled="resetDisabled" @click="resetValue" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue"
import { BngInput, BngButton, ACCENTS, icons } from "@/common/components/base"
import { vBngScopedNav, vBngOnUiNavFocus, vBngDisabled } from "@/common/directives"
import { useDirty } from "@/services/dirty"
import { roundDecSample } from "@/utils/maths"

const props = defineProps({
  modelValue: Number,
  origValue: {
    type: [Number, String],
    default: NaN,
  },
  min: {
    type: [Number, String],
    default: 0,
  },
  max: {
    type: [Number, String],
    required: true,
  },
  step: {
    type: [Number, String],
    default: 0,
  },
  withReset: {
    type: Boolean,
    default: false,
  },
  withInput: {
    type: Boolean,
    default: false,
  },
  inputMultiplier: {
    type: Number,
    default: 1,
  },
  unit: {
    type: String,
    default: "",
  },
  disabled: Boolean,
  uiNavFocus: {
    type: [Boolean, Object],
    default: {},
    validator: val => (typeof val === "boolean" && !val) || typeof val === "object",
  },
})

const emit = defineEmits(["change", "valueChanged", "update:modelValue"])

const slider = ref(null)

const value = ref(props.modelValue)
const isPanelOpen = ref(false)

const uiNavFocusFunction = computed(() =>
  !props.uiNavFocus
    ? false
    : {
        callback: (dir, val) => {
          value.value = val
          notify()
        },
        value: () => value.value,
        min: +props.min,
        max: +props.max,
        step: () => +props.step,
        ...props.uiNavFocus,
      }
)

watch(
  () => props.modelValue,
  val => {
    value.value = Number(val)
    updateSliderBackground()
  }
)

const dirty = useDirty(value, null, updateSliderBackground)
const dirtyReset = useDirty(value, null, updateSliderBackground)
defineExpose(dirty)

const resetDisabled = computed(() => {
  if (props.disabled) return true
  if (!isNaN(dirtyReset.currentCleanValue.value)) return !dirtyReset.dirty.value
  return !dirty.dirty.value
})

onMounted(() => {
  updateSliderBackground()
  inputProps.value = value.value * props.inputMultiplier
})

function notify() {
  emit("update:modelValue", value.value)
  emit("valueChanged", value.value)
  emit("change", value.value)
  updateSliderBackground()
}

function updateSliderBackground() {
  if (!slider.value) return
  const current = ((value.value - props.min) / (props.max - props.min)) * 100
  let init = [-100, -100]
  let dirtyVal = dirtyReset.currentCleanValue.value
  if (typeof dirtyVal !== "number" || isNaN(dirtyVal)) {
    dirtyVal = dirty.currentCleanValue.value
  }
  if (typeof dirtyVal === "number" && !isNaN(dirtyVal)) {
    // if we have a mark to show, switch between 0 (foreground) and 1 (background)
    // depending on value, for a better visual representation
    const initpos = ((dirtyVal - props.min) / (props.max - props.min)) * 100
    init[current < initpos ? 0 : 1] = initpos
  }
  slider.value.style.backgroundPosition = `${init[0]}% 50%, ${100 - current}% 50%, ${init[1]}% 50%`
}

const inputProps = reactive({
  value: value.value * props.inputMultiplier,
  min: props.min * props.inputMultiplier,
  max: props.max * props.inputMultiplier,
  step: props.step * props.inputMultiplier,
  suffix: props.unit,
})

watch(
  () => value.value,
  val => {
    inputProps.value = val * props.inputMultiplier
  }
)

watch(
  () => props.origValue,
  val => {
    val = +val
    if (!isNaN(val)) dirtyReset.setCleanValue(val)
  },
  { immediate: true }
)

watch(
  () => inputProps.value,
  val => {
    value.value = val / props.inputMultiplier
  }
)

function onInputChange(num) {
  num = Number(num)
  const norm = roundDecSample(num, inputProps.step)
  if (num !== norm) inputProps.value = norm
  num = norm / props.inputMultiplier
  num = roundDecSample(num, props.step)
  if (num < props.min) num = props.min
  if (num > props.max) num = props.max
  value.value = num
  notify()
}

function resetValue() {
  const val = +props.origValue
  if (!isNaN(val)) value.value = val
  else dirty.resetValue()
  notify()
}
</script>

<style lang="scss" scoped>
@use "@/styles/modules/mixins" as *;
@use "@/styles/modules/density" as *;

// focus frame
$f-offset: 2px;
$rad: $border-rad-1;
// focus frame when holding
// $hold-rad: calc($rad * 1.1);
// $hold-f-offset: calc($f-offset * 1.4);
// $hold-rad: 4px;
// $hold-f-offset: $f-offset;

$knob-color: var(--bng-off-white);
$knob-highlight-color: var(--bng-orange-400);
$knob-shadow-color: rgba(var(--bng-off-black-rgb), 0.25);
$knob-disabled-color: var(--bng-cool-gray-500);
$background-mark-color: var(--bng-cool-gray-600);
$foreground-mark-color: var(--bng-cool-gray-400);
$track-enabled-color-a: var(--bng-off-white);
$track-enabled-color-b: var(--bng-cool-gray-600);
$track-active-color-a: var(--bng-orange-500);
$track-active-color-b: var(--bng-cool-gray-600);
$track-disabled-color-a: var(--bng-cool-gray-500);
$track-disabled-color-b: var(--bng-cool-gray-900);

// START RESET
// Make sure to reset styles back to initial due to
// main.css styles leaking into vue
.bng-slider {
  position: initial;
  height: initial;
  padding: initial;
  background-color: initial;
  color: initial;
  border-width: initial;
  border-radius: initial;
  transition: initial;
  &:focus {
    display: initial;
    &::before {
      content: none;
    }
  }
}
// END RESET

.bng-slider-container {
  position: relative;
  display: flex;
  flex-flow: row nowrap;
  align-items: stretch;
  justify-content: stretch;

  @include modify-focus($rad, $f-offset);

  &[disabled] {
    pointer-events: none;
    cursor: default;
  }
}

.bng-slider-input {
  $w: var(--input-width, 5.5em);
  flex: 0 0 $w;
  width: $w;
  margin-left: 0.5em;
}

.bng-slider {
  --knob-color: #{$knob-color};
  --knob-highlight-color: #{$knob-highlight-color};
  --knob-shadow-color: #{$knob-shadow-color};
  --knob-disabled-color: #{$knob-disabled-color};
  --background-mark-color: #{$background-mark-color};
  --foreground-mark-color: #{$foreground-mark-color};
  --track-color-a: #{$track-enabled-color-a};
  --track-color-b: #{$track-enabled-color-b};

  flex: 1 1 auto;
  display: inline-block;
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  margin: var(--bng-slider-margin, 0.7em) 0; // FIXME: needs some tuning
  border-bottom: 0;
  position: relative;
  background-repeat: no-repeat;
  // background mark shows up when value is over initial, and vice versa
  background-image: linear-gradient(90deg, var(--foreground-mark-color) 0% 100%),
    // foreground mark
    linear-gradient(105deg, var(--track-color-a) 0% 50%, var(--track-color-b) 50% 100%),
    // track
    linear-gradient(90deg, var(--background-mark-color) 0% 100%);
  // background mark
  background-size: 0.3em 0.65em,
    // foreground mark
    200% 0.15em,
    // track (must be 200% size)
    0.3em 0.65em; // background mark

  // if you need to disable resizing with font-size,
  // remove the next line and add "font-size: 1rem;"
  height: 1em;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    background: $knob-color;
    cursor: pointer;
    border-radius: 0.03em;
    width: 0.5em;
    height: 1em;
    transform: skewX(-20deg);
    box-shadow: 0 0 0.5em 0.125em $knob-shadow-color;
  }

  &:focus {
    --track-color-a: #{$track-active-color-a};
    --track-color-b: #{$track-active-color-b};
    &::-webkit-slider-thumb {
      background-color: $knob-highlight-color;
      box-shadow: 0 0 0 0.25rem rgba(var(--bng-orange-400-rgb), 0.5), 0 0 0.5rem 0.125rem $knob-shadow-color;
    }
  }

  &.bng-slider-rounded::-webkit-slider-thumb {
    width: 0.6em;
    height: 0.6em;
    border-radius: 50%;
    transform: none;
  }

  &[disabled] {
    --track-color-a: #{$track-disabled-color-a};
    --track-color-b: #{$track-disabled-color-b};
    cursor: default;
    pointer-events: none;
    opacity: 0.8;

    &::-webkit-slider-thumb {
      background-color: $knob-disabled-color !important;
    }
  }
}

.bng-slider-reset {
  font-size: 0.8em;
}
</style>
