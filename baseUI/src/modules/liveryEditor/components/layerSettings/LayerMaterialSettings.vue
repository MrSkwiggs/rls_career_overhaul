<template>
  <div
    class="material-settings"
    bng-ui-scope="material-settings"
    v-bng-on-ui-nav:action_2="goNextSubSetting"
    v-bng-on-ui-nav:action_3="onTertiaryAction"
    v-bng-on-ui-nav:focus_l.up="onFocus"
    v-bng-on-ui-nav:focus_l.down="onFocus"
    v-bng-on-ui-nav:focus_r.down="onFocus"
    v-bng-on-ui-nav:focus_r.up="onFocus"
    v-bng-on-ui-nav:focus_u.up="onFocus"
    v-bng-on-ui-nav:focus_u.down="onFocus"
    v-bng-on-ui-nav:focus_d.down="onFocus"
    v-bng-on-ui-nav:focus_d.up="onFocus"
    v-bng-on-ui-nav:focus_lr="el => onFocus(el, true)"
    v-bng-on-ui-nav:focus_ud="el => onFocus(el, true)">
    <div class="subsettings-selector">
      <div
        v-for="(subtab, index) in subSettings"
        v-bng-tooltip:left="index === activeSubSettingsIndex ? undefined : subtab.label"
        :key="subtab.value"
        :class="{ active: index === activeSubSettingsIndex }"
        class="subsettings-selector-item"
        @click="() => (activeSubSettingsIndex = index)">
        <BngIcon :type="subtab.icon" class="selector-item-icon" />
      </div>
    </div>
    <div class="settings-content">
      <div v-if="activeSubSetting.value === 'color'" class="setting-item color-setting">
        <BngColorPicker v-model="color" view="luminosity" />
      </div>
      <div v-if="activeSubSetting.value === 'saturation'" class="setting-item item-column">
        <div class="slider-text-container">
          <BngSlider v-model="saturation" :min="INPUT_CONTROL_MIN" :max="INPUT_CONTROL_MAX" :step="INPUT_CONTROL_STEPS" />
          <BngInput v-model="saturation" type="number" :min="INPUT_CONTROL_MIN" :max="INPUT_CONTROL_MAX" :step="INPUT_CONTROL_STEPS" />
          <BngBinding :uiEvent="CONTROLLER_SLIDER_BINDING" deviceMask="xinput" />
        </div>
      </div>
      <div v-else-if="activeSubSetting.value === 'metallicIntensity'" class="setting-item item-column">
        <div class="slider-text-container">
          <BngSlider v-model="metallicIntensity" :min="INPUT_CONTROL_MIN" :max="INPUT_CONTROL_MAX" :step="INPUT_CONTROL_STEPS" />
          <BngInput v-model="metallicIntensity" type="number" :min="INPUT_CONTROL_MIN" :max="INPUT_CONTROL_MAX" :step="INPUT_CONTROL_STEPS" />
          <BngBinding :uiEvent="CONTROLLER_SLIDER_BINDING" deviceMask="xinput" />
        </div>
      </div>
      <div v-else-if="activeSubSetting.value === 'roughnessIntensity'" class="setting-item item-column">
        <div class="slider-text-container">
          <BngSlider v-model="roughnessIntensity" :min="INPUT_CONTROL_MIN" :max="INPUT_CONTROL_MAX" :step="INPUT_CONTROL_STEPS" />
          <BngInput v-model="roughnessIntensity" type="number" :min="INPUT_CONTROL_MIN" :max="INPUT_CONTROL_MAX" :step="INPUT_CONTROL_STEPS" />
          <BngBinding :uiEvent="CONTROLLER_SLIDER_BINDING" deviceMask="xinput" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const INPUT_CONTROL_STEPS = 0.01
const INPUT_CONTROL_MIN = 0
const INPUT_CONTROL_MAX = 1

const CONTROLLER_SLIDER_BINDING = "focus_lr"

const CONTROLLER_CHANGE_SUBSETTINGS_HINTS = [
  { id: "activate_previous_subsettings", content: { type: "binding", props: { uiEvent: "focus_u" }, label: "Previous Setting" } },
  { id: "activate_next_subsettings", content: { type: "binding", props: { uiEvent: "focus_d" }, label: "Next Setting" } },
]

const subSettings = [
  {
    label: "Color",
    icon: icons.colorCirclePalette,
    value: "color",
  },
  {
    label: "Saturation",
    icon: icons.colorSaturation,
    value: "saturation",
  },
  {
    label: "Metalness",
    icon: icons.materialMetal,
    value: "metallicIntensity",
  },
  {
    label: "Roughness",
    icon: icons.materialRoughness,
    value: "roughnessIntensity",
  },
]
</script>

