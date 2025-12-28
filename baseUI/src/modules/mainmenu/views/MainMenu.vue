<template>
  <div
    :class="{
      'mainmenu-container': true,
      'mainmenu-with-angular': withAngular,
      'mainmenu-fadein': firstTime && !withAngular,
    }"
    v-bng-scoped-nav="{ activateOnMount: true, canDeactivate: canDeactivateScope, canBubbleEvent}"
    v-bng-on-ui-nav:menu="handleBack"
    @deactivate="handleBack"
  >
    <div v-bng-on-ui-nav:back="handleBack" class="main-view">
      <BngCard v-if="devEnv.env" class="dev-info">
        <BngCardHeading type="ribbon">Developer Release</BngCardHeading>
        <div class="dev-info-content">
          <BngIcon class="dev-info-icon" :type="icons.bug" bng-all-clicks-no-nav v-bng-double-click="quickLoadLevel" />
          <div class="dev-info-text">
            <div>
              Graphics API: {{ devEnv.videoApi || "requesting..." }}
            </div>
            <div>
              UI Engine: {{ devEnv.UIEngine || "requesting..." }}
            </div>
          </div>
        </div>
      </BngCard>

      <div class="mainmenu-title">
        <Logo />
      </div>

      <router-view
        :first-time="firstTime && !withAngular"
        :addons="addons"
        @change-view="changeView"
      />

      <div v-if="!viewName" class="bottom-buttons">
        <BngButton
          v-if="repoEnabled"
          class="btn-mods"
          :accent="ACCENTS.text"
          v-bng-blur="!bgRequired"
          v-bng-sound-class="'bng_click_hover_generic'"
          @click="navigate('menu.mods.repository')"
        >
          <BlurBackground v-if="bgRequired" />
          <div class="btn-content">
            <span class="label">{{ $tt("ui.mainmenu.repo") }}</span>
            <span class="small" v-if="modCounts.total > 0">&nbsp;({{ modCounts.active }} / {{ modCounts.total }})</span>
          </div>
        </BngButton>
        <BngButton
          v-else
          class="btn-mods"
          :class="{ 'mods-after-update': modsAfterUpdate }"
          :accent="ACCENTS.text"
          v-bng-blur="!bgRequired"
          v-bng-sound-class="'bng_click_hover_generic'"
          @click="navigate('menu.mods.local')"
        >
          <BlurBackground v-if="bgRequired" />
          <div class="btn-content">
            <span class="label"><BngIcon :type="'danger'" style="font-size: 1.1em;" color="#ff2d00" v-if="modsAfterUpdate"/>{{ $tt("ui.mainmenu.mods") }}</span>
            <span class="small" v-if="modCounts.total > 0">&nbsp;({{ modCounts.active }} / {{ modCounts.total }})</span>
          </div>
        </BngButton>
        <BngButton
          :accent="ACCENTS.text"
          v-bng-blur="!bgRequired"
          v-bng-sound-class="'bng_click_hover_generic'"
          @click="navigate('credits')"
        >
          <BlurBackground v-if="bgRequired" />
          <div class="btn-content">
            <span class="label">{{ $tt("ui.mainmenu.credits") }}</span>
          </div>
        </BngButton>
        <BngButton
          :accent="ACCENTS.text"
          v-bng-blur="!bgRequired"
          v-bng-sound-class="'bng_click_hover_generic'"
          @click="navigate('menu.options.display')"
        >
          <BlurBackground v-if="bgRequired" />
          <div class="btn-content">
            <span class="label">{{ $tt("ui.mainmenu.options") }}</span>
          </div>
        </BngButton>
        <BngButton v-if="!devEnv.simplemenu"
          class="btn-quit"
          :accent="ACCENTS.attention"
          :icon="icons.exit"
          v-bng-blur="!bgRequired"
          v-bng-sound-class="'bng_click_hover_generic'"
          @click="quitGame()"
        >
          <BlurBackground v-if="bgRequired" />
          <div class="btn-content">
            <span class="label">{{ $tt("ui.inputActions.general.quit.title") }}</span>
          </div>
        </BngButton>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick, inject } from "vue"
import { useRoute } from "vue-router"
import router from "@/router"
import { BngCard, BngCardHeading, BngButton, BngIcon, icons, ACCENTS } from "@/common/components/base"
import { vBngSoundClass, vBngOnUiNav, vBngBlur, vBngDoubleClick, vBngScopedNav } from "@/common/directives"
import { useInfoBar } from "@/services/infoBar.js"
import { lua } from "@/bridge"
import { runRaw } from "@/bridge/libs/Lua.js"
import { useEvents } from "@/services/events"
import { $translate, SysInfo } from "@/services"
import { useSettingsAsync } from "@/services/settings"
import { useUINavScope } from "@/services/uiNav"
import BlurBackground from "@/common/modules/main-bg/components/BlurBackground.vue"
import Logo from "../components/Logo.vue"

