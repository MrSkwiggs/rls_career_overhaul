<template>
  <div class="liveryeditor-default-layout" bng-ui-scope="default-layout" v-bng-on-ui-nav:back="onBack" v-bng-on-ui-nav:menu="onMenu">
    <div class="layers-manager-wrapper">
      <LayersManager
        v-model:selectedKeys="rootStore.selectedLayerUids"
        :layers="layers"
        v-bng-blur
        :class="{ inactive: settingType && settingType.disableLayersManager }">
        <template #header>
          <BngCardHeading type="ribbon">{{ headerLabel }}</BngCardHeading>
          <div v-if="rootStore.selectMode === 'multi'" class="multiselect-header">
            <BngButton :accent="ACCENTS.attention" @click="closeActions" class="cancel-btn" v-bng-on-ui-nav:ok.asMouse.focusRequired>Cancel</BngButton>
            <span class="message"> {{ multiSelectMessage }} </span>
          </div>
          <BngButton
            v-else
            v-bng-on-ui-nav:ok.asMouse.focusRequired
            :accent="ACCENTS.outlined"
            :disabled="rootStore.selectedLayers && rootStore.selectedLayers.length > 0"
            @click="rootStore.toggleEditModeLayout">
            <span class="add-content-wrapper">
              <BngIcon :type="icons.plus" />
              <span class="add-label">Add Decal</span>
            </span>
          </BngButton>
        </template>
      </LayersManager>
    </div>
    <BngActionDrawer
      v-if="layerActions && (!settingType || !settingType.hideActions)"
      ref="actionsDrawer"
      :actions="layerActions"
      :item-width="10"
      :item-margin="1"
      class="actions-drawer"
      @select="onActionTriggered">
      <template #controls>
        <BngButton :accent="ACCENTS.outlined" :icon="icons.abandon" @click="closeActions" v-bng-on-ui-nav:ok.asMouse.focusRequired />
      </template>
      <template #action="{ item, isLoading, select }">
        <div class="action-tile">
          <BngImageTile
            :label="item.toggleAction && !item.active ? item.inactiveLabel : item.label"
            :icon="item.toggleAction && !item.active ? item.inactiveIcon : item.icon"
            :externalImage="item.preview"
            bng-nav-item
            v-bng-on-ui-nav:ok.asMouse.focusRequired
            class="action-tile"
            @click="select(item)">
          </BngImageTile>
        </div>
      </template>
    </BngActionDrawer>
    <!-- </div> -->
    <div v-if="settingType" class="layer-settings-wrapper" bng-ui-scope="layer-settings">
      <LayerSettings v-if="settingType.propertySettings" v-bind="settingType.props" />
      <LayerSettingsBase v-else v-bng-blur :heading="settingType.label">
        <component :is="settingType.component" />
      </LayerSettingsBase>
    </div>
  </div>
</template>

<script>
const SETTINGS_VIEWS = {
  edit: {
    label: "Edit",
    value: "edit",
    hideActions: true,
    propertySettings: true,
    disableLayersManager: true,
    props: {
      excludeSettingTypes: ["transform"],
    },
  },
  order: {
    label: "Change Order",
    value: "order",
    component: LayerSortSettings,
    hideActions: true,
    disableLayersManager: true,
  },
  paint: {
    label: "Paint",
    value: "paint",
    component: PaintSettings,
    hideActions: true,
    disableLayersManager: true,
  },
}

const HEADER_TEXT = "Livery Editor"
</script>

<script setup>
import { ref, computed, shallowRef, onMounted, onUnmounted, watchEffect, reactive, nextTick } from "vue"
import { storeToRefs } from "pinia"
import { vBngBlur, vBngOnUiNav } from "@/common/directives"
import { useLiveryEditorStore, useLayerActionsStore, useEditorHeaderStore } from "@/modules/liveryEditor/stores"
import { LayersManager } from "@/modules/liveryEditor/components/layersManager"
import { LayerSettings } from "@/modules/liveryEditor/components/layerSettings"
import { BngCardHeading, BngActionDrawer, BngImageTile, BngButton, BngIcon, ACCENTS, icons } from "@/common/components/base"
import { LayerSortSettings, LayerSettingsBase } from "@/modules/liveryEditor/components/layerSettings"
import PaintSettings from "../components/PaintSettings.vue"
import { useUINavScope } from "@/services/uiNav"
import { useInfoBar } from "@/services/infoBar"
// import { UINavEvents } from "@/bridge/libs"
import { getUINavServiceInstance } from "@/services/uiNav"
import { lua } from "@/bridge"

useUINavScope("default-layout")

const rootStore = useLiveryEditorStore()
const infoBar = useInfoBar()

const { layers } = storeToRefs(rootStore)
const actionsDrawer = ref(null)
const settingType = shallowRef(null)

const layerActions = computed(() =>
  rootStore.layerActions
    ? {
        label: rootStore.selectedLayers.length === 1 ? `${rootStore.selectedLayers[0].name} Actions` : `${rootStore.selectedLayers.length} Layers Actions`,
        items: rootStore.layerActions,
        allowOpenDrawer: false,
      }
    : undefined
)

const headerLabel = computed(() => {
  if (rootStore.visibleLayersCount === 0) return "No Layers"
  return rootStore.visibleLayersCount + " Layer" + rootStore.visibleLayersCount > 1 ? "s" : ""
})

const multiSelectMessage = computed(() => {
  if (!rootStore.selectedLayers) return undefined

  return rootStore.selectedLayers.length + `Layer${rootStore.selectedLayers.length > 1 ? "s" : ""}`
})

