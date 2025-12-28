<template>
  <LayerSettingsBase
    v-bng-ui-nav-label:action_2="'[Hold] Precise'"
    v-bng-on-ui-nav:action_2.up="handleAction2"
    v-bng-on-ui-nav:action_2.down="handleAction2"
    class="material-settings">
    <template #heading>Color</template>
    <div class="material-settings-content">
      <BngColorPicker v-model="color" :step="colorPickerStep" @change="notifyListeners" />
      <div class="color-values-container" bng-no-child-nav>
        <BngInput prefix="h" v-model="inputHue" />
        <BngInput prefix="s" v-model="inputSat" />
        <BngInput prefix="b" v-model="inputLum" />
      </div>
    </div>
  </LayerSettingsBase>
</template>

<script setup>
import { ref, computed, watch } from "vue"
import Paint from "@/utils/paint"
import { vBngOnUiNav, vBngUiNavLabel } from "@/common/directives"
import { BngColorPicker, BngInput } from "@/common/components/base"
import { LayerSettingsBase } from "."

const props = defineProps({
  initialColor: Array,
})

const emit = defineEmits(["change"])

const paint = new Paint()
const color = ref({
  hue: 0.5,
  saturation: 1.0,
  luminosity: 0.5,
})
const inputHue = computed({
  get: () => color.value.hue.toFixed(3),
  set: newValue => {
    color.value.hue = typeof newValue === "string" ? +newValue : newValue
    notifyListeners()
  },
})
const inputSat = computed({
  get: () => color.value.saturation.toFixed(3),
  set: newValue => {
    color.value.saturation = typeof newValue === "string" ? +newValue : newValue
    notifyListeners()
  },
})
const inputLum = computed({
  get: () => color.value.luminosity.toFixed(3),
  set: newValue => {
    color.value.luminosity = typeof newValue === "string" ? +newValue : newValue
    notifyListeners()
  },
})

const isPreciseActive = ref(false)
const colorPickerStep = computed(() => (isPreciseActive.value ? 0.001 : 0.01))

watch(
  () => props.initialColor,
  () => {
    if (props.initialColor) {
      paint.rgba = props.initialColor
      color.value.hue = paint.hsl[0]
      color.value.saturation = paint.hsl[1]
      color.value.luminosity = paint.hsl[2]
    }
  },
  { deep: true, immediate: true }
)

function notifyListeners() {
  const hsl = [color.value.hue, color.value.saturation, color.value.luminosity]
  paint.hsl = hsl
  const data = {
    colorHsl: hsl,
    colorRgb: paint.rgb,
  }
  emit("change", data)
}

function handleAction2(element) {
  isPreciseActive.value = element.detail.value === 1
}
</script>

<style lang="scss" scoped>
.material-settings {
  max-width: 24rem;
  height: 26rem;
  max-height: 30rem;
}

.material-settings-content {
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  width: 100%;
}

.color-values-container {
  display: flex;
  align-items: center;

  > * {
    flex: 1 1 auto;

    &:not(:last-child) {
      margin-right: 0.25rem;
    }
  }
}
</style>
