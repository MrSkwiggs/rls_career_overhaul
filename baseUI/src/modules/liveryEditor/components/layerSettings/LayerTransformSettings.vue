<template>
  <div
    class="transform-settings"
    bng-ui-scope="transform-settings"
    v-bng-on-ui-nav:ok="onOk"
    v-bng-on-ui-nav:action_2="toggleUseSurfaceNormal"
    v-bng-on-ui-nav:action_3="onTertiaryAction"
    v-bng-on-ui-nav:focus_l.up="element => actionHoldService.onFocus('transform', store.translate, element)"
    v-bng-on-ui-nav:focus_l.down="element => actionHoldService.onFocus('transform', store.translate, element)"
    v-bng-on-ui-nav:focus_r.down="element => actionHoldService.onFocus('transform', store.translate, element)"
    v-bng-on-ui-nav:focus_r.up="element => actionHoldService.onFocus('transform', store.translate, element)"
    v-bng-on-ui-nav:focus_u.up="element => actionHoldService.onFocus('transform', store.translate, element)"
    v-bng-on-ui-nav:focus_u.down="element => actionHoldService.onFocus('transform', store.translate, element)"
    v-bng-on-ui-nav:focus_d.down="element => actionHoldService.onFocus('transform', store.translate, element)"
    v-bng-on-ui-nav:focus_d.up="element => actionHoldService.onFocus('transform', store.translate, element)"
    v-bng-on-ui-nav:focus_lr="element => actionHoldService.onFocusScalar('transform', store.translate, element)"
    v-bng-on-ui-nav:focus_ud="element => actionHoldService.onFocusScalar('transform', store.translate, element)">
    <div class="setting-item item-column">
      <div v-show="isShowControls" class="slider-text-container">
        <BngInput
          v-model="positionX"
          :min="INPUT_CONTROL_MIN"
          :max="positionMaxX"
          :step="INPUT_CONTROL_STEPS"
          type="number"
          prefix="X"
          class="slider-text-textinput" />
        <BngSlider v-model="positionX" :min="INPUT_CONTROL_MIN" :max="positionMaxX" :step="INPUT_CONTROL_STEPS" class="slider-text-sliderinput" />
        <BngBinding :uiEvent="CONTROLLER_MOVE_X_BINDING" deviceMask="xinput" />
      </div>
    </div>
    <div v-show="isShowControls" class="setting-item item-column">
      <div class="slider-text-container">
        <BngInput
          v-model="positionY"
          type="number"
          prefix="Y"
          :min="INPUT_CONTROL_MIN"
          :max="positionMaxY"
          :step="INPUT_CONTROL_STEPS"
          class="slider-text-textinput" />
        <BngSlider v-model="positionY" :min="INPUT_CONTROL_MIN" :max="positionMaxY" :step="INPUT_CONTROL_STEPS" class="slider-text-sliderinput" />
        <BngBinding :uiEvent="CONTROLLER_MOVE_Y_BINDING" deviceMask="xinput" />
      </div>
    </div>
    <div v-if="!store.cursorData.applied" class="setting-item">
      <BngSwitch v-model="surfaceNormal" :disabled="!(store.reapplyActive || !applied)">Use Surface Normal</BngSwitch>
      <BngBinding :uiEvent="CONTROLLER_SURFACE_NORMAL_BINDING" deviceMask="xinput" />
    </div>
    <div class="setting-item actions-container">
      <template v-if="store.requestApplyActive || store.reapplyActive">
        <BindingButton
          v-if="store.appliedLayers && store.appliedLayers.length > 0"
          :icon="store.reapplyActive ? icons.undo : ''"
          :uiEvent="CONTROLLER_CANCEL_REAPPLY_BINDING"
          :label="store.reapplyActive ? 'Undo' : 'Cancel'"
          accent="attention"
          @click="cancelApply" />
        <BindingButton v-if="!mouseMode" :uiEvent="CONTROLLER_APPLY_BINDING" label="Apply" accent="primary" @click="store.apply" />
      </template>
      <BindingButton v-else :uiEvent="CONTROLLER_APPLY_BINDING" label="Reapply" @click="store.requestReapply" />
    </div>
  </div>
