<template>
  <div
    class="mirror-settings"
    bng-ui-scope="mirror-settings"
    v-bng-on-ui-nav:action_3="onTertiaryAction"
    v-bng-on-ui-nav:focus_l="toggleMirror"
    v-bng-on-ui-nav:focus_r="toggleFlipped"
    v-bng-on-ui-nav:focus_u.up="changeOffset"
    v-bng-on-ui-nav:focus_u.down="changeOffset"
    v-bng-on-ui-nav:focus_d.up="changeOffset"
    v-bng-on-ui-nav:focus_d.down="changeOffset"
    v-bng-on-ui-nav:focus_ud="changeOffsetScalar">
    <div class="setting-item">
      <BngSwitch v-model="mirror">Mirror</BngSwitch>
      <BngBinding :uiEvent="MIRROR_BINDING" deviceMask="xinput" />
    </div>
    <div class="setting-item offset-item">
      <BngSwitch v-model="flip" :disabled="!mirror">Flip</BngSwitch>
      <BngBinding :uiEvent="FLIP_BINDING" deviceMask="xinput" :class="{ disabled: !mirror }" />
    </div>
    <div class="setting-item offset-item">
      <BngInput v-model="offset" :step="0.1" :disabled="!mirror" type="number" prefix="Offset" class="setting-input" />
      <BngBinding :uiEvent="CONTROLLER_OFFSET_BINDING" deviceMask="xinput" :class="{ disabled: !mirror }" />
    </div>
    <!-- <div v-if="!store.cursorData.applied" class="setting-item reset-container">
      <BngButton label="Reset" accent="secondary" @click="onReset">
        <BngBinding :uiEvent="CONTROLLER_RESET_BINDING" deviceMask="xinput" />
      </BngButton>
    </div> -->
  </div>
</template>

<script>
const FOCUS_LD_TRIGGER_VALUE = -0.999
const FOCUS_RU_TRIGGER_VALUE = 0.999
const FOCUS_HOLD_INTERVAL_MS = 250

const MIRROR_BINDING = "focus_l"
const FLIP_BINDING = "focus_r"
const CONTROLLER_OFFSET_BINDING = "focus_ud"
const CONTROLLER_RESET_BINDING = "action_3"
const KEYBOARD_OFFSET_UP_BINDING = "focus_u"
const KEYBOARD_OFFSET_DOWN_BINDING = "focus_d"

const CONTROLLER_HINTS = [
  // { id: "toggle_mirror", content: { type: "binding", props: { uiEvent: MIRROR_BINDING }, label: "Toggle Mirror" } },
  // { id: "toggle_flip", content: { type: "binding", props: { uiEvent: FLIP_BINDING }, label: "Toggle Flip" } },
  // { id: "change_offset", content: { type: "binding", props: { uiEvent: CONTROLLER_OFFSET_BINDING }, label: "Change Offset" } },
]

const KEYBOARD_HINTS = [
  // { id: "toggle_mirror", content: { type: "binding", props: { uiEvent: MIRROR_BINDING }, label: "Toggle Mirror" } },
  // { id: "toggle_flip", content: { type: "binding", props: { uiEvent: FLIP_BINDING }, label: "Toggle Flip" } },
  // { id: "increase_offset", content: { type: "binding", props: { uiEvent: KEYBOARD_OFFSET_UP_BINDING }, label: "Increase Offset" } },
  // { id: "decrease_offset", content: { type: "binding", props: { uiEvent: KEYBOARD_OFFSET_DOWN_BINDING }, label: "Decrease Offset" } },
]
</script>

<script setup>
import { computed, reactive, onBeforeMount, onBeforeUnmount, onUnmounted, watch, nextTick } from "vue"
import { storeToRefs } from "pinia"
import { useLayerSettingsStore } from "../../stores/layerSettingsStore"
import { vBngOnUiNav } from "@/common/directives"
import { BngBinding, BngButton, BngInput, BngSwitch, icons } from "@/common/components/base"
import { useInfoBar } from "@/services/infoBar"
import useControls from "@/services/controls"
import { useUINavScope } from "@/services/uiNav"
// import { UINavEvents } from "@/bridge/libs"
import { getUINavServiceInstance } from "@/services/uiNav"