onMounted(() => {
  // UINavEvents.useCrossfire = true
  getUINavServiceInstance().useCrossfire = true
})

function onBack() {
  if (settingType.value) {
    console.log("onBack > closed settings")
    closeSettings()
  } else if (rootStore.selectedLayers && rootStore.selectedLayers.length > 0) {
    console.log("onBack > closed actions")
    rootStore.dismissLayerActions().then()
  } else {
    console.log("onBack > catch all")
    openExitDialog().then()
  }
}

function onMenu() {
  if (settingType.value) {
    closeActions()
  } else if (rootStore.selectedLayers && rootStore.selectedLayers.length > 0) {
    // none for now
  } else {
    openSaveDialog()
  }
}

function closeActions() {
  if (settingType.value) closeSettings()
  rootStore.dismissLayerActions().then()
}

function closeSettings() {
  settingType.value = null
}

function onActionTriggered(actionItem) {
  const setting = SETTINGS_VIEWS[actionItem.value]
  if (setting) {
    settingType.value = setting
  } else {
    rootStore.onActionItemSelected(actionItem).then()
  }
}

const saving = ref(false)

const dialogStates = reactive({
  isDialogOpen: false,
})

async function openExitDialog() {
  if (dialogStates.isDialogOpen) return true
  dialogStates.isDialogOpen = true
  const res = await rootStore.openExitDialog()
  dialogStates.isDialogOpen = false
}

function openSaveDialog() {
  if (dialogStates.isDialogOpen) return true
  saving.value = true
  dialogStates.isDialogOpen = true
  rootStore.save().then(() => {
    saving.value = false
    dialogStates.isDialogOpen = false
  })
}

function openPaintSettings() {
  // lua.core_vehicle_colors.setVehicleColor()
  settingType.value = SETTINGS_VIEWS["paint"]

}

// HEADER
const saveLabel = computed(() => (saving.value ? "Saving..." : "Save"))
const HEADER_ITEMS = [
  {
    id: "save_editor",
    section: "start",
    component: shallowRef(BngButton),
    props: {
      icon: icons.saveAs1,
      accent: ACCENTS.main,
      label: saveLabel,
      disabled: saving,
    },
    events: {
      click: openSaveDialog,
    },
  },
  {
    id: "exit_editor",
    section: "start",
    component: shallowRef(BngButton),
    props: {
      icon: icons.exit,
      accent: ACCENTS.attention,
      label: "Exit",
    },
    events: {
      click: openExitDialog,
    },
  },
  {
    id: "paint_settings",
    section: "start",
    component: shallowRef(BngButton),
    props: {
      icon: icons.exit,
      accent: ACCENTS.secondary,
      label: "Paint",
    },
    events: {
      click: openPaintSettings,
    },
  },
]

const headerStore = useEditorHeaderStore()

watchEffect(() => {
  if (rootStore.currentFile && rootStore.currentFile.name) headerStore.setPreheader(rootStore.currentFile.name)
})

onMounted(() => {
  headerStore.setHeader(HEADER_TEXT)
  headerStore.addItems(HEADER_ITEMS)
})

onUnmounted(() => {
  headerStore.removeItems(HEADER_ITEMS)
})

// INFOBAR HINTS
const NAV_HINTS = [
  { id: "save", content: { type: "binding", props: { uiEvent: "menu" }, label: "Save" }, action: async () => await rootStore.save(false) },
  { id: "exit", content: { type: "binding", props: { uiEvent: "back" }, label: "Exit" }, action: async () => rootStore.openExitDialog },
]

const ACTIONS_DRAWER_HINTS = [{ id: "actions_back", content: { type: "binding", props: { uiEvent: "back" }, label: "Back" } }]

const SETTINGS_NAV_HINTS = [
  { id: "selected_done", content: { type: "binding", props: { uiEvent: "menu" }, label: "Done" } },
  { id: "selected_back", content: { type: "binding", props: { uiEvent: "back" }, label: "Done (Return to Actions)" } },
]

watchEffect(() => {
  infoBar.clearHints()
  if (settingType.value) {
    infoBar.addHints(SETTINGS_NAV_HINTS)
  } else if (layerActions.value) {
    infoBar.addHints(ACTIONS_DRAWER_HINTS)
  } else {
    infoBar.addHints(NAV_HINTS)
  }
})

onMounted(() => {
  infoBar.addHints(NAV_HINTS)
})

onUnmounted(() => {
  infoBar.removeHints(...NAV_HINTS.map(x => x.id))
})
</script>

<style lang="scss" scoped>
.liveryeditor-default-layout {
  position: relative;
  display: flex;
  height: 100%;
  width: 100%;

  > .layers-manager-wrapper {
    width: 22rem;
    height: 100%;

    &.hidden {
      width: 0;
    }

    :deep() {
      .layers-manager.inactive {
        pointer-events: none;
      }
    }

    .multiselect-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .message {
        font-weight: 600;
        font-size: 1.25em;
      }
    }

    :deep() {
      .add-content-wrapper {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding-top: 0.25rem;

        .add-label {
          margin-left: 0.5rem;
        }
      }
    }
  }

  .actions-drawer {
    position: absolute;
    bottom: 0;
    left: 22rem;
    width: auto;
    margin: 0 0.5rem;
  }

  > .layer-settings-wrapper {
    position: absolute;
    top: 0;
    right: 0;
  }
}
</style>
