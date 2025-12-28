// Garage routes --------------------------------------
import Garage from "@/modules/garage/views/Garage.vue"

export default [
  {
    path: "/garagemode/:component?",
    name: "garagemode",
    component: Garage,
    props: true,
    meta: {
      infoBar: {
        visible: true,
        showSysInfo: false,
      },
      uiApps: {
        shown: true,
      },
    },
  },
  {
    path: "/garagemode/tuning",
    name: "garagemode.tuning",
    component: Garage,
    props: { component: "tuning" },
    meta: {
      infoBar: {
        visible: true,
        showSysInfo: false,
      },
      uiApps: {
        shown: true,
      },
    },
  },
]
