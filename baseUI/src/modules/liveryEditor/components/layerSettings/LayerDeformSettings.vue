<template>
  <div
    class="skew-settings"
    bng-ui-scope="skew-settings"
    v-bng-on-ui-nav:action_3="onTertiaryAction"
    v-bng-on-ui-nav:focus_l.up="element => actionHoldService.onFocus('skew', store.skew, element)"
    v-bng-on-ui-nav:focus_l.down="element => actionHoldService.onFocus('skew', store.skew, element)"
    v-bng-on-ui-nav:focus_r.down="element => actionHoldService.onFocus('skew', store.skew, element)"
    v-bng-on-ui-nav:focus_r.up="element => actionHoldService.onFocus('skew', store.skew, element)"
    v-bng-on-ui-nav:focus_u.up="element => actionHoldService.onFocus('skew', store.skew, element)"
    v-bng-on-ui-nav:focus_u.down="element => actionHoldService.onFocus('skew', store.skew, element)"
    v-bng-on-ui-nav:focus_d.down="element => actionHoldService.onFocus('skew', store.skew, element)"
    v-bng-on-ui-nav:focus_d.up="element => actionHoldService.onFocus('skew', store.skew, element)"
    v-bng-on-ui-nav:focus_lr="element => actionHoldService.onFocusScalar('skew', store.skew, element)"
    v-bng-on-ui-nav:focus_ud="element => actionHoldService.onFocusScalar('skew', store.skew, element)">
    <div class="setting-item item-column">
      <div class="slider-text-container">
        <BngInput
          v-model="skewX"
          :min="INPUT_CONTROL_MIN"
          :max="INPUT_CONTROL_MAX"
          :step="INPUT_CONTROL_STEPS"
          type="number"
          prefix="X"
          class="slider-text-textinput" />
        <BngSlider v-model="skewX" :min="INPUT_CONTROL_MIN" :max="INPUT_CONTROL_MAX" :step="INPUT_CONTROL_STEPS" class="slider-text-sliderinput" />
        <BngBinding :uiEvent="CONTROLLER_SKEW_X_BINDING" deviceMask="xinput" />
      </div>
    </div>
    <div class="setting-item item-column">
      <div class="slider-text-container">
        <BngInput
          v-model="skewY"
          type="number"
          prefix="Y"
          :min="INPUT_CONTROL_MIN"
          :max="INPUT_CONTROL_MAX"
          :step="INPUT_CONTROL_STEPS"
          class="slider-text-textinput" />
        <BngSlider v-model="skewY" :min="INPUT_CONTROL_MIN" :max="INPUT_CONTROL_MAX" :step="INPUT_CONTROL_STEPS" class="slider-text-sliderinput" />
        <BngBinding :uiEvent="CONTROLLER_SKEW_Y_BINDING" deviceMask="xinput" />
      </div>
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
const INPUT_CONTROL_MIN = -2.0
const INPUT_CONTROL_MAX = 2.0
const INPUT_DEFAULT_VALUE = 0.0

const CONTROLLER_SKEW_Y_BINDING = "focus_ud"
const CONTROLLER_SKEW_X_BINDING = "focus_lr"
const CONTROLLER_RESET_BINDING = "action_3"

const CONTROLLER_HINTS = [
  // { id: "move_y", content: { type: "binding", props: { uiEvent: "focus_ud" }, label: "Skew X" } },
  // { id: "move_x", content: { type: "binding", props: { uiEvent: "focus_lr" }, label: "Skew Y" } },
]

const KEYBOARD_HINTS = [
  // { id: "move_up", content: { type: "binding", props: { uiEvent: "focus_u" }, label: "Skew Up" } },
  // { id: "move_down", content: { type: "binding", props: { uiEvent: "focus_d" }, label: "Skew Down" } },
  // { id: "move_left", content: { type: "binding", props: { uiEvent: "focus_l" }, label: "Skew Left" } },
  // { id: "move_right", content: { type: "binding", props: { uiEvent: "focus_r" }, label: "Skew Right" } },
]
</script>

<script setup>
import { computed, onBeforeMount, onBeforeUnmount, onUnmounted, watch, nextTick } from "vue"
import { storeToRefs } from "pinia"
import { vBngOnUiNav } from "@/common/directives"
import { BngBinding, BngButton, BngInput, BngSlider, icons } from "@/common/components/base"
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

const skewX = computed({
  get: () => (store.cursorData && store.cursorData.skew ? store.cursorData.skew.x : undefined),
  set: async newValue => await store.setSkew(newValue, store.cursorData.skew.y),
})

const skewY = computed({
  get: () => (store.cursorData && store.cursorData.skew ? store.cursorData.skew.y : undefined),
  set: async newValue => await store.setSkew(store.cursorData.skew.x, newValue),
})

function onReset() {
  store.setSkew(INPUT_DEFAULT_VALUE, INPUT_DEFAULT_VALUE)
}

function onTertiaryAction() {
  if (store.reapplyActive || store.requestApplyActive) onReset()
  else return true
}

// UINAV
useUINavScope("skew-settings")

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
  actionHoldService.removeAll("skew")
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

<style lang="scss" scoped>
.skew-settings {
  display: flex;
  flex-direction: column;

  > :not(:last-child) {
    margin-right: 0.5rem;
  }

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
}
</style>
