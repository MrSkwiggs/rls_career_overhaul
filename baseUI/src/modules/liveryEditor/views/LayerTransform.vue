<template>
  <div
    class="layer-transform-view"
    bng-ui-scope="layer-transform-scope"
    v-bng-on-ui-nav:ok="handleOk"
    v-bng-on-ui-nav:back="goBack"
    v-bng-on-ui-nav:menu="saveChanges"
    v-bng-on-ui-nav:focus_lr="handleTranslateScalar"
    v-bng-on-ui-nav:focus_ud="handleTranslateScalar"
    v-bng-on-ui-nav:focus_l.up="handleFocusLinear"
    v-bng-on-ui-nav:focus_l.down="handleFocusLinear"
    v-bng-on-ui-nav:focus_r.up="handleFocusLinear"
    v-bng-on-ui-nav:focus_r.down="handleFocusLinear"
    v-bng-on-ui-nav:focus_u.up="handleFocusLinear"
    v-bng-on-ui-nav:focus_u.down="handleFocusLinear"
    v-bng-on-ui-nav:focus_d.up="handleFocusLinear"
    v-bng-on-ui-nav:focus_d.down="handleFocusLinear"
    v-bng-on-ui-nav:focus_l.up.modified="handleFocusLinear"
    v-bng-on-ui-nav:focus_l.down.modified="handleFocusLinear"
    v-bng-on-ui-nav:focus_r.up.modified="handleFocusLinear"
    v-bng-on-ui-nav:focus_r.down.modified="handleFocusLinear"
    v-bng-on-ui-nav:focus_u.up.modified="handleFocusLinear"
    v-bng-on-ui-nav:focus_u.down.modified="handleFocusLinear"
    v-bng-on-ui-nav:focus_d.up.modified="handleFocusLinear"
    v-bng-on-ui-nav:focus_d.down.modified="handleFocusLinear"
    v-bng-on-ui-nav:rotate_h_cam="handleRotateCam"
    v-bng-on-ui-nav:rotate_v_cam="handleRotateCam"
    v-bng-on-ui-nav:rotate_h_cam.modified="handleRotateCam"
    v-bng-on-ui-nav:rotate_v_cam.modified="handleRotateCam"
    v-bng-on-ui-nav:action_2.up="handlePrecise"
    v-bng-on-ui-nav:action_2.down="handlePrecise"
    v-bng-on-ui-nav:action_2.up.modified="handlePrecise"
    v-bng-on-ui-nav:action_2.down.modified="handlePrecise"
    v-bng-on-ui-nav:tab_l.up="handleModifier"
    v-bng-on-ui-nav:tab_l.down="handleModifier"
    v-bng-on-ui-nav:tab_r.up="handleTabRight"
    v-bng-on-ui-nav:tab_r.down="handleTabRight"
    v-bng-on-ui-nav:action_3="handleAction3"
    v-bng-on-ui-nav:context="toggleEdit"
    v-bng-ui-nav-label:focus_lr="hintLabels['focus_lr']"
    v-bng-ui-nav-label:focus_ud="hintLabels['focus_ud']"
    v-bng-ui-nav-label:focus_l="hintLabels['focus_l']"
    v-bng-ui-nav-label:focus_r="hintLabels['focus_r']"
    v-bng-ui-nav-label:focus_u="hintLabels['focus_u']"
    v-bng-ui-nav-label:focus_d="hintLabels['focus_d']"
    v-bng-ui-nav-label:rotate_h_cam="hintLabels['rotate_h_cam']"
    v-bng-ui-nav-label:rotate_v_cam="hintLabels['rotate_v_cam']"
    v-bng-ui-nav-label:action_2="hintLabels['action_2']"
    v-bng-ui-nav-label:action_3="hintLabels['action_3']"
    v-bng-ui-nav-label:tab_r="hintLabels['tab_r']"
    v-bng-ui-nav-label:tab_l="hintLabels['tab_l']"
    v-bng-ui-nav-label:ok="hintLabels['ok']"
    v-bng-ui-nav-label:back="hintLabels['back']">
    <div class="header">
      <LiveryEditorHeader />
    </div>
    <div class="main-view-content">
      <div class="inspector-container">
        <LayerInspectorBase v-bng-blur :heading="'Transform'">
          <div class="transform-inspector" :class="{ 'inspector-editing': isEdit }">
            <div class="transform-setting-item">
              <div class="setting-item-name">Position</div>
              <div v-if="isRepositionActive && isUseMouse">
                <span>Using mouse position</span>
              </div>
              <div v-else-if="isEdit" class="transform-setting-inputs">
                <div class="slider-text-container">
                  <BngInput v-model="positionX" type="number" :step="0.001" :min="INPUT_MIN" :max="1.0" prefix="X" />
                  <BngSlider v-model="positionX" :step="0.001" :min="INPUT_MIN" :max="1.0" />
                </div>
                <div class="slider-text-container">
                  <BngInput v-model="positionY" type="number" :step="0.001" :min="INPUT_MIN" :max="1.0" prefix="Y" />
                  <BngSlider v-model="positionY" :step="0.001" :min="INPUT_MIN" :max="1.0" />
                </div>
              </div>
              <div v-else class="display-values-container">
                <BngPropVal :keyLabel="'X'" :valueLabel="positionX" />
                <BngPropVal :keyLabel="'Y'" :valueLabel="positionY" />
              </div>
              <BngButton v-if="!isRepositionActive" accent="outlined" class="reposition-button" @click="toggleReposition">
                <BngBinding uiEvent="action_3" />
                <span class="reposition-button-label">Reproject and Position</span>
              </BngButton>
            </div>
            <BngDivider v-if="!isRepositionActive" />
            <div v-if="!isRepositionActive" class="transform-setting-item">
              <div class="setting-item-name">Scale</div>
              <div v-if="isEdit" class="transform-setting-inputs">
                <div class="slider-text-container">
                  <BngInput v-model="scaleX" type="number" prefix="X" :step="0.01" :min="INPUT_MIN" :max="15.0" />
                  <BngSlider v-model="scaleX" :step="0.01" :min="INPUT_MIN" :max="15.0" />
                </div>
                <div class="slider-text-container">
                  <BngInput v-model="scaleY" type="number" :step="0.01" :min="INPUT_MIN" :max="15.0" prefix="Y" />
                  <BngSlider v-model="scaleY" :step="0.01" :min="INPUT_MIN" :max="15.0" />
                </div>
              </div>
              <div v-else class="display-values-container">
                <BngPropVal :keyLabel="'X'" :valueLabel="scaleX" />
                <BngPropVal :keyLabel="'Y'" :valueLabel="scaleY" />
              </div>
            </div>
            <BngDivider v-if="!isRepositionActive" />
            <div v-if="!isRepositionActive" class="transform-setting-item">
              <div class="setting-item-name">Rotate</div>
              <div v-if="isEdit" class="transform-setting-inputs">
                <div class="slider-text-container">
                  <BngInput v-model="rotation" type="number" :step="0.1" :min="INPUT_MIN" :max="359.9" suffix="deg" />
                  <BngSlider v-model="rotation" :step="0.1" :min="INPUT_MIN" :max="359.9" />
                </div>
              </div>
              <div v-else class="display-values-container">
                <BngPropVal :keyLabel="'deg'" :valueLabel="rotation" />
              </div>
            </div>
            <BngDivider v-if="!isRepositionActive" />
            <div v-if="!isRepositionActive" class="transform-setting-item">
              <div class="setting-item-name">Skew</div>
              <div v-if="isEdit" class="transform-setting-inputs">
                <div class="slider-text-container">
                  <BngInput v-model="skewX" type="number" :step="0.01" :min="INPUT_MIN" :max="INPUT_MAX" prefix="X" />
                  <BngSlider v-model="skewX" :step="0.01" :min="INPUT_MIN" :max="INPUT_MAX" />
                </div>
                <div class="slider-text-container">
                  <BngInput v-model="skewY" type="number" :step="0.01" :min="INPUT_MIN" :max="INPUT_MAX" prefix="Y" />
                  <BngSlider v-model="skewY" :step="0.01" :min="INPUT_MIN" :max="INPUT_MAX" />
                </div>
              </div>
              <div v-else class="display-values-container">
                <BngPropVal :keyLabel="'X'" :valueLabel="skewX" />
                <BngPropVal :keyLabel="'Y'" :valueLabel="skewY" />
              </div>
            </div>
            <BngButton
              v-if="!isRepositionActive || !isUseMouse"
              accent="text"
              class="inspector-edit-button"
              v-bng-on-ui-nav:ok.focusRequired="() => (isEdit = !isEdit)"
              @click="isEdit = !isEdit">
              <BngBinding uiEvent="context" />
              <span class="edit-button-label">
                Toggle
                {{ isEdit ? "Simple" : "Advance" }}
              </span>
            </BngButton>
          </div>
        </LayerInspectorBase>

        <BngButton v-if="!isRepositionActive || !isUseMouse" class="apply-button" v-bng-on-ui-nav:ok.focusRequired="handleOk" @click="handleOk">
          <BngBinding uiEvent="ok" />
          <span>Apply</span>
        </BngButton>
      </div>
    </div>
  </div>