</template>

<script>
const INPUT_CONTROL_STEPS = 0.001
const INPUT_CONTROL_MIN = 0
const INPUT_CONTROL_MAX = 1
const INPUT_DEFAULT_VALUE = 0.5

const APPLIED_CONTROLLER_HINTS = [
  // { id: "move_y", content: { type: "binding", props: { uiEvent: "focus_ud" }, label: "Move Up/Down" } },
  // { id: "move_x", content: { type: "binding", props: { uiEvent: "focus_lr" }, label: "Move Left/Right" } },
  // { id: "reapply", content: { type: "binding", props: { uiEvent: "action_2" }, label: "Reapply" } },
]

const CONTROLLER_MOVE_Y_BINDING = "focus_ud"
const CONTROLLER_MOVE_X_BINDING = "focus_lr"
const CONTROLLER_SURFACE_NORMAL_BINDING = "action_2"
const CONTROLLER_RESET_BINDING = "action_3"
const CONTROLLER_APPLY_BINDING = "ok"
const CONTROLLER_CANCEL_REAPPLY_BINDING = "back"

const CONTROLLER_HINTS = [
  // { id: "move_y", content: { type: "binding", props: { uiEvent: CONTROLLER_MOVE_Y_BINDING }, label: "Move Up/Down" } },
  // { id: "move_x", content: { type: "binding", props: { uiEvent: CONTROLLER_MOVE_X_BINDING }, label: "Move left/right" } },
  // { id: "toggle_surface_normal", content: { type: "binding", props: { uiEvent: CONTROLLER_SURFACE_NORMAL_BINDING }, label: "Toggle Surface Normal" } },
]

const KEYBOARD_HINTS = [
  // { id: "move_up", content: { type: "binding", props: { uiEvent: "focus_u" }, label: "Move Up" } },
  // { id: "move_down", content: { type: "binding", props: { uiEvent: "focus_d" }, label: "Move Down" } },
  // { id: "move_left", content: { type: "binding", props: { uiEvent: "focus_l" }, label: "Move Left" } },
  // { id: "move_right", content: { type: "binding", props: { uiEvent: "focus_r" }, label: "Move Right" } },
]

const MOUSE_HINTS = [{ id: "stamp_decal", content: { type: "binding", props: { action: "stamp_decal" }, label: "Apply" } }]
</script>

<script setup>
import { computed, onBeforeMount, watch, onUnmounted, nextTick, onBeforeUnmount } from "vue"
import { storeToRefs } from "pinia"
import { vBngOnUiNav } from "@/common/directives"
import { BngBinding, BngButton, BngInput, BngSwitch, BngSlider, icons } from "@/common/components/base"
import { useActionHoldService, useLayerSettingsStore } from "@/modules/liveryEditor/stores"
import { BindingButton } from "@/modules/liveryEditor/components"
import { useInfoBar } from "@/services/infoBar"
import useControls from "@/services/controls"
import { useUINavScope } from "@/services/uiNav"
// import { UINavEvents } from "@/bridge/libs"
import { getUINavServiceInstance } from "@/services/uiNav"

const store = useLayerSettingsStore()
const Controls = useControls()
const { showIfController } = storeToRefs(Controls)
const infoBar = useInfoBar()
const actionHoldService = useActionHoldService()

const positionX = computed({
  get: () => (store.cursorData && store.cursorData.position ? store.cursorData.position.x : undefined),
  set: async newValue => await store.setPosition(newValue, store.cursorData.position.y),
})

