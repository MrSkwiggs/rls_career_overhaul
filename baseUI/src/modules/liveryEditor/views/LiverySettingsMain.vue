<template>
  <div class="settings-main-view" bng-ui-scope="settings-main-scope" v-bng-on-ui-nav:back,menu="goBack">
    <div class="header">
      <LiveryEditorHeader />
    </div>
    <div class="main-view-content">
      <BngCard v-bng-blur>
        <BngCardHeading>Settings</BngCardHeading>
        <div class="settings-container">
          <div class="settings-item">
            <div class="settings-item-name">Use Surface Normal</div>
            <BngSwitch v-bng-ui-nav-focus="0" v-bng-focus-if="true" v-model="useSurfaceNormal" :label="useSurfaceNormal ? 'Yes' : 'No'" />
          </div>
        </div>
      </BngCard>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeMount, onMounted, onBeforeUnmount, watch } from "vue"
import { useInfoBar } from "@/services/infoBar"
import { vBngOnUiNav, vBngBlur, vBngUiNavFocus, vBngFocusIf } from "@/common/directives"
import { useUINavScope } from "@/services/uiNav"
import { useEditorHeaderStore } from "@/modules/liveryEditor/stores"
import { lua, useBridge } from "@/bridge"
import { LiveryEditorHeader } from "@/modules/liveryEditor/components"
import { BngCard, BngCardHeading, BngSwitch } from "@/common/components/base"

const headerStore = useEditorHeaderStore()
const infobar = useInfoBar()
const uiNav = useUINavScope("settings-main-scope")
const { events } = useBridge()
const stateData = ref(null)

const useSurfaceNormal = ref(false)

watch(
  () => useSurfaceNormal.value,
  async value => {
    await lua.extensions.ui_liveryEditor.useSurfaceNormal(value)
  }
)

const NAV_HINTS = [{ id: "back", content: { type: "binding", props: { uiEvent: "back" }, label: "Back" }, action: goBack }]

onBeforeMount(() => {
  infobar.clearHints()
  infobar.addHints(NAV_HINTS)
  headerStore.setHeader("Decals")
  headerStore.setPreheader(["Settings"])
})

onMounted(async () => {
  infobar.visible = true
  infobar.showSysInfo = true
  events.on("liveryEditor_settingsData", onSettingsData)
  await lua.extensions.ui_liveryEditor.requestSettingsData()
})

onBeforeUnmount(() => {
  events.off("liveryEditor_settingsData", onSettingsData)
})

function onSettingsData(data) {
  console.log("onSettingsData", data)
  stateData.value = data
  useSurfaceNormal.value = data.useSurfaceNormal
}

function goBack(event) {
  window.bngVue.gotoGameState("LiveryMain")
  event.stopPropagation()
}
</script>

<style lang="scss" scoped>
$infobarHeight: 4rem;

.settings-main-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 0.5rem;
  color: white;

  margin-bottom: $infobarHeight;

  > .main-view-content {
    display: flex;
    justify-content: flex-end;
    flex-grow: 1;
  }
}

.settings-container {
  display: flex;
  flex-direction: column;
  padding: 0 1rem 1rem;

  > .settings-item {
    display: flex;
    flex-direction: column;

    > .settings-item-name {
      font-size: 1.125em;
      font-weight: 600;
    }

    > .settings-item-description {
      padding: 0.25rem 0.75rem;
    }

    > * {
      padding-top: 0.5rem;
    }
  }
}
</style>
