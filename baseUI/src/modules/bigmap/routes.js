// BigMap routes --------------------------------------
import BigMapView from "./views/BigMapView.vue"

export default [
  {
    path: "/bigmap",
    name: "bigmap",
    component: BigMapView,
    meta: {
      uiApps: {
        shown: false,
      },
      infoBar: {
        visible: true,
        showSysInfo: true,
      },
    },
  },
]