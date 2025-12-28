// ActivityStart routes --------------------------------------
import Radial from "@/modules/radial/views/Radial.vue"

export default [
  {
    path: "/radial",
    name: "radial",
    component: Radial,
    meta: {
      uiApps: {
        shown: false,
      },
    },
  },
]
