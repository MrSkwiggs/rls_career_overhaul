<template>
  <div
    :class="{
      'colour-picker-container': true,
      'colour-picker-mode-picker': opts.picker,
      'colour-picker-mode-slider': opts.slider,
      'colour-picker-mode-compact': opts.compact,
    }"
  >
    <div v-if="opts.compact" class="colour-picker-switch">
      <span>Custom color</span>
      <BngButton
        v-if="!$simplemenu && opts.picker"
        :accent="ACCENTS.text"
        :icon="icons.materialTransparency01"
        v-bng-tooltip:top="`Toggle vertical axis mode to ${pickerMode === 'luminosity' ? 'saturation' : 'brightness'}`"
        @click="togglePickerMode"
      />
      <BngButton
        v-if="!$simplemenu"
        :accent="opts.picker ? ACCENTS.outlined : ACCENTS.text"
        :icon="opts.picker ? icons.materialGlossy : icons.listSmall"
        v-bng-tooltip:top="'Toggle picker/slider mode'"
        @click="toggleCompactMode"
      />
    </div>
    <div
      v-if="opts.picker"
      class="colour-picker"
      @mousemove="onMousemove"
      @mousedown="onMousedown"
      @mouseup="onMouseupLeave"
      @mouseleave="onMouseupLeave"
      v-bng-disabled="disabled"
      :style="{
        '--colour-picker-x': `linear-gradient(90deg, ${gradients.hueStatic.join(', ')})`,
        '--colour-picker-y': `linear-gradient(180deg, ${gradients.pickerOverlay.join(', ')})`,
      }"
    >
      <div
        class="colour-picker-dot"
        :style="{
          left: `${colorDot.x}%`,
          top: `${colorDot.y}%`,
          '--colour-picker-dot-fill': `hsl(${current.hue}, ${opts.saturation ? current.saturation : 100}%, ${opts.luminosity ? current.luminosity : 50}%)`,
        }"
      ></div>
    </div>
    <BngColorSlider
      v-if="opts.slider || opts.hue"
      v-model.number="values.hue"
      @change="notify"
      :fill="gradients.hue"
      :current="`hsl(${current.hue}, 100%, 50%)`"
      :indicator="sliderIndicator"
      :step="step"
      :disabled="disabled"
    >{{ showText ? $t("ui.color.hue") : null }}</BngColorSlider>
    <BngColorSlider
      v-if="opts.slider || opts.luminosity"
      X:vertical="opts.picker"
      v-model.number="values.saturation"
      @change="notify"
      :fill="gradients.saturation"
      :current="`hsl(${current.hue}, ${current.saturation}%, ${current.luminosity}%)`"
      :indicator="sliderIndicator"
      :step="step"
      :disabled="disabled"
    >{{ showText ? `${$t("ui.color.saturation")} (${current.saturation}%)` : null }}</BngColorSlider>
    <BngColorSlider
      v-if="opts.slider || opts.saturation"
      X:vertical="opts.picker"
      v-model.number="values.luminosity"
      @change="notify"
      :fill="gradients.luminosity"
      :current="`hsl(${current.hue}, ${current.saturation}%, ${current.luminosity}%)`"
      :indicator="sliderIndicator"
      :step="step"
      :disabled="disabled"
    >{{ showText ? `${$t("ui.color.brightness")} (${current.luminosity}%)` : null }}</BngColorSlider>
  </div>
</template>

<script>
export const VIEWS = {
  simple: { slider: true, picker: false, saturation: false, luminosity: false },
  compact_saturation: { slider: true, picker: true, saturation: true, luminosity: false, compact: true },
  compact_luminosity: { slider: true, picker: true, saturation: false, luminosity: true, compact: true },
  saturation: { slider: false, picker: true, saturation: true, luminosity: false },
  luminosity: { slider: false, picker: true, saturation: false, luminosity: true },
  full_saturation: { slider: true, picker: true, saturation: true, luminosity: false },
  full_luminosity: { slider: true, picker: true, saturation: false, luminosity: true },
}

const valuesDef = { hue: 0.5, saturation: 1, luminosity: 0.5 }
</script>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, inject } from "vue"
import { BngColorSlider, BngButton, ACCENTS, icons } from "@/common/components/base"
import { vBngDisabled, vBngTooltip } from "@/common/directives"

const $simplemenu = inject("$simplemenu")

