<template>
  <div
    class="decals-main-view"
    bng-ui-scope="decals-main-scope"
    v-bng-ui-nav-label:context="contextUIEventLabel"
    v-bng-ui-nav-label:action_2="action2UIEventLabel"
    v-bng-ui-nav-label:menu,back="'Back'"
    v-bng-on-ui-nav:menu,back="onBack"
    v-bng-on-ui-nav:context="handleContext"
    v-bng-on-ui-nav:action_2="handleAction2">
    <div class="header">
      <LiveryEditorHeader />
    </div>
    <div class="main-view-content">
      <LayersManager v-model:selectedKeys="selectedLayerKeys" :layers="layers" v-bng-blur class="layers-manager" @focusedLayer="onFocusedLayer">
        <template #header>
          <BngCardHeading type="ribbon">Layers</BngCardHeading>
          <BngButton bng-no-nav="true" v-bng-disabled="isReprojectActive" :accent="ACCENTS.outlined" @click="addDecal">
            <span class="add-content-wrapper">
              <BngBinding :trackIgnore="true" uiEvent="context" deviceMask="xinput" />
              <!-- <BngIcon :type="icons.plus" /> -->
              <span class="add-label">Add Decal</span>
            </span>
          </BngButton>
        </template>
      </LayersManager>
      <BngActionDrawer
        v-if="actionsDrawerData && allowActionsDrawerShow"
        ref="actionDrawer"
        blur
        :alwaysShowBack="false"
        :actions="actionsDrawerData"
        :item-width="10"
        :item-margin="1"
        class="actions-drawer"
        @select="onActionTriggered">
        <template #controls>
          <BngButton :accent="ACCENTS.outlined" :icon="icons.exit" @click="closeActionDrawer" v-bng-on-ui-nav:ok.asMouse.focusRequired />
        </template>
        <template #action="{ item, select, order }">
          <div class="action-tile">
            <BngTile
              v-if="item.isSwitch"
              bng-nav-item
              v-bng-ui-nav-focus="order === 0 ? 0 : undefined"
              v-bng-focus-if="order === 0"
              v-bng-disabled="item.disabled"
              v-bng-on-ui-nav:ok.asMouse.focusRequired
              :label="item.label"
              @click="onActionSwitchClicked(item)">
              <BngSwitch v-model="item.switchValue" />
            </BngTile>
            <BngImageTile
              v-else
              bng-nav-item
              v-bng-ui-nav-focus="order === 0 ? 0 : undefined"
              v-bng-focus-if="order === 0"
              v-bng-on-ui-nav:ok.asMouse.focusRequired
              :label="item.label"
              :icon="item.icon ? item.icon : ACTION_ITEM_ICON[item.value]"
              class="action-tile"
              @click="select(item)">
            </BngImageTile>
          </div>
        </template>
      </BngActionDrawer>
      <div v-if="popupSettings" class="popup-settings">
        <component :is="popupSettings"></component>
      </div>
    </div>
  </div>
</template>

<script>
const CAMERA_BUTTONS = [
  {
    label: "Right",
    icon: icons.cameraSideRight,
    value: "right",
  },
  {
    label: "Front",
    icon: icons.cameraFront1,
    value: "front",
  },
  {
    label: "Left",
    icon: icons.cameraSideLeft,
    value: "left",
  },
  {
    label: "Back",
    icon: icons.cameraBack1,
    value: "back",
  },
  {
    label: "Top Right",
    icon: icons.cameraTop1,
    value: "topright",
  },
  {
    label: "Top Left",
    icon: icons.cameraTop1,
    value: "topleft",
  },
  {
    label: "Top Front",
    icon: icons.cameraTop1,
    value: "topfront",
  },
  {
    label: "Top Back",
    icon: icons.cameraTop1,
    value: "topback",
  },
]

const BLOCKED_UINAV_EVENTS = ["tab_l", "tab_r"]
const SHOW_HIDE_DECAL_EVENT = "action_2"
</script>

