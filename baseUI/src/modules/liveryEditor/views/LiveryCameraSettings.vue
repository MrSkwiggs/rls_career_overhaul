<template>
  <div class="camera-settings-view" bng-ui-scope="camera-settings-scope" v-bng-on-ui-nav:back="goBack" v-bng-on-ui-nav:menu="done">
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
          @click="onMenuItemClicked(item)" />
      </div>
    </div>
  </div>
</template>

<script>
const MENU_ITEMS = [
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
import { onBeforeMount, onMounted, ref } from "vue"
import { storeToRefs } from "pinia"
import { lua } from "@/bridge"
import { useInfoBar } from "@/services/infoBar"
import { useUINavScope } from "@/services/uiNav"
import { vBngOnUiNav, vBngBlur } from "@/common/directives"
import { BngButton, BngCardHeading, BngIcon, BngImageTile, BngList, icons, ACCENTS, LIST_LAYOUTS } from "@/common/components/base"
import { useEditorHeaderStore, useDecalSelectorStore } from "@/modules/liveryEditor/stores"
import { LiveryEditorHeader } from "@/modules/liveryEditor/components"
import DecalSelectorItem from "@/modules/liveryEditor/components/DecalSelectorItem.vue"
import router from "@/router"

const CAMERA_LUA = lua.extensions.ui_liveryEditor_camera

const headerStore = useEditorHeaderStore()
const store = useDecalSelectorStore()
const infobar = useInfoBar()

const uiNav = useUINavScope("camera-settings-scope")

function onMenuItemClicked(item) {
  CAMERA_LUA.setOrthographicView(item.value)
}

function goBack() {
  router.replace({ name: "LiveryDecals" })
}

function done() {
  router.replace({ name: "LiveryDecalSelector" })
}

onBeforeMount(() => {
  infobar.clearHints()
  infobar.addHints(NAV_HINTS)
  headerStore.setPreheader(["Select Camera"])
})

onMounted(() => {
  infobar.visible = true
  infobar.showSysInfo = true
})

const NAV_HINTS = [
  { id: "apply", content: { type: "binding", props: { uiEvent: "menu" }, label: "Done" } },
  { id: "back", content: { type: "binding", props: { uiEvent: "back" }, label: "Back" }, action: goBack },
]
</script>

<style lang="scss" scoped>
$infobarHeight: 4rem;

.camera-settings-view {
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
    }
  }
}
</style>