const props = defineProps({
  modelValue: {
    // NOTE: when Paint class is provided through the model, it may lead to errors after compilation
    //       to avoid the error, simply wrap provided variable in ref()
    type: Object,
    default: { ...valuesDef },
  },
  view: {
    type: [String, Object],
    default: "full_luminosity",
    validator: val => typeof val === "string" || val in VIEWS,
  },
  showText: {
    type: Boolean,
    default: true,
  },
  step: {
    type: Number,
    default: 0.001,
  },
  disabled: Boolean,
})

const sliderIndicator = "popout" // inner / popout

const pickerMode = ref("luminosity")

const opts = ref({})
const values = reactive({ ...valuesDef })
const colorDot = ref({ x: 0, y: 0 })

watch(
  [() => props.view, $simplemenu],
  () => {
    if (typeof props.view === "string") {
      for (const key in VIEWS[props.view]) {
        opts.value[key] = VIEWS[props.view][key]
      }
    } else {
      opts.value = { ...VIEWS[props.view] }
    }
    if ($simplemenu.value) {
      opts.value.picker = false
      if (opts.value.compact) opts.value.slider = true
    } else if (opts.value.compact) {
      loadCompactMode()
    }
    if (opts.value.picker) setColorDot()
  },
  { immediate: true }
)

function updColour() {
  for (const key in values) {
    values[key] = props.modelValue[key]
  }
  if (opts.value.picker) setColorDot()
}
watch(() => props.modelValue, updColour)
watch(() => props.modelValue.hue, updColour)
watch(() => props.modelValue.saturation, updColour)
watch(() => props.modelValue.luminosity, updColour)

const current = computed(() => ({
  hue: ~~(values.hue * 360),
  saturation: ~~(values.saturation * 100),
  luminosity: ~~(values.luminosity * 100),
}))

const emitter = defineEmits(["update:modelValue", "change"])

function notify() {
  for (const key in values) props.modelValue[key] = values[key]
  emitter("change", props.modelValue)
  emitter("update:modelValue", props.modelValue)
}

const hueLoop = [...Array(7)].map((_, i) => (i / 6) * 360) // 6 primary colours + ending red = 7
const gradients = reactive({
  hueStatic: hueLoop.map(hue => `hsl(${hue}, 100%, 50%)`),
  // hue: computed(() => hueLoop.map(hue => `hsl(${hue}, ${current.value.saturation}%, ${current.value.luminosity}%)`)),
  hue: computed(() => hueLoop.map(hue => `hsl(${hue}, 100%, 50%)`)),
  overlaySaturation: [`hsla(0, 0%,  0%, 0)`, `hsla(0, 0%, 50%, 1)`],
  overlayLuminosity: [`hsla(0, 0%, 100%, 1)`, `hsla(0, 0%, 100%, 0) 50%`, `hsla(0, 0%,   0%, 0) 50%`, `hsla(0, 0%,   0%, 1)`],
  pickerOverlay: computed(() => (opts.value.saturation ? gradients.overlaySaturation : gradients.overlayLuminosity)),
  saturation: computed(() => [
    `hsl(${current.value.hue},   0%, ${current.value.luminosity}%)`,
    `hsl(${current.value.hue}, 100%, ${current.value.luminosity}%)`,
  ]),
  luminosity: computed(() => [
    `hsl(${current.value.hue}, ${current.value.saturation}%,   0%)`,
    `hsl(${current.value.hue}, ${current.value.saturation}%,  50%)`,
    `hsl(${current.value.hue}, ${current.value.saturation}%, 100%)`,
  ]),
})

let isMousedown = false

function onMousedown() {
  isMousedown = true
}
function onMousemove(evt) {
  updateColor(evt)
}
function onMouseupLeave(evt) {
  updateColor(evt, true)
}

function getPosition(evt) {
  const rect = evt.target.getBoundingClientRect()
  if (rect.width < 20) return colorDot.value
  return {
    x: ((evt.x - rect.left) / rect.width) * 100,
    y: ((evt.y - rect.top) / rect.height) * 100,
  }
}

function updateColor(evt, mouseLeave = false) {
  if (!isMousedown) return
  if (mouseLeave) isMousedown = false
  const pos = getPosition(evt)
  values.hue = Math.max(0, Math.min(pos.x, 100)) / 100
  const secondary = 1 - Math.max(0, Math.min(pos.y, 100)) / 100
  if (opts.value.saturation) values.saturation = secondary
  else values.luminosity = secondary
  setColorDot()
  nextTick(notify)
}

