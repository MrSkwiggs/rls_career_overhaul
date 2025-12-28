// Refuelling routes --------------------------------------

import RefuellingInterface from "@/modules/refuel/views/RefuelMain.vue"

export default [
  {
    path: "/refueling",
    name: "refueling",
    component: RefuellingInterface,
    meta: {
      uiApps: {
        shown: false,
        //layout: "tasklist",
      },
    },
  },
]
