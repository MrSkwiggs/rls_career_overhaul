<template>
  <div
    class="decal-selector-view"
    bng-ui-scope="decal-selector-scope"
    v-bng-on-ui-nav:back,menu="goBack"
    v-bng-ui-nav-label:back,menu="'Back'"
  >
    <div class="header">
      <LiveryEditorHeader />
    </div>
    <div class="main-view-content">
      <div v-if="categorizedTextures" v-bng-blur class="side-menu">
        <BngButton
          v-for="category in categorizedTextures"
          :key="category.value"
          :label="category.label"
          accent="text"
          @click="selectedCategory = category.value" />
      </div>
      <div class="list-container">
        <BngList
          v-if="textures"
          v-bng-blur
          :layout="LIST_LAYOUTS.TILES"
          :target-width="8"
          :target-height="8"
          :target-margin="0.25"
          :big="true"
          class="textures-list">
          <DecalSelectorItem
            v-for="(item, index) in textures"
            bng-nav-item
            :key="item.preview"
            :externalImage="item.preview"
            :data-decal-item="index"
            v-bng-on-ui-nav:ok.asMouse.focusRequired
            v-bng-ui-nav-focus="index === 0 ? 0 : undefined"
            v-bng-focus-if="index === 0"
            @click="select(item)" />
        </BngList>
      </div>
    </div>
  </div>
</template>

<script>
const BLOCKED_UINAV_EVENTS = ["tab_l", "tab_r"]
</script>

<script setup>
import { computed, onBeforeMount, onMounted, ref } from "vue"
import { lua, useBridge } from "@/bridge"
import { useInfoBar } from "@/services/infoBar"
import { useUINavScope } from "@/services/uiNav"
import { useUINavBlocker } from "@/services/uiNavTracker"
import { vBngOnUiNav, vBngUiNavLabel, vBngBlur, vBngUiNavFocus, vBngFocusIf } from "@/common/directives"
import { BngButton, BngList, LIST_LAYOUTS } from "@/common/components/base"
import { useEditorHeaderStore } from "@/modules/liveryEditor/stores"
import { LiveryEditorHeader } from "@/modules/liveryEditor/components"
import DecalSelectorItem from "@/modules/liveryEditor/components/DecalSelectorItem.vue"

const headerStore = useEditorHeaderStore()
const infobar = useInfoBar()
const uiNavBlocker = useUINavBlocker()
const { events } = useBridge()

useUINavScope("decal-selector-scope")

const categorizedTextures = ref([])
const selectedCategory = ref(null)
const textures = computed(() => {
  if (categorizedTextures.value && categorizedTextures.value.length > 0 && selectedCategory.value) {
    const cat = categorizedTextures.value.find(x => x.value === selectedCategory.value)
    if (cat) return cat.items
  }
  return null
})

async function select(item) {
  const layer = await lua.extensions.ui_liveryEditor_layers_decal.addLayerCentered({ texturePath: item.preview })
  await lua.extensions.ui_liveryEditor_selection.select(layer.uid, true)
  window.bngVue.gotoGameState("LiveryDecals")
}

function goBack(event) {
  window.bngVue.gotoGameState("LiveryDecals")
  event.stopPropagation()
}

function onData(data) {
  categorizedTextures.value = data

  if (!data || data.length === 0) {
    selectedCategory.value = null
  } else if (!selectedCategory.value) {
    selectedCategory.value = data[0].value
  }
}

onBeforeMount(() => {
  headerStore.setPreheader(["Decals", "Textures"])
})

onMounted(() => {
  infobar.visible = true
  infobar.showSysInfo = true
  lua.extensions.ui_liveryEditor_resources.requestData()
  events.on("liveryEditor_resources_data", onData)
  uiNavBlocker.blockOnly(BLOCKED_UINAV_EVENTS)
})

onBeforeMount(() => {
  events.off("liveryEditor_resources_data", onData)
  uiNavBlocker.clear()
})
</script>

<style lang="scss" scoped>
$infobarHeight: 4rem;

.decal-selector-view {
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
  }
}

.main-view-content > .side-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  width: 22rem;
  max-width: 22rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.5);

  > * {
    width: 100%;
    font-size: 1.25rem;
    padding: 0.75rem;
  }
}

.main-view-content > .list-container {
  flex-grow: 1;
  padding: 0 0.75rem;

  > .textures-list {
    height: 100%;
    width: 100%;
  }
}
</style>