const events = useEvents()
const infoBar = useInfoBar()
useUINavScope("mainmenuUI")

const withAngular = computed(() => !SysInfo.mainMenuBackgroundRequired.value)
const firstTime = ref(SysInfo.mainMenuFirstTime.value)

const bgRequired = SysInfo.mainMenuBackgroundRequired
const parentImageCarousel = inject("mainBackground")

const modCounts = SysInfo.modCounts


/// dev thingy

const devEnv = reactive({
  env: window.beamng && !window.beamng.shipping,
  vue: process.env.NODE_ENV === "development",
  simplemenu: window.beamng && window.beamng.simplemenu,
  videoApi: null,
  UIEngine: null,
})

const quickLoadLevel = () => lua.core_levels.startLevel("/levels/smallgrid/main.level.json")

/// /dev thingy


/// addons

const addons = ref({})

const addButton = ({ translateid, icon, targetState, title, iconId, action }) => {
  let newButton
  if (translateid || icon || targetState) {
    // Angular style
    newButton = {
      title: $translate.instant(translateid),
      icon,
      action: targetState,
    }
  } else {
    // Vue style
    newButton = {
      title,
      iconId,
      action,
    }
  }
  addons.value[newButton.title] = newButton
}

/// /addons


const viewName = ref()
const changeView = name => {
  viewName.value = name
  router.push("/menu.mainmenu" + (name ? "/" + name : ""))
}
watch(
  () => viewName.value,
  val => {
    !!val && infoBar.flashHints("back")
    parentImageCarousel.value && nextTick(parentImageCarousel.value.carousel.showNext)
  }
)

const route = useRoute()
watch(
  () => route.name,
  name => {
    if (typeof name !== "string") {
      viewName.value = null
      return
    }
    if (!name.startsWith("menu.mainmenu")) return
    viewName.value = name === "menu.mainmenu" ? null : name.slice("menu.mainmenu.".length)
  },
  { immediate: true }
)

const navigate = (...state) => window.bngVue.gotoGameState(...state)

function quitGame() {
  lua.quit()
  runRaw("TorqueScript.eval('quit();')", false)
}

const handleBack = (event) => {
  if (event.detail.force) return
  // if back button is pressed and we're on the main menu, do nothing
  // if (event.detail.name === "back" && !viewName.value) return true

  if (viewName.value) {
    viewName.value = null
    changeView(null)
  } else if (event.detail.name === "back" || event.detail.name === "menu") {
    window.globalAngularRootScope?.$broadcast("MenuToggle")
    // return true // let event bubble up and do a normal "back"
  }
}

const canDeactivateScope = () => !viewName.value
const canBubbleEvent = (event) => {
  if (event.detail.value !== 1) return false

  const eventName = event.detail.name
  return eventName === "tab_l" || eventName === "tab_r" ? !viewName.value : false
}

// TODO: move to services; needs a unified service for messages
function displayToast(type, title, titleContext, msg, messageContext) {
  const msgTxt = $translate.contextTranslate({ txt: msg, context: messageContext})
  const titleTxt = $translate.contextTranslate({ txt: title, context: titleContext})
  const msgHtml = window.angularParseBBCode(msgTxt) // use this to enable angular things
  const titleHtml = window.angularParseBBCode(titleTxt) // use this to enable angular things
  window.globalAngularRootScope.$broadcast("toastrMsg", {
    type,
    msg: msgHtml,
    title: titleHtml,
    config: {
      positionClass: "toast-top-right",
      timeOut: 0,
      extendedTimeOut: 0,
      onTap() {
        window.bngVue.gotoGameState("menu.options.performance")
      }
    }
  })
}

async function checkHardware() {
  lua.checkFSErrors()
  const info = await lua.core_hardwareinfo.getInfo()
  if (info.globalState === "ok") return // all good
  for (const key in info) {
    if (!info[key].warnings || !Array.isArray(info[key].warnings)) continue
    for (const warning of info[key].warnings) {
      if (warning.ack) continue
      displayToast(info.globalState === "warn" ? "warning" : "error",
        "ui.performance.warnings." + warning.msg, warning.context,
        "ui.mainmenu.warningdetails", null,
      )
    }
  }
}

const repoEnabled = ref(false)
const modsAfterUpdate = ref(false)

const onSettingsChanged = (data) => {
  modsAfterUpdate.value = data.values.disableModsAfterUpdate
  repoEnabled.value = data.values.onlineFeatures === "enable" && !data.values.disableModsAfterUpdate
}

