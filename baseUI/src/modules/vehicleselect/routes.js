import VehicleSelector from "./views/VehicleSelector.vue"

export default [
  {
    name: "menu.vehiclesnew",
    path: "/vehicle-selector/:pathMatch(.*)*",
    component: VehicleSelector,
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