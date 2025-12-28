<template>
  <div
    v-if="store.active"
    bng-ui-scope="liveryeditor-editmode"
    class="liveryeditor-editmode-layout"
    v-bng-on-ui-nav:ok="onOk"
    v-bng-on-ui-nav:context="onContextMenu"
    v-bng-on-ui-nav:advanced="onAdvanced"
    v-bng-on-ui-nav:back="onBack"
    v-bng-on-ui-nav:menu="confirmSaveChanges"
    v-bng-on-ui-nav:action_2="onSecondaryAction"
    v-bng-on-ui-nav:action_3="onTertiaryAction"
    v-bng-on-ui-nav:action_4="onQuaternaryAction"
    v-bng-on-ui-nav:rotate_h_cam="onRotateHCam"
    v-bng-on-ui-nav:rotate_v_cam="onRotateVCam">
    <div class="layers-preview-container">
      <BngImageTile
        v-if="store.appliedLayers && !store.requestApplyActive"
        v-bng-blur
        :icon="icons.decal"
        :class="{ cancel: store.requestApplyActive }"
        :disabled="store.reapplyActive ? 'disabled' : ''"
        ratio="1:1"
        class="add-item"
        @click="onAddOrChangeDecal">
        <label>Add</label>
      </BngImageTile>
      <div v-else v-bng-blur class="layer-ghost-wrapper" @click="onAddOrChangeDecal">
        <DecalPreviewTile :textureImage="store.cursorData.decalTexturePath" :textureColor="store.cursorData.color" />
        <BngIcon class="hover-icon" :type="icons.edit" />
      </div>
      <EditModeLayersPreview v-if="store.appliedLayers && store.appliedLayers.length > 0" v-bng-blur :contextMenuName="contextMenuName" />
    </div>
    <div class="layer-settings-wrapper">
      <LayerSettings />
    </div>

    <BngPopoverContent
      v-if="store.appliedLayers && store.appliedLayers.length > 0 && store.activeLayerUid !== null && store.activeLayerUid !== undefined"
      :name="contextMenuName">
      <div class="layer-context-menu" :style="CONTEXT_MENU_STYLES">
        <BngButton @click.stop="store.requestChangeDecal">Change Decal</BngButton>
        <BngButton :disabled="store.appliedLayers.length <= 1" accent="attention" @click.stop="removeLayer">Delete</BngButton>
      </div>
    </BngPopoverContent>
  </div>
</template>
<script>
const SAVE_TYPES = {
  default: 1,
  asGroup: 2,
}

const FOCUS_LD_TRIGGER_VALUE = -0.999
const FOCUS_RU_TRIGGER_VALUE = 0.999

const HEADER_TEXT = "Edit Mode"

const CONTEXT_MENU_NAME = "context-menu"
const CONTROLLER_EXIT_BINDING = "back"
const CONTROLLER_SAVE_BINDING = "menu"

const APPLY_DEFAULT_HINTS = [
  { id: "apply", content: { type: "binding", props: { uiEvent: "ok" }, label: "Apply" } },
  { id: "cancel", content: { type: "binding", props: { uiEvent: "back" }, label: "Cancel" } },
]

const APPLY_MOUSE_HINTS = [{ id: "cancel", content: { type: "binding", props: { uiEvent: "back" }, label: "Cancel" } }]

const FREECAM_CONTROLLER_HINTS = [{ id: "toggle_freecam", content: { type: "binding", props: { uiEvent: "action_4" }, label: "Toggle View Point" } }]
const VIEWPOINT_CONTROLLER_HINTS = [
  // { id: "change_camera_v", content: { type: "binding", props: { uiEvent: "rotate_v_cam" } } },
  // { id: "change_camera_h", content: { type: "binding", props: { uiEvent: "rotate_h_cam" }, label: "Change Side" } },
  { id: "toggle_freecam", content: { type: "binding", props: { uiEvent: "action_4" }, label: "Toggle Free Cam" } },
]

const DELETE_LAYER_HINT = { id: "delete", content: { type: "binding", props: { uiEvent: "advanced" }, label: "Delete" } }
</script>

