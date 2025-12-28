import OnlineConsentView from "./views/OnlineConsentView.vue"

export default [
  {
    path: "/online-consent",
    name: "menu.onlineFeatures",
    component: OnlineConsentView,
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