</template>

<script>
const INPUT_MIN = 0
const INPUT_MAX = 1
</script>

<script setup>
import { computed, onBeforeMount, onBeforeUnmount, onMounted, reactive, ref, watchEffect } from "vue"
import { useInfoBar } from "@/services/infoBar"
import { useUINavScope } from "@/services/uiNav"
import { vBngOnUiNav, vBngUiNavLabel, vBngBlur } from "@/common/directives"
import { BngBinding, BngButton, BngDivider, BngInput, BngPropVal, BngSlider } from "@/common/components/base"
import { useEditorHeaderStore } from "@/modules/liveryEditor/stores"
import { LiveryEditorHeader } from "@/modules/liveryEditor/components"
import { lua, useBridge } from "@/bridge"
import { useUINavBlocker } from "@/services/uiNavTracker"
import { openConfirmation } from "@/services/popup"
import LayerInspectorBase from "../components/layerSettings/LayerInspectorBase.vue"

const headerStore = useEditorHeaderStore()
const infobar = useInfoBar()
const navBlocker = useUINavBlocker()
const { events } = useBridge()

useUINavScope("layer-transform-scope")

const transformState = reactive({
  positionX: 0,
  positionY: 0,
  scaleX: 0,
  scaleY: 0,
  skewX: 0,
  skewY: 0,
  rotation: 0,
})
const isHoldModifier = ref(false)
const isPreciseActive = ref(false)
const isTabRightActive = ref(false)
const stateData = ref(null)
const isEdit = ref(false)
const isReapplying = ref(false)
const isRepositionActive = ref(false)
const isUseMouse = ref(false)