<script setup>
import { ref, computed, onBeforeMount, onMounted, onUnmounted, shallowRef, watchEffect, watch, nextTick } from "vue"
import { storeToRefs } from "pinia"
import { useLiveryEditorStore, useLayerSettingsStore, useEditorHeaderStore, useActionHoldService } from "@/modules/liveryEditor/stores"
import EditModeLayersPreview from "@/modules/liveryEditor/components/editMode/EditModeLayersPreview.vue"
import { LayerSettings } from "@/modules/liveryEditor/components/layerSettings"
import { vBngOnUiNav, vBngBlur } from "@/common/directives"
// import { UINavEvents } from "@/bridge/libs"
import { getUINavServiceInstance } from "@/services/uiNav"
import { openConfirmation } from "@/services/popup"
import { $translate } from "@/services/translation"
import { BngImageTile, BngIcon, BngPopoverContent, BngButton, BngSwitch, ACCENTS, icons } from "@/common/components/base"
import { getAssetURL } from "@/utils"
import DecalPreviewTile from "@/modules/liveryEditor/components/DecalPreviewTile.vue"
import { BindingButton } from "@/modules/liveryEditor/components"
import { usePopover } from "@/services/popover"
import { useInfoBar } from "@/services/infoBar"
import useControls from "@/services/controls"

const infoBar = useInfoBar()
const Controls = useControls()
const { showIfController } = storeToRefs(Controls)
const actionHoldService = useActionHoldService()

const rootStore = useLiveryEditorStore()
const store = useLayerSettingsStore()
const popover = usePopover()

const freecam = ref(false)
const CONTEXT_MENU_STYLES = ref({
  display: "flex",
  "flex-direction": "column",
})

const contextMenuName = ref("context-menu")

const alphaTextureBackground = computed(() => `url(${getAssetURL("images/alpha_texture.png")}`)

let unwatchGamepad

onBeforeMount(async () => {
  await store.getInitialData()
  unwatchGamepad = watch(showIfController, () => {
    actionHoldService.clear()
  })
})

onMounted(() => {
  store.init()
  infoBar.clearHints()
})

onUnmounted(() => {
  infoBar.clearHints()
})

async function onAddOrChangeDecal() {
  await rootStore.toggleShowDecalSelector()
}

function onBack() {
  if (popover.isShown(CONTEXT_MENU_NAME)) {
    popover.hide(CONTEXT_MENU_NAME)
  } else if (store.appliedLayers && store.appliedLayers.length > 0 && store.requestApplyActive) {
    store.cancelRequestApply()
  } else if (store.appliedLayers && store.reapplyActive) {
    store.cancelReapply()
  } else {
    confirmCancelChanges()
  }
}

function onContextMenu() {
  if (store.reapplyActive) {
    store.requestChangeDecal()
  } else if (store.requestApplyActive) {
    rootStore.toggleShowDecalSelector()
  } else {
    store.duplicateActiveLayer()
  }
}

function onAdvanced() {
  if (!store.requestApplyActive && !store.reapplyActive && store.activeLayerUid && store.appliedLayers.length > 1) {
    getUINavServiceInstance().useCrossfire = true

    openConfirmation("Delete Decal").then(res => {
      if (res) store.removeAppliedLayer(store.activeLayerUid)
      getUINavServiceInstance().useCrossfire = true
    })
  }
}

function onOk() {
  if (store.requestApplyActive || store.reapplyActive) {
    store.apply()
  } else {
    // store.toggleReapply()
  }
}

function confirmSaveChanges() {
  if (!store.appliedLayers || store.appliedLayers.length === 0) return

  // Re-enable crossfire to make popup work
  // UINavEvents.useCrossfire = true
  getUINavServiceInstance().useCrossfire = true

  const buttons = [
    { label: $translate.instant("ui.common.cancel"), value: undefined, extras: { cancel: true, accent: ACCENTS.secondary } },
    { label: $translate.instant("ui.common.save"), value: SAVE_TYPES.default, extras: { default: true } },
  ]

  openConfirmation("Save", "Save changes and exit edit mode?", buttons).then(res => {
    if (res) {
      store.saveChanges()
    } else {
      // UINavEvents.useCrossfire = false
      getUINavServiceInstance().useCrossfire = false
    }
  })
}

async function confirmCancelChanges() {
  // Re-enable crossfire to make popup work
  // UINavEvents.useCrossfire = true
  getUINavServiceInstance().useCrossfire = true

  const hasChanges = store.appliedLayers && store.appliedLayers.length > 0
  const msg = hasChanges ? "Exit edit mode and lose all changes?" : "Exit Edit Mode?"
  const res = await openConfirmation("Exit", msg)

  if (res) {
    if (hasChanges) await store.cancelChanges()
    await store.deactivate()
  } else {
    // UINavEvents.useCrossfire = false
    getUINavServiceInstance().useCrossfire = false
  }
}