const store = useLayerSettingsStore()
const Controls = useControls()
const { showIfController } = storeToRefs(Controls)
const infoBar = useInfoBar()

const inputNavStates = reactive({
  focusXLatestValue: 0,
  focusYLatestValue: 0,
  holdEventLatest: null,
  holdInterval: null,
})

const mirror = computed({
  get: () => (store.cursorData ? store.cursorData.mirrored : undefined),
  set: async newValue => await store.setMirrored(newValue, store.cursorData.flipMirroredDecal),
})

const flip = computed({
  get: () => (store.cursorData ? store.cursorData.flipMirroredDecal : undefined),
  set: async newValue => await store.setMirrored(store.cursorData.mirrored, newValue),
})

const offset = computed({
  get: () => (store.cursorData ? store.cursorData.mirrorOffset : undefined),
  set: async newValue => await store.setMirrorOffset(newValue),
})

const toggleMirror = () => (mirror.value = !mirror.value)
const toggleFlipped = () => {
  if (!mirror.value) return
  flip.value = !flip.value
}

const changeOffset = element => {
  if (!mirror.value) return

  const eventName = element.detail.name
  const direction = eventName === "focus_d" ? -1 : 1
  const isPressed = element.detail.value

  if (inputNavStates.holdEventLatest === eventName && !isPressed && inputNavStates.holdInterval) {
    clearInterval(inputNavStates.holdInterval)
    inputNavStates.holdInterval = null
  }

  // Check latest event value against direction and ignore if controller stick is going back to normal position
  if (direction > 0 && isPressed) {
    doHoldAction(() => store.setMirrorOffset(offset.value + 1), eventName)
  } else if (direction < 0 && isPressed) {
    doHoldAction(() => store.setMirrorOffset(offset.value - 1), eventName)
  }
}

const changeOffsetScalar = element => {
  if (!mirror.value) return

  const eventName = element.detail.name
  const direction = element.detail.value

  if (inputNavStates.holdEventLatest === eventName && inputNavStates.holdInterval) {
    clearInterval(inputNavStates.holdInterval)
  }

  // Check latest event value against direction and ignore if controller stick is going back to normal position
  if (direction > FOCUS_RU_TRIGGER_VALUE && direction > inputNavStates.focusXLatestValue) {
    doHoldAction(() => store.setMirrorOffset(offset.value + 1), eventName)
  } else if (direction < FOCUS_LD_TRIGGER_VALUE && direction < inputNavStates.focusXLatestValue) {
    doHoldAction(() => store.setMirrorOffset(offset.value - 1), eventName)
  }

  inputNavStates.focusXLatestValue = direction
}

function onReset() {
  store.setMirrored(false, false)
  store.setMirrorOffset(0)
}

function onTertiaryAction() {
  if (store.reapplyActive || store.requestApplyActive) onReset()
  else return true
}

function doHoldAction(callbackFn, eventName) {
  if (inputNavStates.holdInterval) {
    clearInterval(inputNavStates.holdInterval)
    inputNavStates.holdInterval = null
  }

  callbackFn()

  inputNavStates.holdInterval = setInterval(callbackFn, FOCUS_HOLD_INTERVAL_MS)
  inputNavStates.holdEventLatest = eventName
}

// UINAV
useUINavScope("mirror-settings")

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
  let hints

  removeHints()

  if (showIfController.value) {
    hints = CONTROLLER_HINTS
  } else {
    hints = KEYBOARD_HINTS
  }

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
$itemActiveBackground: var(--bng-orange-b400);

.setting-item {
  align-items: center;

  > * {
    flex-grow: 0 !important;
    align-self: baseline !important;

    &:last-child {
      margin-left: 0.5rem;
    }
  }
}

.offset-item {
  margin-left: 1.5rem;
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
