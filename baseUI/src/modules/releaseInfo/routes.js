import ReleaseInfo from "./views/ReleaseInfo.vue"

export default [
  {
    name: "menu.release-info",
    path: "/release-info",
    component: ReleaseInfo,
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