const removeLayer = () => {
  store.removeAppliedLayer(store.activeLayerUid)
  popover.hide(CONTEXT_MENU_NAME)
}

function onSecondaryAction(element) {
  // if (store.cursorData.applied && !store.reapplyActive) store.reapplyActive = true
  if (!store.reapplyActive && !store.requestApplyActive) store.requestApply()
}

function onTertiaryAction(element) {
  if (store.cursorData.applied && !store.reapplyActive) store.toggleHighlightActive()
}

function onQuaternaryAction(element) {
  freecam.value = !freecam.value
}

function onRotateHCam(element) {
  // console.log("onRotateHCam", element)

  if (freecam.value) return true

  const direction = element.detail.value

  if (direction >= FOCUS_RU_TRIGGER_VALUE || direction <= FOCUS_LD_TRIGGER_VALUE) {
    // reverse the direction to match orbit cam
    rootStore.switchOrthographicViewByDirection(direction > 0 ? -1 : 1, 0)
  }
}

function onRotateVCam(element) {
  // console.log("onRotateVCam", element)
  if (freecam.value) return true

  const direction = element.detail.value

  if (direction >= FOCUS_RU_TRIGGER_VALUE || direction <= FOCUS_LD_TRIGGER_VALUE) {
    // reverse the direction to match orbit cam
    rootStore.switchOrthographicViewByDirection(0, direction > 0 ? -1 : 1)
  }
}

// INFOBAR
const APPLY_CONTROLLER_HINTS = [
  { id: "change_decal", content: { type: "binding", props: { uiEvent: "context" }, label: "Change Decal" }, action: store.requestChangeDecal },
  // { id: "reset_settings", content: { type: "binding", props: { uiEvent: "action_3" }, label: "Reset Settings" }, action: resetSettings },
]

const DEFAULT_HINTS = [
  {
    id: "duplicate_decal",
    content: { type: "binding", props: { action: "duplicate_active_layer" }, label: "Duplicate Decal", action: store.duplicateActiveLayer },
  },
  {
    id: "activate_previous_decal",
    content: { type: "binding", props: { action: "activate_previous_layer" }, label: "Edit Previous Decal" },
  },
  {
    id: "activate_next_decal",
    content: { type: "binding", props: { action: "activate_next_layer" }, label: "Edit Next Decal" },
  },
  { id: "save", content: { type: "binding", props: { uiEvent: "menu" }, label: "Save" } },
  { id: "exit", content: { type: "binding", props: { uiEvent: "back" }, label: "Exit" } },
]

const DEFAULT_CONTROLLER_HINTS = [
  { id: "apply_or_new", content: { type: "binding", props: { uiEvent: "action_2" }, label: "New Decal" } },
  {
    id: "delete_decal",
    content: { type: "binding", props: { uiEvent: "advanced" }, label: "Delete Decal", action: () => store.removeAppliedLayer(store.activeLayerUid) },
  },
  { id: "duplicate_decal", content: { type: "binding", props: { uiEvent: "context" }, label: "Duplicate Decal" }, action: () => store.duplicateActiveLayer() },
  {
    id: "highlight_decal",
    content: { type: "binding", props: { uiEvent: "action_3" }, label: "Toggle Highlight" },
    action: () => store.toggleHighlightActive(),
  },
  // { id: "save", content: { type: "binding", props: { uiEvent: "menu" }, label: "Save" } },
  // { id: "exit", content: { type: "binding", props: { uiEvent: "back" }, label: "Exit" } },
]

watchEffect(() => {
  const isController = showIfController.value
  let defaultControllerHints = false
  let hints

  removeHints()

  if (store.requestApplyActive || store.reapplyActive) {
    if (store.cursorData.isUseMousePos) hints = APPLY_MOUSE_HINTS
    else if (isController) hints = APPLY_CONTROLLER_HINTS
    else hints = APPLY_DEFAULT_HINTS
  } else if (isController) {
    hints = DEFAULT_CONTROLLER_HINTS
    defaultControllerHints = true
  } else {
    hints = DEFAULT_HINTS
  }

  for (let i = 0; i < hints.length; i++) {
    const hint = hints[i]
    infoBar.addHints(hint)
  }

  if (freecam.value) {
    infoBar.addHints(FREECAM_CONTROLLER_HINTS, "change_decal")
  } else {
    infoBar.addHints(VIEWPOINT_CONTROLLER_HINTS, "change_decal")
  }

  if (defaultControllerHints && store.appliedLayers && store.appliedLayers.length > 1) infoBar.addHints(DELETE_LAYER_HINT, "change_decal", true)

  if (!store.appliedLayers || store.appliedLayers.length <= 1) infoBar.removeHints("delete_decal")
})