<script setup>
import { computed, reactive, onBeforeMount, onBeforeUnmount, onMounted, onUnmounted, ref, watch, nextTick } from "vue"
import { storeToRefs } from "pinia"
import { BngBinding, BngButton, BngColorPicker, BngSlider, BngInput, BngIcon, icons } from "@/common/components/base"
import { useLayerSettingsStore, useActionHoldService, ACTION_PARAMS_TYPE } from "@/modules/liveryEditor/stores"
import { vBngOnUiNav, vBngTooltip } from "@/common/directives"
import { useInfoBar } from "@/services/infoBar"
import useControls from "@/services/controls"
import { useUINavScope, getUINavServiceInstance } from "@/services/uiNav"
// import { UINavEvents } from "@/bridge/libs"
import Paint from "@/utils/paint"

const emit = defineEmits(["subSettingChanged"])

const store = useLayerSettingsStore()
const actionHoldService = useActionHoldService()
const Controls = useControls()
const { showIfController } = storeToRefs(Controls)
const infoBar = useInfoBar()

const activeSubSettingsIndex = ref(0)

const _color = reactive({
  hue: 0.5,
  saturation: 1.0,
  luminosity: 0.5,
})

const color = computed({
  get: () => _color,
  set: async newValue => {
    const paint = new Paint()
    paint.hsl = [newValue.hue, newValue.saturation, newValue.luminosity]
    await store.setColor([paint.red, paint.green, paint.blue, paint.alpha])
  },
})

const saturation = computed({
  get: () => _color.saturation,
  set: async newValue => {
    const sat = parseFloat(newValue.toFixed(2))
    color.value = {
      hue: color.value.hue,
      saturation: sat,
      luminosity: color.value.luminosity,
    }
    _color.saturation = sat
  },
})

const metallicIntensity = computed({
  get: () => (store.cursorData ? store.cursorData.metallicIntensity : undefined),
  set: async newValue => {
    await store.setMetallicIntensity(newValue)
  },
})

const roughnessIntensity = computed({
  get: () => (store.cursorData ? store.cursorData.roughnessIntensity : undefined),
  set: async newValue => {
    await store.setRoughnessIntensity(newValue)
  },
})

const activeSubSetting = computed(() => subSettings[activeSubSettingsIndex.value])

watch(
  () => store.activeLayerUid,
  (newValue, oldValue) => {
    if (newValue && oldValue) {
      initColorPicker(store.cursorData.color)
    }
  },
  { deep: true }
)

watch(
  activeSubSetting,
  (value, oldValue) => {
    if (oldValue) actionHoldService.remove(oldValue)
    setHints()
    emit("subSettingChanged", value)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  actionHoldService.removeAll("color")
  actionHoldService.removeAll("saturation")
  actionHoldService.removeAll("metallicIntensity")
  actionHoldService.removeAll("roughnessIntensity")
  emit("subSettingChanged", undefined)
})

onMounted(() => {
  if (store.cursorData.color) initColorPicker(store.cursorData.color)
})

const goPreviousSubSetting = () => {
  if (activeSubSettingsIndex.value > 0) activeSubSettingsIndex.value = activeSubSettingsIndex.value - 1
  else activeSubSettingsIndex.value = subSettings.length - 1
}

const goNextSubSetting = () => {
  if (activeSubSettingsIndex.value < subSettings.length - 1) activeSubSettingsIndex.value = activeSubSettingsIndex.value + 1
  else activeSubSettingsIndex.value = 0
}

function onFocus(element, scalar = false) {
  const eventName = element.detail.name
  if (controls.isControllerUsed && (eventName === "focus_u" || eventName === "focus_d") && element.detail.value === 1) {
    if (eventName === "focus_u") goPreviousSubSetting()
    else if (eventName === "focus_d") goNextSubSetting()
  } else {
    const subsettingValue = activeSubSetting.value.value
    let actionFn,
      actionParamsType = ACTION_PARAMS_TYPE.xyPoints
    switch (subsettingValue) {
      case "color":
        actionFn = (hue, luminosity) => changeColor(hue, luminosity, 0)
        break
      case "saturation":
        actionFn = saturation => changeColor(0, 0, saturation)
        break
      case "metallicIntensity":
        actionFn = changeMetallicIntensity
        actionParamsType = ACTION_PARAMS_TYPE.xPoint
        break
      case "roughnessIntensity":
        actionFn = changeRoughnessIntensity
        actionParamsType = ACTION_PARAMS_TYPE.xPoint
        break
    }

    if (scalar) {
      actionHoldService.onFocusScalar(subsettingValue, actionFn, element, actionParamsType)
    } else {
      actionHoldService.onFocus(subsettingValue, actionFn, element, actionParamsType)
    }
  }
}

