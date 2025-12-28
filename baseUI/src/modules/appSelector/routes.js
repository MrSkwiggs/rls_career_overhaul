import AppSelector from "./views/AppSelector.vue"
import NotFoundView from "@/views/NotFound.vue"

export default [
  {
    name: "menu.appselector",
    path: "/app-selector/:pathMatch(.*)*",
    component: AppSelector,
    props: true,
    meta: {
      clickThrough: false,
      infoBar: { visible: true, showSysInfo: false },
      uiApps: { shown: false },
      topBar: { visible: true },
    },
  },
  { // this is a hack that allows to show ui-apps, because normally vue defaults to "menu" state with meta.uiApps.shown=false
    name: "menu.appedit",
    path: "/app-edit/",
    component: NotFoundView,
    meta: {
      clickThrough: true,
      infoBar: { visible: true, showSysInfo: false },
      uiApps: { shown: true },
      topBar: { visible: true },
    },
  },
]
