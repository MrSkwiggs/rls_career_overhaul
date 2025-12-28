<template>
  <MainBackground ref="mainBackground" v-if="bgRequired" />

  <div
    v-if="route.name !== 'unknown'"
    :class="{
      'vue-app-main': true,
      'click-through': contClickThrough || (route.meta && route.meta.clickThrough),
    }">
    <TopBar ref="topBar" />
    <router-view />
    <InfoBar />
  </div>

  <PauseButton :teleport-to="topBar?.pauseButtonTarget" />

  <!-- this is a non-blocking div popup -->
  <Popup type="activity" v-if="route.name === 'unknown'" />
  <!--
    and this is a blocking dialog popup that renders above everything regardless of z-index when shown.
    if you want to render something on top of a popup, you need to put your component inside of a Popup component.
    ideally, z-index of your content should be set to 12000 and above.
    when popup is not shown, your content will be rendered in place of the popup.
  -->
  <Popup>
    <Popover />
  </Popup>

  <LoadingScreen />

  <!-- this debug overlay gets teleported away to the body, so there's no way to render it on top of a popup -->
  <VueDebug />

  <div id="vue-app-container">
    <template v-for="(app, index) of apps" :key="app.appKey">
      <Teleport v-if="appTargets[app.teleport]" :to="app.teleport">
        <component :is="app.comp" v-bind="app.props"></component>
      </Teleport>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, provide } from "vue"
import { useRoute } from "vue-router"
import { SysInfo } from "@/services"
import { useScopedNavFocusManager } from "@/services/scopedNav"
import { spawnUiApp, destroyUiApp } from "@/modules/apps/appManager"
import { LAYOUT_ALIGNMENTS } from "@/common/layouts"
import LoadingScreen from "@/common/modules/loading/views/LoadingScreen.vue"
import PauseButton from "@/common/modules/pause/components/pauseButton.vue"
import VueDebug from "@/modules/debug/components/VueDebug.vue"
import InfoBar from "@/common/modules/infobar/components/InfoBar.vue"
import TopBar from "@/common/modules/topbar/TopBar.vue"
import Popup from "@/common/modules/popup/views/Popup.vue"
import Popover from "@/common/views/Popover.vue"
import MainBackground from "@/common/modules/main-bg/components/MainBackground.vue"
import { useSettings } from "@/services/settings"
import router from "@/router"

const route = useRoute()

const settings = useSettings()

const bngVue = window.bngVue || {}

const apps = ref([])
const appContCnt = ref(0)
const appTargets = computed(() =>
  apps.value.reduce(
    (res, { teleport }) => ({
      ...res,
      [teleport]: document.getElementById(teleport.substring(1)),
      cnt: appContCnt.value, // triggers the effect
    }),
    {}
  )
)
bngVue.updateAppContainer = () =>
  window.requestAnimationFrame(
    () => (appContCnt.value = ++appContCnt.value % 1e5) // trigger effect
  )

const contClickThrough = ref(false)

bngVue.gotoAngularState = (state = "blank", params = undefined) =>
  window.angular && window.angular.element(document.querySelector("body")).controller().changeAngularStateFromVue(state, params)

bngVue.gotoGameState = (state = "ui-test", { params = false, tryAngularJS = true, blankAngularJS = true, clickThrough = false, uiAppsShown = false } = {}) => {
  const a = history.state
  if (!router.hasRoute(state)) {
    window.location.hash = "#/" + state
    if (route) {
      handleUiAppsMeta(route, uiAppsShown)
      router.bngUpdateMeta(route)
    }
    if (tryAngularJS) bngVue.gotoAngularState(state, params)
  } else {
    blankAngularJS && bngVue.gotoAngularState("blank")
    const newroute = router.resolve({ name: state, params })
    handleUiAppsMeta(newroute, uiAppsShown)
    if (newroute.name === route.name) {
      router.bngUpdateMeta(route)
    }
    window.location.hash = newroute.href
    router.replace({ name: state, params })
  }
  history.replaceState(a, "", window.location.toString())
  contClickThrough.value = clickThrough
}

// FIXME: this is a hack! angular and vue states MUST sync their uiAppsShown flag at least somehow
function handleUiAppsMeta(route, uiAppsShown) {
  if (!route.meta) route.meta = { uiApps: {} }
  else if (!route.meta.uiApps) route.meta.uiApps = {}
  if (typeof route.meta.uiApps.shown !== "boolean") route.meta.uiApps.shown = uiAppsShown
}

bngVue.getCurrentRoute = () => router.currentRoute.value

bngVue.spawnApp = (appName, appId, params = null) => spawnUiApp(appName, appId, params, apps.value)

bngVue.destroyApp = appName => destroyUiApp(appName, apps.value)

useScopedNavFocusManager()

const topBar = ref()
provide("setBack", (id, fn) => topBar.value?.setBack(id, fn))
provide("showTopbarTabBindings", val => topBar.value && (topBar.value.showTabBindings = val))
provide("showTopbarBackBinding", val => topBar.value && (topBar.value.showBackBinding = val))

const bgRequired = SysInfo.mainMenuBackgroundRequired
const mainBackground = ref()
provide("mainBackground", computed(() => mainBackground.value?.carousel))
provide("mainBackgroundBlur", computed(() => mainBackground.value?.backgrounds.blur))

watch([
  () => settings.values.uiLayoutContentAlignment,
  () => settings.values.uiLayoutContentWidth,
], ([alignment, width]) => {
  const rootStyle = document.documentElement.style
  alignment = LAYOUT_ALIGNMENTS[alignment || "center"]
  width = width ? `${width}px` : "100vw"
  // FIXME: angular interferes with styles at inapropriate times, resetting css. but raf seems to help.
  //        repro: change the related settings without raf, and see them changing back right away.
  window.requestAnimationFrame(() => {
    rootStyle.setProperty("--layout-content-alignment", alignment)
    rootStyle.setProperty("--layout-content-width", width)
    /// in case the above would still misbehave:
    // rootStyle.cssText += `--layout-content-alignment: ${alignment}; --layout-content-width: ${width};`
  })
}, { immediate: true })
</script>

<style scoped lang="scss" src="@/styles/main.scss" />

<style lang="scss">
@use "@/styles/modules/colors" as *;
@use "@/styles/modules/mixins" as *;

:root {
  @include set-ui-rem(16px);
  @include bng-colors();
}

.vue-app-main {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--zorder_index_fullscreen_default);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  font-family: var(--fnt-defs);
  overflow: hidden;
}

.click-through {
  pointer-events: none;
  > * {
    pointer-events: all;
  }
}

.screen-locked {
  &, * {
    pointer-events: none !important;
  }
}
</style>