<script setup>
import { computed, onBeforeMount, onBeforeUnmount, onMounted, ref, markRaw, reactive, toRef, watchEffect } from "vue"
import { lua, useBridge } from "@/bridge"
import { useInfoBar } from "@/services/infoBar"
import { useUINavScope } from "@/services/uiNav"
import { useUINavBlocker } from "@/services/uiNavTracker"
import { vBngOnUiNav, vBngUiNavLabel, vBngBlur, vBngDisabled, vBngUiNavFocus, vBngFocusIf } from "@/common/directives"
import { BngActionDrawer, BngButton, BngCardHeading, BngImageTile, BngTile, icons, ACCENTS, BngSwitch, BngBinding } from "@/common/components/base"
import { useEditorHeaderStore } from "@/modules/liveryEditor/stores"
import { LiveryEditorHeader } from "@/modules/liveryEditor/components"
import { LayersManager } from "@/modules/liveryEditor/components/layersManager"
import LayerOrder from "../components/LayerOrder.vue"

const ACTION_ITEM_ICON = {
  requestReproject: icons.view,
  transform: icons.transform,
  materials: icons.colorPalette,
  highlight: icons.lightGarageG11,
  requestMirror: icons.reflect,
  order: icons.sortAscDown,
  enabled: icons.eyeOutlineOpened,
  "enabled-off": icons.eyeOutlineClosed,
  delete: icons.trashBin1,
  duplicate: icons.copy,
}

const layerActionsState = reactive({
  mirrored: false,
  mirrorFlipped: false,
  highlight: true,
  enabled: true,
})

const MIRROR_ITEMS = [
  {
    label: "Mirror",
    value: "mirror",
    isSwitch: true,
    switchValue: toRef(layerActionsState, "mirrored"),
  },
  {
    label: "Flip Mirrored",
    value: "flipMirrored",
    isSwitch: true,
    switchValue: toRef(layerActionsState, "mirrorFlipped"),
    disabled: computed(() => !layerActionsState.mirrored),
  },
]

const headerStore = useEditorHeaderStore()
const infobar = useInfoBar()
const uiNav = useUINavScope("decals-main-scope")
const uiNavBlocker = useUINavBlocker()
const { events } = useBridge()

const layers = ref([])
const selectedLayers = ref([])
const layerActions = ref([])
const allowActionsDrawerShow = ref(true)
const actionDrawer = ref(null)
const currentActionDrawerLevel = ref(null)
const popupSettings = ref(null)
const isReprojectActive = ref(false)
const focusedLayer = ref(null)

const selectedLayerKeys = computed(() => (selectedLayers.value ? selectedLayers.value.map(x => x.uid) : null))

const actionsDrawerData = computed(() => {
  const layerName = selectedLayers.value && selectedLayers.value.length > 0 ? selectedLayers.value[0].name : null
  return layerActions.value && layerActions.value.length > 0
    ? {
        label: layerName,
        items: layerActions.value,
        allowOpenDrawer: false,
      }
    : undefined
})

const contextUIEventLabel = computed(() => (isReprojectActive.value ? "Reproject" : "Add Decal"))
const action2UIEventLabel = computed(() =>
  focusedLayer.value || (selectedLayers.value && selectedLayers.value.length > 0) ? "Enable/Disable Decal" : undefined
)

watchEffect(() => {
  const eventsToBlock = [...BLOCKED_UINAV_EVENTS]

  uiNavBlocker.clear()
  if (isReprojectActive.value || (!focusedLayer.value && (!selectedLayers.value || selectedLayers.value.length === 0)))
    eventsToBlock.push(SHOW_HIDE_DECAL_EVENT)
  uiNavBlocker.blockOnly(eventsToBlock)
})

onBeforeMount(() => {
  headerStore.setPreheader(["Decals"])
})

onMounted(() => {
  infobar.visible = true
  infobar.showSysInfo = true
  events.on("liveryEditor_OnLayersUpdated", onLayersUpdated)
  events.on("liveryEditor_selection_actionsUpdated", onActionsUpdated)
  events.on("liveryEditor_selection_selectedChanged", onSelectedChanged)

  lua.extensions.ui_liveryEditor_layers.requestInitialData()
  lua.extensions.ui_liveryEditor_selection.requestInitialData()
})

onBeforeUnmount(() => {
  events.off("liveryEditor_OnLayersUpdated", onLayersUpdated)
  events.off("liveryEditor_selection_actionsUpdated", onActionsUpdated)
  events.off("liveryEditor_selection_selectedChanged", onSelectedChanged)
})