const positionX = computed({
  get: () => transformState.positionX,
  set: newValue => {
    const value = assertInt(newValue)
    transformState.positionX = value
    if (isEdit.value) lua.extensions.ui_liveryEditor_layerEdit.setPosition(value, transformState.positionY)
  },
})
const positionY = computed({
  get: () => transformState.positionY,
  set: newValue => {
    const value = assertInt(newValue)
    transformState.positionY = value
    if (isEdit.value) lua.extensions.ui_liveryEditor_layerEdit.setPosition(transformState.positionX, value)
  },
})
const scaleX = computed({
  get: () => transformState.scaleX,
  set: newValue => {
    const value = assertInt(newValue)
    transformState.scaleX = value
    if (isEdit.value) lua.extensions.ui_liveryEditor_layerEdit.setScale(value, transformState.scaleY)
  },
})
const scaleY = computed({
  get: () => transformState.scaleY,
  set: newValue => {
    const value = assertInt(newValue)
    transformState.scaleY = value
    if (isEdit.value) lua.extensions.ui_liveryEditor_layerEdit.setScale(transformState.scaleX, value)
  },
})
const skewX = computed({
  get: () => transformState.skewX,
  set: newValue => {
    const value = assertInt(newValue)
    transformState.skewX = value
    if (isEdit.value) lua.extensions.ui_liveryEditor_layerEdit.setSkew(value, transformState.skewY)
  },
})
const skewY = computed({
  get: () => transformState.skewY,
  set: newValue => {
    const value = assertInt(newValue)
    transformState.skewY = value
    if (isEdit.value) lua.extensions.ui_liveryEditor_layerEdit.setSkew(transformState.skewX, value)
  },
})
const rotation = computed({
  get: () => transformState.rotation,
  set: newValue => {
    const value = assertInt(newValue)
    transformState.rotation = value
    if (isEdit.value) lua.extensions.ui_liveryEditor_layerEdit.setRotation(value)
  },
})