watch(
  () => freecam.value,
  async () => {
    if (freecam.value) rootStore.cameraView = "free"
    else await rootStore.setOrthographicView("right")
  }
)

function removeHints() {
  APPLY_MOUSE_HINTS.forEach(x => infoBar.removeHints(x.id))
  APPLY_CONTROLLER_HINTS.forEach(x => infoBar.removeHints(x.id))
  APPLY_DEFAULT_HINTS.forEach(x => infoBar.removeHints(x.id))
  DEFAULT_HINTS.forEach(x => infoBar.removeHints(x.id))
  DEFAULT_CONTROLLER_HINTS.forEach(x => infoBar.removeHints(x.id))
  FREECAM_CONTROLLER_HINTS.forEach(x => infoBar.removeHints(x.id))
  VIEWPOINT_CONTROLLER_HINTS.forEach(x => infoBar.removeHints(x.id))
  infoBar.removeHints(DELETE_LAYER_HINT.id)
}

// HEADER
const headerStore = useEditorHeaderStore()
const resetDisabled = ref(false)
const saveDisabled = ref(true)
const useMouse = computed(() => (store.cursorData ? store.cursorData.isUseMousePos : undefined))
const changeMouseMode = async newValue => await store.setUseMousePos(newValue)
const cancelApply = () => {
  if (store.requestApplyActive) store.cancelRequestApply()
}
const cancelReapply = () => {
  if (store.reapplyActive) store.cancelReapply()
}

const HEADER_APPLY_ITEMS = [
  {
    id: "cancel_apply",
    section: "end",
    component: shallowRef(BngButton),
    props: {
      label: "Cancel Apply",
      accent: ACCENTS.attention,
    },
    events: {
      click: cancelApply,
    },
    hidden: true,
  },
  {
    id: "undo_reapply",
    section: "end",
    component: shallowRef(BngButton),
    props: {
      label: "Undo Reapply",
      accent: ACCENTS.attention,
    },
    events: {
      click: cancelReapply,
    },
    hidden: true,
  },
  {
    id: "use_mouse",
    section: "end",
    component: shallowRef(BngSwitch),
    props: {
      modelValue: useMouse,
      label: "Use Mouse",
      uncheckedWithBackground: true,
    },
    events: {
      "update:modelValue": changeMouseMode,
    },
  },
  // {
  //   id: "reset_all_properties",
  //   section: "end",
  //   component: shallowRef(ResetAllPropertiesButton),
  //   props: {
  //     accent: ACCENTS.secondary,
  //     label: "Reset All Properties",
  //     disabled: resetDisabled,
  //     uiEvent: CONTROLLER_RESET_BINDING,
  //   },
  //   events: {
  //     click: () => {
  //       store.resetCursorProperties([])
  //     },
  //   },
  // },
]

const showBinding = computed(
  () => !store.active || !store.appliedLayers || store.appliedLayers.length === 0 || !(store.reapplyActive || store.requestApplyActive)
)

const HEADER_GLOBAL_ITEMS = [
  {
    id: "save_changes",
    section: "start",
    component: shallowRef(BindingButton),
    props: {
      icon: icons.saveAs1,
      accent: ACCENTS.main,
      label: "Save and Exit",
      disabled: saveDisabled,
      uiEvent: CONTROLLER_SAVE_BINDING,
      deviceMask: "xinput",
    },
    events: {
      click: confirmSaveChanges,
    },
  },
  {
    id: "exit_edit_mode",
    section: "start",
    component: shallowRef(BindingButton),
    props: {
      icon: icons.exit,
      accent: ACCENTS.attention,
      label: "Exit Edit Mode",
      uiEvent: CONTROLLER_EXIT_BINDING,
      deviceMask: "xinput",
      showBinding: showBinding,
    },
    events: {
      click: confirmCancelChanges,
    },
  },
]

watch(
  () => store.active,
  active => {
    if (active) {
      headerStore.setHeader(HEADER_TEXT, "ribbon")
      headerStore.setPreheader(undefined)
    }
  },
  { immediate: true }
)