function onBack(event) {
  if (popupSettings.value) {
    popupSettings.value = null
    allowActionsDrawerShow.value = true
  } else if (actionsDrawerData.value) {
    handleDrawerBack()
  } else {
    window.bngVue.gotoGameState("LiveryMain")
  }

  event.stopPropagation()
}

function addDecal() {
  window.bngVue.gotoGameState("LiveryDecalSelector")
}

let isReproject

async function onActionSwitchClicked(item) {
  const res = await lua.extensions.ui_liveryEditor_layerAction.performAction(item.value)
  item.switchValue = res
}

async function onActionTriggered(item) {
  if (!item.value) {
    if (currentActionDrawerLevel.value === "requestReproject" && !isReproject) {
      await lua.extensions.ui_liveryEditor_layerAction.performAction("cancelReproject")
    }

    isReprojectActive.value = false
    isReproject = false
    currentActionDrawerLevel.value = null
    return
  }

  if (item.lazyLoadItems || item.items) {
    currentActionDrawerLevel.value = item.value
  }

  if (item.value === "requestReproject") {
    if (!item.items) {
      const timeoutid = setTimeout(() => {
        item.items = CAMERA_BUTTONS
        clearTimeout(timeoutid)
      }, 500)
    }

    isReprojectActive.value = true
  } else if (item.value === "requestMirror") {
    item.items = MIRROR_ITEMS
    return
  } else if (item.value === "order") {
    allowActionsDrawerShow.value = false
    popupSettings.value = markRaw(LayerOrder)
    return
  } else if (CAMERA_BUTTONS.find(x => x.value === item.value)) {
    await lua.extensions.ui_liveryEditor_camera.setOrthographicView(item.value)
    return
  }

  await lua.extensions.ui_liveryEditor_layerAction.performAction(item.value)
}

function onLayersUpdated(data) {
  layers.value = data
}

function onActionsUpdated(data) {
  layerActions.value = data

  // init layer switch actions by selected layer values
  if (data && Array.isArray(data) && data.length > 0) {
    const highlightAction = layerActions.value.find(x => x.value === "highlight")
    highlightAction.switchValue = toRef(layerActionsState, "highlight")
  }
}

function onSelectedChanged(data) {
  selectedLayers.value = data

  if (data && Array.isArray(data) && data.length > 0) {
    const first = data[0]

    layerActionsState.highlight = first.highlighted
    layerActionsState.mirrored = first.mirrored
    layerActionsState.mirrorFlipped = first.mirrorFlipped
  }
}

const closeActionDrawer = () => {
  if (currentActionDrawerLevel.value && currentActionDrawerLevel.value === "requestReproject") {
    const res = lua.extensions.ui_liveryEditor_layerAction.performAction("cancelReproject")
    res.then(() => {})
    currentActionDrawerLevel.value = null
  }

  lua.extensions.ui_liveryEditor_selection.clearSelection()
}

function handleDrawerBack() {
  if (!currentActionDrawerLevel.value) {
    closeActionDrawer()
  } else {
    actionDrawer.value.goBack()
  }
}

function onFocusedLayer(layer) {
  focusedLayer.value = layer
}

const toggleEnabled = () => {
  if (focusedLayer.value) {
    lua.extensions.ui_liveryEditor_layerAction.toggleEnabledByLayerUid(focusedLayer.value.uid)
  } else if (selectedLayers.value && selectedLayers.value.length > 0) {
    const layer = selectedLayers.value[0]
    const res = lua.extensions.ui_liveryEditor_layerAction.performAction("enabled")
    res.then(luaRes => {
      layer.enabled = luaRes
    })
  }
}

const handleContext = () => {
  if (isReprojectActive.value) {
    const res = lua.extensions.ui_liveryEditor_layerAction.performAction("reproject")
    res.then(() => {
      isReproject = true
      isReprojectActive.value = false
      actionDrawer.value.goBack()
    })
  } else if (!popupSettings.value) {
    addDecal()
  }
}

const handleAction2 = () => {
  if (isReprojectActive.value) return false

  toggleEnabled()
}
</script>

<style lang="scss" scoped>
$infobarHeight: 4rem;

.decals-main-view {
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
    justify-content: flex-start;
    flex-grow: 1;
  }
}

.layers-manager {
  max-width: 22rem;
}

.actions-drawer {
  padding: 0 0.5rem;
  align-self: flex-end;
}

.popup-settings {
  position: absolute;
  top: 0;
  right: 0;
}
</style>