const hintLabels = computed(() => {
  const labels = {}
  const focusLabel = "Move"
  const focusEvents = ["focus_l", "focus_u", "focus_r", "focus_d", "focus_lr", "focus_ud"]

  let rotateCamLabel = "Scale"
  if (isTabRightActive.value) rotateCamLabel = "Pan"
  else if (isHoldModifier.value) rotateCamLabel = "Skew"
  const rotateCamEvents = ["rotate_h_cam", "rotate_v_cam"]

  if (!isTabRightActive.value && !isHoldModifier.value) {
    focusEvents.forEach(uiEvent => (labels[uiEvent] = focusLabel))
    rotateCamEvents.forEach(uiEvent => (labels[uiEvent] = rotateCamLabel))
  } else {
    rotateCamEvents.forEach(uiEvent => (labels[uiEvent] = rotateCamLabel))
  }

  labels["tab_l"] = isTabRightActive.value ? undefined : "[Hold] Skew"
  labels["tab_r"] = isHoldModifier.value ? undefined : "[Hold] Camera"
  labels["action_2"] = isTabRightActive.value ? undefined : "[Hold] Precise"

  return labels
})

watchEffect(() => {
  navBlocker.clear()

  if (isTabRightActive.value) navBlocker.allowOnly(["rotate_h_cam", "rotate_v_cam", "tab_r"])

  if (isHoldModifier.value) navBlocker.allowOnly(["rotate_h_cam", "rotate_v_cam", "action_2", "tab_l"])
})

onBeforeMount(() => {
  headerStore.setPreheader(["Transform"])
})

onMounted(async () => {
  infobar.visible = true
  infobar.showSysInfo = true
  events.on("liveryEditor_layerEdit_state", onStateData)
  events.on("liveryEditor_layerEdit_initialLayerData", onInitialLayerData)
  events.on("liveryEditor_layerEdit_repositionSuccess", onRepositionSuccess)
  events.on("liveryEditor_layerEdit_rotationChanged", onRotationChanged)
  events.on("liveryEditor_layerEdit_positionChanged", onPositionChanged)
  events.on("liveryEditor_layerEdit_scaleChanged", onScaleChanged)
  events.on("liveryEditor_layerEdit_skewChanged", onSkewChanged)
  await lua.extensions.ui_liveryEditor_layerEdit.requestStateData()
  await lua.extensions.ui_liveryEditor_layerEdit.requestInitialLayerData()
})

onBeforeUnmount(async () => {
  events.off("liveryEditor_layerEdit_state", onStateData)
  events.off("liveryEditor_layerEdit_initialLayerData", onInitialLayerData)
  events.off("liveryEditor_layerEdit_repositionSuccess", onRepositionSuccess)
  events.off("liveryEditor_layerEdit_rotationChanged", onRotationChanged)
  events.off("liveryEditor_layerEdit_positionChanged", onPositionChanged)
  events.off("liveryEditor_layerEdit_scaleChanged", onScaleChanged)
  events.off("liveryEditor_layerEdit_skewChanged", onSkewChanged)
})

function onPositionChanged(position) {
  positionX.value = position.x
  positionY.value = position.y
}

function onRotationChanged(value) {
  transformState.rotation = value
}

function onSkewChanged(skew) {
  skewX.value = skew.x
  skewY.value = skew.y
}

function onScaleChanged(scale) {
  scaleX.value = scale.x
  scaleY.value = scale.y
}

function onRepositionSuccess() {
  isRepositionActive.value = !isRepositionActive.value
}

function handleModifier(element) {
  isHoldModifier.value = element.detail.value === 1
}

function handlePrecise(element) {
  const isPrecise = element.detail.value === 1
  isPreciseActive.value = isPrecise
  lua.extensions.ui_liveryEditor_layerEdit.holdPrecise(isPrecise)
}

function handleTabRight(element) {
  isTabRightActive.value = element.detail.value === 1
}

function handleAction3(element) {
  if (isRepositionActive.value) {
    toggleUseMouseOrCursor(element)
  } else {
    toggleReposition(element)
  }
}

function toggleReposition(element) {
  const isReposition = isRepositionActive.value

  if (isReposition) {
    lua.extensions.ui_liveryEditor_layerEdit.cancelReposition()
  } else {
    lua.extensions.ui_liveryEditor_layerEdit.requestReposition()
  }

  isRepositionActive.value = !isReposition
}

function toggleUseMouseOrCursor(element) {
  if (!isRepositionActive.value) return true

  const res = lua.extensions.ui_liveryEditor_layerEdit.toggleUseMouseOrCursor()
  res.then(data => {
    isUseMouse.value = data.isUseMouse
  })
}

function toggleEdit(element) {
  if (isRepositionActive.value && isUseMouse.value) return
  const newValue = !isEdit.value
  isEdit.value = newValue
  const res = lua.extensions.ui_liveryEditor_layerEdit.setAllowRotationAction(!newValue)
  res.then(() => {})
}

