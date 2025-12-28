<template>
  <div class="layer-projection-view" bng-ui-scope="layer-projection-scope" v-bng-on-ui-nav:back="goBack" v-bng-on-ui-nav:menu="goBack">
    <div class="header">
      <LiveryEditorHeader />
    </div>
    <div class="main-view-content">
      <BngImageTile v-bng-blur bng-nav-item v-bng-popover:right-start.click="'camera-views-menu'" :icon="icons.movieCamera" label="Side" />
      <BngImageTile v-bng-blur bng-nav-item v-bng-popover:right-start.click="'mirror-settings-menu'" :icon="icons.reflect" label="Mirror" />
    </div>
    <BngPopoverMenu name="camera-views-menu" @hide="onPopoverMenuHide">
      <div class="camera-views-container">
        <BngList :targetWidth="8" :targetMargin="0.5" noBackground>
          <BngImageTile
            v-for="view in CAMERA_BUTTONS"
            :key="view.value"
            bng-nav-item
            :label="view.label"
            :icon="view.icon"
            @click="changeCameraView(view.value)" />
        </BngList>
      </div>
    </BngPopoverMenu>
    <BngPopoverMenu name="mirror-settings-menu" @hide="onPopoverMenuHide">
      <div class="mirror-settings-container">
        <BngPillCheckbox v-model="mirrored">Mirrored</BngPillCheckbox>
        <BngPillCheckbox v-model="mirrorFipped" v-bng-disabled="!mirrored">Mirror Flipped</BngPillCheckbox>
        <BngInput v-model="mirrorOffset" externalLabel="Offset" type="number" :disabled="!mirrored" />
      </div>
    </BngPopoverMenu>
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
</script>

<script setup>
import { computed, onBeforeMount, onMounted, onBeforeUnmount, reactive, ref, watch } from "vue"
import { useInfoBar } from "@/services/infoBar"
import { useUINavScope } from "@/services/uiNav"
import { usePopover } from "@/services/popover"
import { vBngOnUiNav, vBngPopover, vBngDisabled, vBngBlur } from "@/common/directives"
import { BngImageTile, BngInput, BngList, BngPillCheckbox, BngPopoverMenu, icons } from "@/common/components/base"
import { useEditorHeaderStore } from "@/modules/liveryEditor/stores"
import { useLiveryEditorStore } from "@/modules/liveryEditor/stores"
import { LiveryEditorHeader } from "@/modules/liveryEditor/components"
import { lua, useBridge } from "@/bridge"

const { events } = useBridge()

const headerStore = useEditorHeaderStore()
const store = useLiveryEditorStore()
const infobar = useInfoBar()
const popover = usePopover()
const uiNav = useUINavScope("layer-projection-scope")

const stateData = ref(null)

const mirrorState = reactive({
  mirrored: false,
  mirrorFipped: false,
  mirrorOffset: 0,
})
const mirrored = computed({
  get: () => mirrorState.mirrored,
  set: async newValue => {
    mirrorState.mirrored = newValue
    await lua.extensions.ui_liveryEditor_layerEdit.setMirrored(newValue, mirrorState.mirrorFipped, mirrorState.mirrorOffset)
  },
})
const mirrorFipped = computed({
  get: () => mirrorState.mirrorFipped,
  set: async newValue => {
    mirrorState.mirrorFipped = newValue
    await lua.extensions.ui_liveryEditor_layerEdit.setMirrored(mirrorState.mirrored, newValue, mirrorState.mirrorOffset)
  },
})
const mirrorOffset = computed({
  get: () => mirrorState.mirrorOffset,
  set: async newValue => {
    mirrorState.mirrorOffset = newValue
    await lua.extensions.ui_liveryEditor_layerEdit.setMirrored(mirrorState.mirrored, mirrorState.mirrorFipped, newValue)
  },
})

const NAV_HINTS = [
  { id: "apply", content: { type: "binding", props: { uiEvent: "menu" }, label: "Done" }, action: saveChanges },
  { id: "back", content: { type: "binding", props: { uiEvent: "back" }, label: "Back" }, action: goBack },
]

onBeforeMount(() => {
  infobar.clearHints()
  infobar.addHints(NAV_HINTS)
  headerStore.setPreheader(["Projection"])
  headerStore.setHeader("Decals")
})

onMounted(async () => {
  infobar.visible = true
  infobar.showSysInfo = true
  events.on("liveryEditor_layerEdit_state", onStateData)
  events.on("liveryEditor_layerEdit_initialLayerData", onInitialLayerData)
  await lua.extensions.ui_liveryEditor_layerEdit.requestStateData()
  await lua.extensions.ui_liveryEditor_layerEdit.requestInitialLayerData()
})

onBeforeUnmount(() => {
  events.off("liveryEditor_layerEdit_state", onStateData)
  events.off("liveryEditor_layerEdit_initialLayerData", onInitialLayerData)
})

function changeCameraView(view) {
  popover.hide("camera-views-menu")
  console.log("changeCameraView", view)
  store.setOrthographicView(view)
}

function onStateData(data) {
  console.log("onStateData", data)
  stateData.value = data
}

function onInitialLayerData(data) {
  mirrorState.mirrored = data.mirrored
  mirrorState.mirrorFipped = data.mirrorFipped
  mirrorState.mirrorOffset = data.mirrorOffset
}

function goBack() {
  window.bngVue.gotoGameState("LiveryLayerEdit")
}

function saveChanges() {
  window.bngVue.gotoGameState("LiveryLayerEdit")
}

function onPopoverMenuHide() {
  uiNav.set("layer-projection-scope")
}
</script>

<style lang="scss" scoped>
.layer-projection-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 0.5rem;
  color: white;

  > .main-view-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex-grow: 1;

    > * {
      margin-top: 0.5rem;
    }
  }
}
.camera-views-menu {
  width: 50rem;
  height: 50rem;
}
.camera-views-container {
  width: 22rem;
  height: 22rem;
}
.mirror-settings-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 12rem;
  padding: 0.5rem;

  > * {
    padding-top: 0.25rem;
    min-height: 2.5rem;
    width: 100%;
  }
}
.surfaceprojection-settings-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14rem;
  height: 6rem;
  padding: 0.5rem;
}
</style>
