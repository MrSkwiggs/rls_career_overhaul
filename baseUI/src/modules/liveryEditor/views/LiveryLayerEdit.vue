<template>
  <div
    class="layer-edit-view"
    bng-ui-scope="layer-edit-scope"
    v-bng-on-ui-nav:back="goBack"
    v-bng-on-ui-nav:menu="saveChanges"
    v-bng-on-ui-nav:rotate_h_cam="noop"
    v-bng-on-ui-nav:rotate_v_cam="noop">
    <div class="header">
      <LiveryEditorHeader />
    </div>
    <div class="main-view-content">
      <div class="menu-container">
        <BngImageTile
          v-for="item in MENU_ITEMS"
          v-bng-blur
          bng-nav-item
          :key="item.value"
          :label="item.label"
          :icon="item.icon"
          class="menu-item"
          @click="onMenuItemClicked(item)" />
      </div>
    </div>
  </div>
</template>

<script>
const MENU_ITEMS = [
  {
    label: "Projection",
    value: "projection",
    icon: icons.decal,
  },
  {
    label: "Transform",
    value: "transform",
    icon: icons.colorPalette,
  },
  {
    label: "Materials",
    value: "materials",
    icon: icons.decal,
  },
]
const noop = () => {}
</script>

<script setup>
import { onBeforeMount, onBeforeUnmount, onMounted, ref } from "vue"
import { useInfoBar } from "@/services/infoBar"
import { useUINavScope } from "@/services/uiNav"
import { vBngOnUiNav, vBngBlur } from "@/common/directives"
import { lua, useBridge } from "@/bridge"
import { BngButton, BngCardHeading, BngIcon, BngImageTile, BngList, icons, ACCENTS, LIST_LAYOUTS } from "@/common/components/base"
import { useEditorHeaderStore, useDecalSelectorStore } from "@/modules/liveryEditor/stores"
import { useLiveryEditorStore, useLiveryMainStore } from "@/modules/liveryEditor/stores"
import { LiveryEditorHeader } from "@/modules/liveryEditor/components"
import DecalSelectorItem from "@/modules/liveryEditor/components/DecalSelectorItem.vue"
import router from "@/router"

const headerStore = useEditorHeaderStore()
const store = useDecalSelectorStore()
const mainStore = useLiveryMainStore()
const infobar = useInfoBar()

const uiNav = useUINavScope("layer-edit-scope")

function onMenuItemClicked(item) {
  switch (item.value) {
    case "transform":
      router.push({ name: "LayerTransform" })
      break
    case "materials":
      router.push({ name: "LayerMaterials" })
      break
    case "projection":
      router.push({ name: "LayerProjection" })
      break
  }
}

function goBack() {
  router.replace({ name: "LiveryDecals" })
  mainStore.exitLayerEdit()
}

function saveChanges() {
  const res = lua.extensions.ui_liveryEditor_layerEdit.saveChanges(true)
  res.then(() => goBack())
}

onBeforeMount(() => {
  infobar.clearHints()
  infobar.addHints(NAV_HINTS)
})

onMounted(async () => {
  infobar.visible = true
  infobar.showSysInfo = true
  await mainStore.setupLayerEdit()
  await lua.extensions.ui_liveryEditor_layerEdit.showCursorOrLayer(true)
})

onBeforeUnmount(async () => {
  await lua.extensions.ui_liveryEditor_layerEdit.showCursorOrLayer(false)
})

const NAV_HINTS = [
  { id: "apply", content: { type: "binding", props: { uiEvent: "ok" }, label: "Done" }, action: saveChanges },
  { id: "back", content: { type: "binding", props: { uiEvent: "back" }, label: "Back" }, action: goBack },
]
</script>

<style lang="scss" scoped>
$infobarHeight: 4rem;

.layer-edit-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 0.5rem;
  color: white;

  margin-bottom: $infobarHeight;

  > .main-view-content {
    display: flex;
    justify-content: flex-start;
    flex-grow: 1;

    > .menu-container {
      display: flex;
      align-items: flex-end;
      justify-content: center;
      width: 100%;
      height: 100%;

      .menu-item:not(:last-child) {
        margin-right: 0.5rem;
      }
    }
  }
}
</style>