// watch(
//   () => store.appliedLayers,
//   value => {
//     console.log("store.requestApplyActive", store.requestApplyActive)
//     if (value && value.length > 0) {
//       if (store.requestApplyActive) {
//         headerStore.showItem("cancel_apply")
//       } else {
//         headerStore.hideItem("cancel_apply")
//       }
//     }
//   },
//   { immediate: true, deep: true }
// )

// watch(
//   () => store.requestApplyActive,
//   value => {
//     console.log("store.requestApplyActive", store.requestApplyActive)
//     if (value) {
//       headerStore.showItem("cancel_apply")
//     } else {
//       headerStore.hideItem("cancel_apply")
//     }
//   }
// )

watchEffect(() => {
  if (store.appliedLayers && store.appliedLayers.length > 0 && store.requestApplyActive) {
    headerStore.showItem("cancel_apply")
  } else {
    headerStore.hideItem("cancel_apply")
  }
})

watch(
  () => store.reapplyActive,
  value => {
    if (value) {
      headerStore.showItem("undo_reapply")
    } else {
      headerStore.hideItem("undo_reapply")
    }
  }
)

watchEffect(() => {
  saveDisabled.value = !store.appliedLayers || store.appliedLayers.length === 0
  resetDisabled.value = !store.requestApplyActive && !store.reapplyActive
})

onMounted(() => {
  headerStore.removeItems(HEADER_APPLY_ITEMS)
  headerStore.removeItem(HEADER_GLOBAL_ITEMS)
  if (store.active) {
    headerStore.addItems(HEADER_APPLY_ITEMS, true)
    headerStore.addItems(HEADER_GLOBAL_ITEMS)
  }
})

onUnmounted(() => {
  headerStore.removeItems(HEADER_APPLY_ITEMS)
  headerStore.removeItems(HEADER_GLOBAL_ITEMS)
})
</script>

<style lang="scss" scoped>
.liveryeditor-editmode-layout {
  position: relative;
  display: flex;
  height: 100%;
  width: 100%;
  padding: 0.25rem;

  .layers-preview-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    height: 100%;
    padding: 0.5rem 0;
    overflow: hidden;

    .layer-ghost-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 6rem;
      width: 6rem;
      padding: 0.25rem;
      background: rgba(0, 0, 0, 0.5);
      margin-bottom: 0.25rem;
      border-radius: var(--bng-corners-1);
      overflow: hidden;

      &:hover {
        &::before {
          content: "";
          position: absolute;
          display: inline-block;
          top: 0;
          left: 0;
          height: 100%;
          width: 100%;
          background: rgba(0, 0, 0, 0.8);
          z-index: 1;
          pointer-events: none;
        }

        .hover-icon {
          display: inline-block;
        }
      }

      .hover-icon {
        position: absolute;
        display: none;
        z-index: 2;
        pointer-events: none;
      }

      > .layer-ghost {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 5.5rem;
        width: 5.5rem;
        padding: 0.25rem;
        background: v-bind(alphaTextureBackground);
        cursor: pointer;

        .preview-img {
          height: 100%;
          width: 100%;
        }
      }
    }

    .add-item {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 6rem;
      width: 6rem;
      border-radius: var(--bng-corners-1);
      margin-bottom: 0.25rem;
      margin-right: 0;

      :deep() {
        label {
          display: inline-block;
          transform: translateY(-1rem);
        }
      }
    }

    :deep() {
      .layers-preview {
        flex-grow: 1;
        flex-shrink: 1;
        max-height: calc(100% - 8rem);
      }
    }

    .item-navigation {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      cursor: pointer;
      // border-radius: 0.5rem;
      background: rgba(0, 0, 0, 0.5);

      &.item-nav-up {
        padding-bottom: 0.45rem;
        margin-bottom: 0.25rem;
        border-top-left-radius: 0.5rem;
        border-top-right-radius: 0.5rem;

        :deep() {
          .item-navigation-icon {
            margin-bottom: -0.45rem;
          }
        }
      }

      &.item-nav-down {
        padding-top: 0.45rem;
        margin-top: 0.25rem;
        border-bottom-left-radius: 0.5rem;
        border-bottom-right-radius: 0.5rem;

        :deep() {
          .item-navigation-icon {
            margin-top: -0.45rem;
          }
        }
      }
    }
  }

  .layer-settings-wrapper {
    position: absolute;
    top: 0;
    right: 0;
  }
}
</style>
