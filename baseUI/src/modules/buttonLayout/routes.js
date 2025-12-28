import ButtonLayoutView from "./views/ButtonLayoutView.vue"

export default [
  {
    path: "/buttonLayout",
    name: "buttonLayout",
    component: ButtonLayoutView,
    meta: {
      infoBar: {
        visible: true,
        showSysInfo: true,
      },
      uiApps: {
        shown: false,
      },
    },
  }
]
