import { createRouter, createWebHashHistory } from "vue-router"
import { reportState } from "@/services/stateReporter.js"
import { useUIApps } from "@/services/uiApps.js"
import { useInfoBar } from "@/services/infoBar.js"
import { useTopBar } from "@/services/topBar.js"

import NotFoundView from "@/views/NotFound.vue"

// DEV_ONLY >>
import DebugRoutes from "@/modules/debug/routes.dev.js"
// << END_DEV_ONLY

const router = createRouter({
  history: createWebHashHistory(),
  // routes,
  routes: [
    ...Object.values(import.meta.glob("@/modules/*/routes.js", { eager: true, import: "default" }))
      .flatMap(routes => routes || []),
    // DEV_ONLY >>
    ...DebugRoutes,
    // << END_DEV_ONLY
    {
      path: "/:catchAll(.*)*",
      name: "unknown",
      component: NotFoundView,
    },
  ],
})

router.bngUpdateMeta = to => {
  if (!to.meta) return
  if (to.meta.uiApps) handelUIAppsSettings(to.meta.uiApps)
  handleInfoBarSettings(to.meta.infoBar || {})
  handleTopBarSettings(to)
}

router.afterEach((to, from) => {
  // console.log(`Router from:${from.path} to:${to.path}`)
  // console.log(to.matched[0].name)

  // report state to Lua
  reportState(to.path, true, from.path)

  window.bridge.api.engineLua(`extensions.hook("onUiChangedState", "${to.name}", "${from.name}")`)

  // deal with any 'meta' settings
  router.bngUpdateMeta(to)
})

const handelUIAppsSettings = settings => {
  const appsAPI = useUIApps()
  if (settings.layout) appsAPI.setLayout(settings.layout)
  // Only set the visibility if the property is specified (this is different to how angular behaves, but to keep all Vue states behaving as before - not touching UIApps - we need this)
  // TODO - We can switch to having `false` be default in the future
  if ("shown" in settings) appsAPI.setVisible(settings.shown)
}

const handleInfoBarSettings = settings => {
  const infoBar = useInfoBar()
  infoBar.visible = settings.visible
  infoBar.showSysInfo = settings.showSysInfo
  infoBar.withAngular = settings.withAngular
  if (settings.hints) {
    infoBar.clearHints()
    infoBar.addHints(settings.hints)
  }
}

const handleTopBarSettings = to => {
  const topBar = useTopBar()
  const meta = to.meta.topBar || {}

  if (!meta.visible) topBar.hide()
  else if (meta.visible && !topBar.visible) topBar.show()

  topBar.onUIStateChanged(to)
}

export default router
