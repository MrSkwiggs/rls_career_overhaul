<template>
  <div
    class="paint-main-view"
    bng-ui-scope="paint-main-scope"
    v-bng-on-ui-nav:back,menu="cancelChanges"
    v-bng-ui-nav-label:back,menu="'Back'"
  >
    <div class="header">
      <LiveryEditorHeader />
    </div>
    <div class="paint-content-container">
      <div class="paint-content">
        <MaterialSettings v-bng-blur :initial-color="initialColor" @change="onMaterialValueChanged" />
        <BngButton v-bng-on-ui-nav:context.asMouse @click="saveChanges">
          <BngBinding controller ui-event="context" />
          <span>Apply</span>
        </BngButton>
        <BngButton v-bng-on-ui-nav:action_3.asMouse accent="secondary" @click="restoreDefault">
          <BngBinding controller ui-event="action_3" />
          <span>Restore Default</span>
        </BngButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue"
import { BngBinding, BngButton } from "@/common/components/base"
import { vBngOnUiNav, vBngUiNavLabel, vBngBlur } from "@/common/directives"
import { lua, useBridge } from "@/bridge"
import { useInfoBar } from "@/services/infoBar"
import { useUINavScope } from "@/services/uiNav"
import { useUINavBlocker } from "@/services/uiNavTracker"
import { openConfirmation } from "@/services/popup"
import { useLiveryMainStore } from "@/modules/liveryEditor/stores"
import { useEditorHeaderStore } from "@/modules/liveryEditor/stores"
import { LiveryEditorHeader } from "@/modules/liveryEditor/components"
import MaterialSettings from "../components/layerSettings/MaterialSettings.vue"

const store = useLiveryMainStore()
const headerStore = useEditorHeaderStore()
const infobar = useInfoBar()
const uiNavBlocker = useUINavBlocker()
const { events } = useBridge()

useUINavScope("paint-main-scope")

const initialColor = ref(null)

const blockedEvents = ["tab_r", "tab_l"]

onMounted(() => {
  headerStore.setPreheader(["Paint"])
  store.setup()

  infobar.visible = true
  infobar.showSysInfo = true

  uiNavBlocker.blockOnly(blockedEvents)

  events.on("liveryEditor_fill_layerData", onLayerData)
  lua.extensions.ui_liveryEditor_layers_fill.requestLayerData()
})

onUnmounted(() => {
  uiNavBlocker.clear()
  events.off("liveryEditor_fill_layerData")
})

function onLayerData(data) {
  console.log("layer data changed", data)
  initialColor.value = data.color
}

function saveChanges() {
  const res = lua.extensions.ui_liveryEditor_layers_fill.saveChanges()
  res.then(() => {
    window.bngVue.gotoGameState("LiveryMain")
  })
}

function restoreDefault() {
  lua.extensions.ui_liveryEditor_layers_fill.restoreDefault()
}

function cancelChanges() {
  openConfirmation("Undo Changes", "Lose unsaved changes?").then(res => {
    if (res) {
      lua.extensions.ui_liveryEditor_layers_fill.restoreLayer()
      window.bngVue.gotoGameState("LiveryMain")
    }
  })
}

function onMaterialValueChanged(data) {
  lua.extensions.ui_liveryEditor_layers_fill.updateLayer({ color: data.colorRgb })
}
</script>

<style lang="scss" scoped>
$infobarHeight: 4rem;

.paint-main-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 0.5rem;
  color: white;

  margin-bottom: $infobarHeight;
}

.paint-content-container {
  display: flex;
  justify-content: flex-end;
  flex-grow: 1;
}

.paint-content {
  display: flex;
  flex-direction: column;
}

.paint-content > .bng-button {
  max-width: unset;
}
</style>
