<template>
  <div
    class="livery-main-view"
    bng-ui-scope="livery-main-scope"
    v-bng-on-ui-nav:menu="promptBack"
    v-bng-on-ui-nav:back="promptBack"
    v-bng-ui-nav-label:menu,back="'Save/Exit'">
    <!-- TODO: Update loading once UI unification has started -->
    <div class="loading-overlay" v-if="!store.isSetupDone">
      <h1 class="text">Loading...</h1>
    </div>
    <div class="header">
      <LiveryEditorHeader />
    </div>
    <div class="main-view-content">
      <div class="menu-container">
        <BngImageTile
          v-for="(item, index) in MENU_ITEMS"
          v-bng-blur
          bng-nav-item
          v-bng-ui-nav-focus="MENU_ITEMS.length - index"
          :key="item.value"
          :label="item.label"
          :icon="item.icon"
          @click="onMenuItemClicked(item.value)" />
      </div>
    </div>
  </div>
</template>

<script>
const MENU_ITEMS = [
  {
    label: "Paint",
    value: "paint",
    icon: icons.colorPalette,
  },
  {
    label: "Decals",
    value: "decals",
    icon: icons.decal,
  },
  {
    label: "Settings",
    value: "settings",
    icon: icons.gearTuningOutline,
  },
]

const blockedEvents = ["tab_l", "tab_r"]
</script>

<script setup>
import { onBeforeMount, onMounted, onUnmounted, ref } from "vue"
import { BngImageTile, icons, ACCENTS } from "@/common/components/base"
import { vBngBlur, vBngOnUiNav, vBngUiNavLabel, vBngUiNavFocus } from "@/common/directives"
import { useLiveryMainStore } from "@/modules/liveryEditor/stores"
import { useEditorHeaderStore } from "@/modules/liveryEditor/stores"
import { LiveryEditorHeader } from "@/modules/liveryEditor/components"
import { openConfirmation, openPrompt, openProgress } from "@/services/popup"
import { useUINavBlocker } from "@/services/uiNavTracker"
import { useUINavScope } from "@/services/uiNav"
import { useInfoBar } from "@/services/infoBar"

const infobar = useInfoBar()
const uiNavBlocker = useUINavBlocker()
const store = useLiveryMainStore()
const headerStore = useEditorHeaderStore()

useUINavScope("livery-main-scope")

function onMenuItemClicked(item) {
  switch (item) {
    case "paint":
      window.bngVue.gotoGameState("LiveryPaint")
      break
    case "decals":
      window.bngVue.gotoGameState("LiveryDecals")
      break
    case "settings":
      window.bngVue.gotoGameState("LiverySettings")
      break
  }
}

const openedDialog = ref(null)

onBeforeMount(async () => {
  await store.setup()
  headerStore.setHeader("Livery Editor")
  headerStore.setPreheader(null)
})

onMounted(() => {
  infobar.visible = true
  infobar.showSysInfo = true
  uiNavBlocker.blockOnly(blockedEvents)
})

onUnmounted(() => {
  uiNavBlocker.clear()
})

function exit() {
  const exitRes = store.exit()
  exitRes.then(() => {
    window.bngVue.gotoGameState("garagemode")
  })
}

function promptSave() {
  if (openedDialog.value) return

  openedDialog.value = "save"

  const saveChangesButtons = [
    { label: "Save", value: text => ({ value: 1, text }), extras: { default: true } },
    { label: "Save and Exit", value: text => ({ value: -1, text }), extras: { accent: ACCENTS.secondary } },
    { label: "Cancel", value: text => ({ value: 0, text }), extras: { cancel: true, accent: ACCENTS.attention } },
  ]

  openPrompt("Enter save name", "Save", { buttons: saveChangesButtons, defaultValue: store.currentSave.name }).then(res => {
    const { value, text } = res

    if (value === 0) return

    store.currentSave.name = text

    store.save().then(() => {
      if (value === -1) {
        const popup = openProgress("Saving and exporting skin...", "Save", {
          cancellable: false,
          indeterminate: true,
          timeout: 1,
        })

        popup.promise.then(() => exit())
      }
    })

    openedDialog.value = null
  })
}

function promptBack(event) {
  if (openedDialog.value) {
    event.stopPropagation()
    return
  }

  openedDialog.value = "back"

  const saveChangesButtons = [
    { label: "Save", value: 1, extras: { default: true } },
    { label: "Exit (discard changes)", value: -1, extras: { accent: ACCENTS.attention } },
    { label: "Cancel", value: 0, extras: { cancel: true, accent: ACCENTS.secondary } },
  ]

  openConfirmation("Save", "Save your changes", saveChangesButtons).then(res => {
    openedDialog.value = null

    if (res === 1) {
      promptSave()
    } else if (res === -1) {
      exit()
    }
  })

  event.stopPropagation()
}
</script>

<style lang="scss" scoped>
.livery-main-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 0.5rem;
}

.main-view-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  flex-grow: 1;
}

.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  background: rgba(0, 0, 0, 0.5);

  > .text {
    color: white;
  }
}

.main-view-content > .menu-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  > *:not(:last-child) {
    margin-bottom: 0.5rem;
  }
}
</style>
