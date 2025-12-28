<template>
  <div
    class="scale-settings"
    bng-ui-scope="scale-settings"
    v-bng-on-ui-nav:action_2="toggleLockScaling"
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
    <div class="setting-item item-column">
      <div class="slider-text-container">
        <BngInput
          v-model="scaleX"
          :min="INPUT_CONTROL_MIN"
          :max="INPUT_CONTROL_MAX"
          :step="INPUT_CONTROL_STEPS"
          type="number"
          prefix="X"
          class="slider-text-textinput" />
        <BngSlider v-model="scaleX" :min="INPUT_CONTROL_MIN" :max="INPUT_CONTROL_MAX" :step="INPUT_CONTROL_STEPS" class="slider-text-sliderinput" />
        <BngBinding :uiEvent="CONTROLLER_SCALE_X_BINDING" deviceMask="xinput" />
      </div>
    </div>
    <div class="setting-item item-column">
      <div class="slider-text-container">
        <BngInput
          v-model="scaleY"
          type="number"
          prefix="Y"
          :min="INPUT_CONTROL_MIN"
          :max="INPUT_CONTROL_MAX"
          :step="INPUT_CONTROL_STEPS"
          class="slider-text-textinput" />
        <BngSlider v-model="scaleY" :min="INPUT_CONTROL_MIN" :max="INPUT_CONTROL_MAX" :step="INPUT_CONTROL_STEPS" class="slider-text-sliderinput" />
        <BngBinding :uiEvent="CONTROLLER_SCALE_Y_BINDING" deviceMask="xinput" />
      </div>
    </div>
    <div class="setting-item">
      <BngSwitch v-model="editModeState.lockScaling">Lock Scaling</BngSwitch>
      <BngBinding :uiEvent="CONTROLLER_LOCK_BINDING" deviceMask="xinput" />
    </div>
    <!-- <div v-if="!store.cursorData.applied" class="setting-item reset-container">
      <BngButton label="Reset" accent="secondary" @click="onReset">
        <BngBinding :uiEvent="CONTROLLER_RESET_BINDING" deviceMask="xinput" />
      </BngButton>
    </div> -->
  </div>
</template>

<script>
const INPUT_CONTROL_STEPS = 0.01
const INPUT_CONTROL_MIN = 0.0
const INPUT_CONTROL_MAX = 6.0
const INPUT_DEFAULT_VALUE = 0.5

const CONTROLLER_SCALE_Y_BINDING = "focus_ud"
const CONTROLLER_SCALE_X_BINDING = "focus_lr"
const CONTROLLER_LOCK_BINDING = "action_2"
const CONTROLLER_RESET_BINDING = "action_3"

const CONTROLLER_HINTS = [
  // { id: "move_y", content: { type: "binding", props: { uiEvent: "focus_ud" }, label: "Change X" } },
  // { id: "move_x", content: { type: "binding", props: { uiEvent: "focus_lr" }, label: "Change Y" } },
]

const KEYBOARD_HINTS = [
  // { id: "move_up", content: { type: "binding", props: { uiEvent: "focus_u" }, label: "Increase Y" } },
  // { id: "move_down", content: { type: "binding", props: { uiEvent: "focus_d" }, label: "Decrease Y" } },
  // { id: "move_left", content: { type: "binding", props: { uiEvent: "focus_l" }, label: "Decrease X" } },
  // { id: "move_right", content: { type: "binding", props: { uiEvent: "focus_r" }, label: "Decrease Y" } },
]
</script>

<script setup>
import { computed, onBeforeMount, onBeforeUnmount, onUnmounted, watch, nextTick } from "vue"
import { storeToRefs } from "pinia"
import { vBngOnUiNav } from "@/common/directives"
import { BngBinding, BngButton, BngInput, BngSwitch, BngSlider, icons } from "@/common/components/base"
import { useLayerSettingsStore, useActionHoldService } from "@/modules/liveryEditor/stores"
import { useInfoBar } from "@/services/infoBar"
import { useUINavScope } from "@/services/uiNav"
// import { UINavEvents } from "@/bridge/libs"
import { getUINavServiceInstance } from "@/services/uiNav"
import useControls from "@/services/controls"

const store = useLayerSettingsStore()
const actionHoldService = useActionHoldService()
const Controls = useControls()
const { showIfController } = storeToRefs(Controls)
const infoBar = useInfoBar()
const { editModeState } = storeToRefs(store)

const scaleX = computed({
  get: () => (store.cursorData && store.cursorData.scale ? store.cursorData.scale.x : undefined),
  set: async newValue => {
    if (newValue === store.cursorData.scale.x) return

    let scaleY = store.cursorData.scale.y
    if (editModeState.value.lockScaling) {
      const diff = newValue - store.cursorData.scale.x
      scaleY = scaleY + diff
    }

    await store.setScale(newValue, scaleY)
  },
})

const scaleY = computed({
  get: () => (store.cursorData && store.cursorData.scale ? store.cursorData.scale.y : undefined),
  set: async newValue => {
    if (newValue === store.cursorData.scale.y) return

    let scaleX = store.cursorData.scale.x
    if (editModeState.value.lockScaling) {
      const diff = newValue - store.cursorData.scale.y
      scaleX = scaleX + diff
    }

    await store.setScale(scaleX, newValue)
  },
})

const toggleLockScaling = () => {
  editModeState.value.lockScaling = !editModeState.value.lockScaling
}

function onReset() {
  store.setScale(INPUT_DEFAULT_VALUE, INPUT_DEFAULT_VALUE)
}

function onTertiaryAction() {
  if (store.reapplyActive || store.requestApplyActive) onReset()
  else return true
}

function onFocus(element, scalar = false) {
  let actionFn = (xDirection, yDirection) => {
    if (xDirection !== 0) {
      const newX = xDirection * INPUT_CONTROL_STEPS + scaleX.value
      scaleX.value = newX
    }

    if (yDirection !== 0) {
      const newY = yDirection * INPUT_CONTROL_STEPS + scaleY.value
      scaleY.value = newY
    }
  }

  if (scalar) {
    actionHoldService.onFocusScalar("scale", actionFn, element)
  } else {
    actionHoldService.onFocus("scale", actionFn, element)
  }
}

// UINAV
useUINavScope("scale-settings")

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
  actionHoldService.removeAll("scale")
  if (unwatchGamepad) unwatchGamepad()
  removeHints()
})

function setHints() {
  const hints = showIfController.value ? CONTROLLER_HINTS : KEYBOARD_HINTS

  removeHints()

  for (let i = hints.length - 1; i >= 0; i--) {
    infoBar.addHints(hints[i], 0, true)
  }
}

function removeHints() {
  infoBar.removeHints(...KEYBOARD_HINTS.map(x => x.id))
  infoBar.removeHints(...CONTROLLER_HINTS.map(x => x.id))
}
</script>

<style scoped lang="scss">
.slider-text-container {
  .slider-text-sliderinput {
    flex-grow: 1;
  }

  .slider-text-textinput {
    margin-right: 0.5rem;
    min-width: 6rem;
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
</style>