onMounted(async () => {
  function advertMainMenu() {
    events.emit("MainMenuButtons", addButton)
    window.globalAngularRootScope.$broadcast("MainMenuButtons", addButton)
  }
  advertMainMenu()
  events.on("UiModsChanged", advertMainMenu)
  events.on("BroadcastMainMenuButtons", advertMainMenu)

  events.on('SettingsChanged', onSettingsChanged)
  lua.settings.notifyUI()
  // setTimeout(() => {
  //   beamng.sendEngineLua("sendUIModules()")
  // }, 3000)

  if (devEnv.env) {
    devEnv.videoApi = await lua.Engine.Render.getAdapterType()
    devEnv.UIEngine = await lua.Engine.UI.getUIEngine()
  }

  if (SysInfo.mainMenuFirstTime.value) {
    checkHardware()
  }

  const settings = await useSettingsAsync()
  if (!await lua.extensions.tech_license.isValid()) {
    if (settings.values.onlineFeatures === "ask" || settings.values.telemetry === "ask") {
      window.bngVue.gotoGameState("menu.onlineFeatures")
    } else {
      lua.settings.getValue("showedInputLayoutPopupV37").then(value => {
        if (value === false) {
          window.bngVue.gotoGameState("buttonLayout")
        }
      })
    }
  }

  SysInfo.mainMenuFirstTime.value = false // to save the flag for later
})

onUnmounted(() => {
  events.off('SettingsChanged', onSettingsChanged)
})
</script>

<style lang="scss" scoped>
@use "@/styles/modules/mixins" as *;

$rem: calc-ui-rem();

.mainmenu-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  font-size: $rem;

  // hide the scoped nav focus frame
  &::before {
    display: none !important;
  }


  .background-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
  }
  &.mainmenu-with-angular { // note: we're *assuming* that we're visually wrapped with angular
    margin-top: 2.5em;
  }
}

.mainmenu-fadein .main-view {
  animation: fadein 1.5s;
  @keyframes fadein {
    0%, 50% { opacity: 0; }
    100% { opacity: 1; }
  }
}

.backgrounds-cache {
  // this must not be display:none; in order to work
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  opacity: 0;
  overflow: hidden;
}

.mainmenu-title {
  margin-bottom: 3em !important;
}

.main-view {
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: absolute;
  width: 100%;
  height: calc(100% - 3em);
}

.bottom-items {
  display: flex;
  flex-direction: row;
  justify-content: center;
  pointer-events: all;
}

.mods-top {
  position: absolute;
  top: 1em;
  left: 1em;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 1em;
  pointer-events: all;
}

.dev-info {
  position: absolute;
  top: 1em;
  left: 1em;
  min-width: 20em;
  color: white;
  pointer-events: all;
  .dev-info-icon {
    font-size: 3em;
  }
  .dev-info-content {
    display: flex;
    align-items: center;
    padding: 5px 10px 10px 10px;
    font-weight: bold;
    font-size: 20px;
    font-family: Roboto;
    border-radius: var(--bng-corners-1);
  }
  .dev-info-text {
    padding-left: 0.5em;
    > * {
      display: block;
      margin-bottom: 0.5em;
    }
  }
}

.bottom-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(calc-ui-rem(12), 1fr));
  padding: 0 $rem;
  width: calc-ui-rem(64);
  align-self: center;
  > * {
    min-height: 2.5em;
    font-size: 1.2em;
    pointer-events: all;
  }
  .btn-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  .btn-mods {
    // background-color: rgba(var(--bng-orange-750-rgb), 0.6) !important;
    .label {
      line-height: 1.2;
    }
    .small {
      font-size: calc-ui-rem(0.8);
      line-height: 1.2;
    }
    &.mods-after-update {
      position: relative;
      :deep(.background) {
        font-size: $rem;
        $color: var(--bng-add-red-600-rgb);
        box-shadow: inset 0 0 0 calc-ui-rem(0.125) rgba($color, 1);
        background-image:
          linear-gradient(-45deg, rgba($color, 0) calc(50% - 0.124em), rgba($color, 1) calc(50% - 0.125em), rgba($color, 1) calc(50% + 0.125em), rgba($color, 0) calc(50% + 0.126em)),
          linear-gradient(90deg, rgba(0, 0, 0, 0.80) 0%, rgba(0, 0, 0, 0.50) 30%, rgba(0, 0, 0, 0.00) 50%, rgba(0, 0, 0, 0.50) 70%, rgba(0, 0, 0, 0.80) 100%),
          repeating-linear-gradient(-45deg, rgba($color, 0), rgba($color, 0) 0.424em, rgba($color, 0.8) 0.425em, rgba($color, 0.8) 0.55em);
      }
      .label, .small {
        opacity: 1;
      }
    }
  }
  .btn-quit {
    :deep(.background) {
      opacity: 0.6;
    }
    &:hover {
      :deep(.background) {
        opacity: 1;
      }
    }
  }
}

</style>