const positionY = computed({
  get: () => (store.cursorData && store.cursorData.position ? store.cursorData.position.y : undefined),
  set: async newValue => await store.setPosition(store.cursorData.position.x, newValue),
})

const positionMaxX = computed(() => (store.cursorData && store.cursorData.position ? store.cursorData.position.maxX : INPUT_CONTROL_MAX))
const positionMaxY = computed(() => (store.cursorData && store.cursorData.position ? store.cursorData.position.maxY : INPUT_CONTROL_MAX))

const surfaceNormal = computed({
  get: () => (store.cursorData ? store.cursorData.isProjectSurfaceNormal : undefined),
  set: async newValue => await store.setProjectSurfaceNormal(newValue),
})

const mouseMode = computed(() => (store.cursorData ? store.cursorData.isUseMousePos : undefined))
const applied = computed(() => (store.cursorData ? store.cursorData.applied : undefined))
const allowReapply = computed(() => store.active)
const isShowControls = computed(() => !store.cursorData.applied && !mouseMode.value)

const toggleUseSurfaceNormal = () => {
  console.log("toggleUseSurfaceNormal")
  if (!store.cursorData.applied) surfaceNormal.value = !surfaceNormal.value
  else {
    console.log("toggleUseSurfaceNormal returning true")
    return true
  }
}

function cancelApply() {
  if (store.requestApplyActive) store.cancelRequestApply()
  else if (store.reapplyActive) store.cancelReapply()
}

function onReset() {
  store.setPosition(INPUT_DEFAULT_VALUE, INPUT_DEFAULT_VALUE)
}

function onOk() {
  if (!store.requestApplyActive && !store.reapplyActive) store.toggleReapply()
  else return true
}

function onTertiaryAction() {
  if (store.reapplyActive || store.requestApplyActive) onReset()
  else return true
}

// UINAV
useUINavScope("transform-settings")

let useCrossfireValue
onBeforeMount(() => {
  // useCrossfireValue = UINavEvents.useCrossfire
  useCrossfireValue = getUINavServiceInstance().useCrossfire
  // UINavEvents.useCrossfire = false
  getUINavServiceInstance().useCrossfire = false
})

onBeforeUnmount(() => {
  // UINavEvents.useCrossfire = useCrossfireValue
  getUINavServiceInstance().useCrossfire = useCrossfireValue
})

// INFOBAR HINTS
watch(mouseMode, async () => {
  await nextTick(() => setHints())
})

watch(applied, async () => {
  await nextTick(() => setHints())
})

function setHints() {
  let hints

  removeHints()

  if (applied.value) {
    hints = showIfController.value ? APPLIED_CONTROLLER_HINTS : KEYBOARD_HINTS
  } else {
    if (mouseMode.value) {
      hints = MOUSE_HINTS
    } else if (showIfController.value) {
      hints = CONTROLLER_HINTS
    } else {
      hints = KEYBOARD_HINTS
    }
  }

  for (let i = hints.length - 1; i >= 0; i--) {
    infoBar.addHints(hints[i], 0, true)
  }
}

let unwatchGamepad

onBeforeMount(() => {
  unwatchGamepad = watch(
    showIfController,
    async () => {
      await nextTick(() => {
        setHints()
      })
    },
    { immediate: true }
  )
})

onUnmounted(() => {
  actionHoldService.removeAll("transform")
  if (unwatchGamepad) unwatchGamepad()
  removeHints()
})

function removeHints() {
  infoBar.removeHints(...KEYBOARD_HINTS.map(x => x.id))
  infoBar.removeHints(...CONTROLLER_HINTS.map(x => x.id))
  infoBar.removeHints(...APPLIED_CONTROLLER_HINTS.map(x => x.id))
  infoBar.removeHints(...MOUSE_HINTS.map(x => x.id))
}
</script>

<style scoped lang="scss">
.transform-settings {
  display: flex;
  flex-direction: column;
  width: 20rem;

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
  }

  .actions-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
