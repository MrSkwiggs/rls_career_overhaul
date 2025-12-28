<template>
  <div
    bng-ui-scope="rotate-settings"
    v-bng-on-ui-nav:action_3="onTertiaryAction"
    v-bng-on-ui-nav:focus_l.up="element => actionHoldService.onFocus('rotate', store.rotate, element, ACTION_PARAMS_TYPE.xPoint)"
    v-bng-on-ui-nav:focus_l.down="element => actionHoldService.onFocus('rotate', store.rotate, element, ACTION_PARAMS_TYPE.xPoint)"
    v-bng-on-ui-nav:focus_r.down="element => actionHoldService.onFocus('rotate', store.rotate, element, ACTION_PARAMS_TYPE.xPoint)"
    v-bng-on-ui-nav:focus_r.up="element => actionHoldService.onFocus('rotate', store.rotate, element, ACTION_PARAMS_TYPE.xPoint)"
    v-bng-on-ui-nav:focus_u.up="element => actionHoldService.onFocus('rotate', store.rotate, element, ACTION_PARAMS_TYPE.xPoint)"
    v-bng-on-ui-nav:focus_u.down="element => actionHoldService.onFocus('rotate', store.rotate, element, ACTION_PARAMS_TYPE.xPoint)"
    v-bng-on-ui-nav:focus_d.down="element => actionHoldService.onFocus('rotate', store.rotate, element, ACTION_PARAMS_TYPE.xPoint)"
    v-bng-on-ui-nav:focus_d.up="element => actionHoldService.onFocus('rotate', store.rotate, element, ACTION_PARAMS_TYPE.xPoint)"
    v-bng-on-ui-nav:focus_lr="element => actionHoldService.onFocusScalar('rotate', store.rotate, element, ACTION_PARAMS_TYPE.xPoint)"
    v-bng-on-ui-nav:focus_ud="element => actionHoldService.onFocusScalar('rotate', store.rotate, element, ACTION_PARAMS_TYPE.xPoint)">
    <div class="setting-item item-column">
      <div class="slider-text-container">
        <BngInput
          v-model="rotation"
          :min="INPUT_CONTROL_MIN"
          :max="INPUT_CONTROL_MAX"
          :step="INPUT_CONTROL_STEPS"
          type="number"
          prefix="X"
          class="slider-text-textinput" />
        <BngSlider v-model="rotation" :min="INPUT_CONTROL_MIN" :max="INPUT_CONTROL_MAX" :step="INPUT_CONTROL_STEPS" class="slider-text-sliderinput" />
        <BngBinding :uiEvent="CONTROLLER_ROTATE_BINDING" deviceMask="xinput" />
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
const INPUT_CONTROL_STEPS = 0.1
const INPUT_CONTROL_MIN = 0
const INPUT_CONTROL_MAX = 359.9
const INPUT_DEFAULT_VALUE = 0

const CONTROLLER_ROTATE_BINDING = "focus_lr"
const CONTROLLER_RESET_BINDING = "action_3"

const CONTROLLER_HINTS = [
  // { id: "rotate_x", content: { type: "binding", props: { uiEvent: "focus_lr" }, label: "Rotate" } }
]

const KEYBOARD_HINTS = [
  // { id: "rotate_left", content: { type: "binding", props: { uiEvent: "focus_l" }, label: "Rotate Left" } },
  // { id: "rotate_right", content: { type: "binding", props: { uiEvent: "focus_r" }, label: "Rotate Right" } },
]
</script>

<script setup>
import { computed, onBeforeMount, onBeforeUnmount, onUnmounted, watch, nextTick } from "vue"
import { storeToRefs } from "pinia"
import { vBngOnUiNav } from "@/common/directives"
import { BngBinding, BngInput, BngSlider, BngButton, icons } from "@/common/components/base"
import { useLayerSettingsStore, useActionHoldService, ACTION_PARAMS_TYPE } from "@/modules/liveryEditor/stores"
import { useInfoBar } from "@/services/infoBar"
import useControls from "@/services/controls"
import { useUINavScope } from "@/services/uiNav"
// import { UINavEvents } from "@/bridge/libs"
import { getUINavServiceInstance } from "@/services/uiNav"

const store = useLayerSettingsStore()
const actionHoldService = useActionHoldService()
const Controls = useControls()
const { showIfController } = storeToRefs(Controls)
const infoBar = useInfoBar()

const rotation = computed({
  get: () => (store.cursorData ? parseFloat(store.cursorData.rotation.toFixed(1)) : undefined),
  set: async newValue => {
    await store.setRotation(newValue)
  },
})

function onReset() {
  rotation.value = INPUT_DEFAULT_VALUE
}

function onTertiaryAction() {
  if (store.reapplyActive || store.requestApplyActive) onReset()
  else return true
}

// UINAV
useUINavScope("rotate-settings")

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
  actionHoldService.removeAll("rotate")
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