function setColorDot() {
  colorDot.value = {
    x: values.hue * 100,
    y: (1 - (opts.value.saturation ? values.saturation : values.luminosity)) * 100,
  }
}

function toggleCompactMode() {
  opts.value.slider = !opts.value.slider
  opts.value.picker = !opts.value.picker
  saveCompactMode()
}

function togglePickerMode() {
  pickerMode.value = pickerMode.value === "luminosity" ? "saturation" : "luminosity"
  opts.value.luminosity = pickerMode.value === "luminosity"
  opts.value.saturation = pickerMode.value === "saturation"
  saveCompactMode()
}

function loadCompactMode() {
  const readOption = (name, val = null) => JSON.parse(localStorage.getItem(name) || JSON.stringify(val))
  opts.value.picker = readOption("bngColorPicker-picker", true)
  opts.value.slider = readOption("bngColorPicker-slider", false)
  pickerMode.value = readOption("bngColorPicker-picker-mode", "luminosity")
  opts.value.luminosity = pickerMode.value === "luminosity"
  opts.value.saturation = pickerMode.value === "saturation"
  if (!opts.value.luminosity && !opts.value.saturation) opts.value.luminosity = true
}
function saveCompactMode() {
  const saveOption = (name, val) => localStorage.setItem(name, JSON.stringify(val))
  saveOption("bngColorPicker-picker", opts.value.picker)
  saveOption("bngColorPicker-slider", opts.value.slider)
  saveOption("bngColorPicker-picker-mode", pickerMode.value)
}

onMounted(() => {
  updColour()
  if (!$simplemenu.value && opts.value.compact) loadCompactMode()
})
</script>

<style lang="scss" scoped>
.colour-picker-container {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: row;

  // Add gap between sliders
  :deep(.colour-slider) {
    margin-top: 0.7em;
  }

  &.colour-picker-mode-picker {
    display: block;
  }
  /// WIP
  // &.colour-picker-mode-picker {
  //   flex-wrap: nowrap;
  //   > .colour-picker {
  //     $width: calc(100% - 2.5rem);
  //     flex: 0 0 $width;
  //     width: $width !important;
  //   }
  //   > :deep(.colour-slider) {
  //     $factor: 2.666;
  //     $width: 2.5rem * $factor;
  //     flex: 0 0 $width;
  //     width: $width !important;
  //     height: 100% * $factor;
  //     font-size: $factor * 1rem;
  //     // overflow: hidden;
  //     .colour-slider-vertical {
  //       transform-origin: 0% 100%;
  //       transform: rotate(270deg) translate(-$width / $factor, $width / $factor) scale(1 / $factor);
  //     }
  //   }
  // }

  &.colour-picker-mode-slider {
    flex-wrap: wrap;
    // justify-content: space-between;
    // > * {
    //   $width: calc(50% - 0.5em);
    //   flex: 0 0 $width;
    //   width: $width;
    // }
    // > *:first-child {
    //   flex: 0 0 100%;
    //   width: 100%;
    // }
  }
}

.colour-picker {
  position: relative;
  width: 100%;
  height: 100%;
  padding-top: 37.5%;
  overflow: hidden;
  &[disabled] {
    opacity: 0.5;
    filter: grayscale(50%);
    pointer-events: none;
  }
  background-image: var(--colour-picker-y), var(--colour-picker-x);
  cursor: crosshair;
  .colour-picker-dot {
    position: absolute;
    left: 0;
    top: 0;
    width: 1px;
    width: 0;
    height: 1px;
    height: 0;
    pointer-events: none;
    &::before,
    &::after {
      content: "";
      box-sizing: border-box;
      position: absolute;
      $size: 1rem;
      left: #{-$size * 0.5};
      top: #{-$size * 0.5};
      width: $size;
      height: $size;
      border-radius: $size;
      border: 0.2rem solid #fff;
    }
    &::before {
      background-color: var(--colour-picker-dot-fill);
    }
    &::after {
      border: 0.1rem solid #000;
    }
  }
}

.colour-picker-mode-compact {
  //
}

.colour-picker-switch {
  flex: 0 0 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: stretch;
  align-items: baseline;
  > * {
    flex: 0 0 auto;
  }
  > span {
    flex: 1 1 auto;
    font-weight: 500;
  }
}
</style>
