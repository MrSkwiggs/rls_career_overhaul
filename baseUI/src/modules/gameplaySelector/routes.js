import GameplaySelector from "./views/GameplaySelector.vue"

export default [
  {
    name: "menu.gameplayselector",
    path: "/gameplay-selector/:pathMatch(.*)*",
    component: GameplaySelector,
    props: true,
    meta: {
      clickThrough: true,
      infoBar: {
        visible: true,
        showSysInfo: false,
      },
      uiApps: {
        shown: false,
      },
      topBar: {
        visible: true,
      }
    },
  }
]
