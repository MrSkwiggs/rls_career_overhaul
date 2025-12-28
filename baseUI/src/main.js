import * as Vue from "vue/dist/vue.esm-bundler.js"

// Polyfills for newer JS stuff in case of CEF reversion
// import "@/utils/polyfills.js"

import { createApp, ref, reactive } from "vue"
import { createPinia } from "pinia"
import Emitter from "eventemitter3"

import { useBridge, setBridgeDependencies } from "@/bridge"
import logger from "@/services/logger"
import { initTranslation } from "@/services/translation"
import { UINavService, setUINavServiceInstance } from "@/services/uiNav"
import { useUINavTracker } from "@/services/uiNavTracker"
import { useTopBar } from "@/services/topBar"
import { SysInfo } from "@/services"
import useControlsStore from "@/services/controls"
import { icons } from "@/common/components/base"

import { init as watchdogInit } from "@/services/watchdog"

import App from "./App.vue"

import router from "@/router"

// UI Apps registration
import { registerApps } from "@/modules/apps/appManager"
import * as UiApps from "@/modules/apps"
import { useGameContextStore } from "@/services/gameContextStore"
import { customDisposePlugin } from "@/utils/storePlugins"
import { initFocusVisible } from "@/services/uiNavFocus"

window.watchdogInit = watchdogInit

// make sure Vue available globally for legacy stuff depending on it
window.Vue = Vue

// set up the bridge with the game, and store it globally (vueService will need it - at least until we eventually retire that)
const deps = {
  Emitter,
  beamng: window.beamng,
}

// set an override if an API is already set up
if (window.bngApi) deps["overrideAPI"] = window.bngApi
setBridgeDependencies(deps)
let bridge = useBridge()
window.bridge = bridge

// initialise systemInfo service
SysInfo.init()

// initialise our focus visible polyfill
initFocusVisible()

// switch on the UI Nav events & hook up a global handler (involving crossfire) to use them
// bridge.uiNavEvents.activate()
// bridge.uiNavEvents.hookGlobalEvents(true)
bridge.uiNavService = new UINavService(bridge.events)
setUINavServiceInstance(bridge.uiNavService)
bridge.uiNavService.initialize()

const pinia = createPinia()
  .use(() => ({ $game: bridge }))
  .use(customDisposePlugin)

const app = createApp(App)
  .use(router)
  .use(pinia)
  .use(registerApps, UiApps)

// add global stores
// TODO: Create a wrapper function/file that aggregates all of them
useGameContextStore()

window.bngVue = {
  start: () => {
    if (!window.vueGlobalStore) {
      window.vueGlobalStore = reactive({})
    }

    const globals = {
      $game: bridge,
      $console: logger,
      $logger: logger,
      $simplemenu: ref(!!window.beamng?.simplemenu),
      $globalStore: window.vueGlobalStore,
    }

    const { i18n, plugin: translationPlugin } = initTranslation()

    app
      .use(i18n)
      .use(translationPlugin())

    for (const [key, value] of Object.entries(globals)) {
      app.config.globalProperties[key] = value
      app.provide(key, value)
    }

    app.mount("#vue-app")

    const controlsStore = useControlsStore()
    window.bngVue.controls = {
      // core data
      getControllers: () => controlsStore.controllers,
      getPlayers: () => controlsStore.players,
      getCategories: () => controlsStore.categories,
      getCategoriesList: () => controlsStore.categoriesList,

      // methods
      findBindingForAction: controlsStore.findBindingForAction,
      getActionDetails: controlsStore.getActionDetails,
      getBindingDetails: controlsStore.getBindingDetails,
      getAllBindingsForAction: controlsStore.getAllBindingsForAction,
      addNewBinding: controlsStore.addNewBinding,
      updateBinding: controlsStore.updateBinding,
      deleteBinding: controlsStore.deleteBinding,
      deleteBindings: controlsStore.deleteBindings,

      // utility functions
      deviceIcon: controlsStore.deviceIcon,
      isFFBBound: controlsStore.isFFBBound,
      isFFBEnabled: controlsStore.isFFBEnabled,
      isFFBCapable: controlsStore.isFFBCapable,
      isGamepadAvailable: controlsStore.isGamepadAvailable, // should not be used
      captureBinding: controlsStore.captureBinding,
      makeViewerObj: controlsStore.makeViewerObj,

      // dynamic flags
      isControllerAvailable: controlsStore.isControllerAvailable,
      isControllerUsed: controlsStore.isControllerUsed,
      showIfController: controlsStore.showIfController,
      focusIfController: controlsStore.focusIfController,

      // force refresh data from lua
      refreshData: () => bridge.lua.extensions.core_input_bindings.notifyUI("Vue exposed controls service needs the data")
    }

    window.bngVue.uiNavTracker = useUINavTracker()
    window.bngVue.topBar = useTopBar()
  },
  startTest: () => {
    app.mount("#vue-app")
  },
  isProd: process.env.NODE_ENV === "production",
  icons,
}

// start the app if we're outside the game
if (!window.beamng) {
  window.bngVue.start({
    i18n: window.i18n,
  })
}