async function changeColor(h, l, s) {
  let newHue = color.value.hue + 0.01 * h
  let newLuminosity = color.value.luminosity + 0.01 * l
  let newSaturation = parseFloat((color.value.saturation + 0.1 * s).toFixed(2))

  if (newHue < 0 || newHue > 1) newHue = color.value.hue
  if (newLuminosity < 0 || newLuminosity > 1) newLuminosity = color.value.luminosity
  if (newSaturation < 0 || newSaturation > 1) newSaturation = color.value.saturation

  _color.hue = newHue
  _color.saturation = newSaturation
  _color.luminosity = newLuminosity

  const paint = new Paint()
  paint.hsl = [newHue, newSaturation, newLuminosity]
  store.setColor([paint.red, paint.green, paint.blue, paint.alpha])
}

const changeMetallicIntensity = direction => {
  const newValue = metallicIntensity.value + 0.1 * direction

  if (newValue >= 0 && newValue <= 1) metallicIntensity.value = newValue
}

const changeRoughnessIntensity = direction => {
  const newValue = roughnessIntensity.value + 0.1 * direction

  if (newValue >= 0 && newValue <= 1) roughnessIntensity.value = newValue
}

function updateColorPickerModel(rgba) {
  const paint = new Paint()
  paint.rgba = rgba
  _color.hue = paint.hue
  _color.saturation = paint.saturation
  _color.luminosity = paint.luminosity
}

// watch reset action
store.$onAction(({ name, store, args, after, onError }) => {
  after(result => {
    if (name === "resetCursorProperties" && args[0].includes("material")) {
      initColorPicker(store.cursorData.color)
    }
  })
})

function onReset() {
  const defaultColor = [1, 1, 1, 1]
  switch (activeSubSetting.value.value) {
    case "color":
      store.setColor(defaultColor)
      updateColorPickerModel(defaultColor)
      saturation.value = 1
      break
    case "saturation":
      saturation.value = 1
      break
    case "metallicIntensity":
      metallicIntensity.value = 0
      break
    case "roughnessIntensity":
      roughnessIntensity.value = 0
      break
  }
}

function onTertiaryAction() {
  if (store.reapplyActive || store.requestApplyActive) onReset()
  else return true
}

function initColorPicker(color) {
  const isWhite = color.every(x => x === 1)
  const paint = new Paint()
  paint.rgba = color

  _color.hue = paint.hue
  _color.saturation = isWhite ? 1 : paint.saturation
  _color.luminosity = paint.luminosity
}

// UINAV
useUINavScope("material-settings")

let useCrossfireValue
onBeforeMount(() => {
  useCrossfireValue = getUINavServiceInstance().useCrossfire
  // UINavEvents.useCrossfire = false
  getUINavServiceInstance().useCrossfire = false
})

onBeforeUnmount(() => {
  // UINavEvents.useCrossfire = useCrossfireValue
  getUINavServiceInstance().useCrossfire = useCrossfireValue
})

// INFOBAR BINDING HINTS
let unwatchGamepad

onBeforeMount(() => {
  unwatchGamepad = watch(
    showIfController,
    async () => {
      await nextTick(() => setHints())
    },
    { immediate: true }
  )
})

onUnmounted(() => {
  if (unwatchGamepad) unwatchGamepad()
  removeHints()
})

function setHints() {
  removeHints()

  if (showIfController.value) {
    infoBar.addHints(CONTROLLER_CHANGE_SUBSETTINGS_HINTS)
  }
}

function removeHints() {
  infoBar.removeHints(...CONTROLLER_CHANGE_SUBSETTINGS_HINTS.map(x => x.id))
}
</script>

<style lang="scss" scoped>
.material-settings {
  position: relative;
  display: flex;
  width: 20rem;
  height: 10rem;
  margin-left: -8px;

  .subsettings-selector {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 4px;

    > .subsettings-selector-item {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-grow: 1;
      height: 5rem;
      padding: 0.25rem 0.5rem;
      cursor: pointer;

      &:hover:not(.active) {
        .selector-item-icon {
          color: var(--bng-orange-b400);
        }
      }

      &.active {
        background: var(--bng-orange-b400);
        cursor: default;
      }
    }
  }

  .settings-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    flex-grow: 1;

    > .setting-item {
      flex-grow: 1;
      width: 100%;
    }
  }

  .color-setting :deep() {
    .colour-picker-container {
      height: 100%;

      .colour-slider {
        display: none !important;
      }
    }
  }

  .reset-container {
    display: flex;
    align-items: center;
    justify-content: flex-end;

    :first-child {
      max-width: 6rem;
    }
  }
}
</style>