function handleFocusLinear(element) {
  if (isEdit.value) return

  const name = element.detail.name
  const value = element.detail.value

  const axis = name === "focus_d" || name === "focus_u" ? "y" : "x"
  const direction = name === "focus_d" || name === "focus_l" ? -1 : 1

  lua.extensions.ui_liveryEditor_layerEdit.holdTranslate(axis, direction * value)
}

function handleTranslateScalar(element) {
  if (isEdit.value) return true

  const name = element.detail.name
  const value = element.detail.value
  const axis = name === "focus_lr" ? "x" : "y"

  lua.extensions.ui_liveryEditor_layerEdit.holdTranslateScalar(axis, value)
}

function handleRotateCam(element) {
  // tabRight is pressed, activate camera controls instead
  if (isRepositionActive.value || isTabRightActive.value) return true

  const name = element.detail.name
  const value = element.detail.value

  const axis = name === "rotate_h_cam" ? "x" : "y"

  if (isHoldModifier.value) {
    lua.extensions.ui_liveryEditor_layerEdit.holdSkew(axis, value)
  } else {
    lua.extensions.ui_liveryEditor_layerEdit.holdScale(axis, value)
  }
}

function goBack(event) {
  if (isRepositionActive.value) {
    toggleReposition()
  } else if (isEdit.value) {
    toggleEdit()
  } else {
    // clear all blocked events

    openConfirmation("Exit", "Exit and lose unsaved changes?").then(res => {
      if (res) {
        lua.extensions.ui_liveryEditor_layerEdit.endTransform()
        const cancelRes = lua.extensions.ui_liveryEditor_layerEdit.cancelChanges()
        cancelRes.then(() => {
          window.bngVue.gotoGameState("LiveryDecals")
        })
      }
    })
  }

  event.stopPropagation()
}

function handleOk() {
  if (isRepositionActive.value) {
    lua.extensions.ui_liveryEditor_layerEdit.applyReposition()
  } else {
    lua.extensions.ui_liveryEditor_layerEdit.endTransform()
    const res = lua.extensions.ui_liveryEditor_layerEdit.saveChanges(false)

    res.then(() => {
      window.bngVue.gotoGameState("LiveryDecals")
    })
  }
}

function saveChanges() {
  const res = lua.extensions.ui_liveryEditor_layerEdit.saveChanges(false)
  res.then(() => {
    window.bngVue.gotoGameState("LiveryDecals")
  })
}

function onStateData(data) {
  stateData.value = data
  isReapplying.value = data.isStampReapplying
}

function onInitialLayerData(data) {
  positionX.value = data.position.x
  positionY.value = data.position.y
  scaleX.value = data.scale.x
  scaleY.value = data.scale.y
  skewX.value = data.skew.x
  skewY.value = data.skew.y
  rotation.value = data.rotation
}

function assertInt(value) {
  return typeof value === "string" ? +value : value
}
</script>

<style lang="scss" scoped>
$infobarHeight: 4rem;

.layer-transform-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 0.5rem;
  color: white;

  margin-bottom: $infobarHeight;

  > .main-view-content {
    position: relative;
    display: flex;

    > .inspector-container {
      position: absolute;
      top: 0;
      right: 0;
    }
  }
}

.reposition-button {
  width: 100%;

  .reposition-button-label {
    padding-right: 0.25em;
  }
}

.apply-button {
  width: 100%;
}

.stamp-actions-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5em 0;
  height: 4rem;
}

.transform-inspector {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  &.inspector-editing > .transform-setting-item > .transform-setting-inputs {
    display: flex;
    flex-direction: column;

    > .slider-text-container > :first-child {
      width: 12rem;
      margin-right: 0.5rem;
    }
  }

  > .transform-setting-item {
    width: 100%;
    padding: 0 0.5rem 0.5rem;

    > .setting-item-name {
      font-size: 1.125em;
      font-weight: 600;
    }

    > .transform-setting-inputs {
      display: flex;
      flex-direction: row;

      > :first-child > :first-child {
        margin-right: 0.5rem;
      }
    }
  }

  > .inspector-edit-button {
    width: 100%;
  }
}

.slider-text-container {
  display: flex;
  align-items: center;
  padding-top: 0.5rem;

  > :first-child {
    max-width: 10rem;
  }
}

.display-values-container {
  display: flex;
  align-items: center;
  font-size: 1.15em;
  font-weight: 600;
  padding: 0.5rem;

  > * {
    flex: 1 1 auto;
  }
}
</style>
