// Mission related routes
import * as views from "./views"
import MissionDetailsNew from "./views/MissionDetailsNew.vue"
import { CROSSFIRE_HINTS_ALL } from "@/services/infoBar.js"
export default [
  {
    path: "/mission",
    children: [
      // Details
      {
        path: "details",
        name: "mission-details",
        component: MissionDetailsNew,
        // component: views.MissionDetails,
        meta: {
          infoBar: {
            visible: true,
            showSysInfo: false,
            hints: CROSSFIRE_HINTS_ALL,
          },
          uiApps: {
            shown: false,
          },
        },
      },
      //

      {
        path: "mission-control/:mode(\\*?.*?)?",
        name: "mission-control",
        component: views.MissionControl,
        meta: {
          uiApps: {
            shown: false,
          },
        },
        infoBar: {
          visible: true,
          showSysInfo: false,
          hints: CROSSFIRE_HINTS_ALL,
        },
        props: true,
      },

      // WIP: grid viewer
      {
        path: "grid",
        name: "missions-grid",
        component: views.MissionsGrid,
        meta: {
          uiApps: {
            shown: false,
          },
        },
      },
      {
        path: "dragHistory/:id(\\*?.*?)?:name?/:level?/",
        name: "dragHistory",
        component: views.MissionDragHistory,
        meta: {
          uiApps: {
            shown: false,
          },
          infoBar: {
            visible: true,
            showSysInfo: false,
            hints: CROSSFIRE_HINTS_ALL,
          },
        },
        props: true,
      },
    ],
  },
]
