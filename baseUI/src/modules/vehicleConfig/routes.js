import VehicleConfig from "@/modules/vehicleConfig/views/VehicleConfig.vue"
import Mirrors from "@/modules/vehicleConfig/views/Mirrors.vue"

// routes must start with "menu.vehicleconfig" to get a proper angular menu wrapping
// related files:
//  vue:
//   ui\ui-vue\src\modules\vehicleConfig\components\Tuning.vue:98
//   ui\ui-vue\src\modules\vehicleConfig\views\Mirrors.vue:43
//  angular:
//   ui\entrypoints\main\main.js:459
//   ui\modules\vehicleconfig\vehicleconfig.js:182
//   ui\modules\vehicleconfig\vehicleconfig.html:37
//   ui\modules\vehicleconfig\partial.tuning.html:4

export default [
  {
    path: "/vehicle-config",
    name: "menu.vehicleconfig",
    redirect: "/vehicle-config/parts",
    meta: {
      clickThrough: true,
      infoBar: {
        withAngular: false,
        visible: true,
        showSysInfo: false,
      },
      uiApps: {
        shown: true,
      },
      topBar: {
        visible: true,
      }
    },
    children: [
      {
        path: "parts",
        name: "menu.vehicleconfig.parts",
        component: VehicleConfig,
        props: { tab: "parts" },
      },
      {
        path: "tuning",
        name: "menu.vehicleconfig.tuning",
        component: VehicleConfig,
        props: { tab: "tuning" },
      },
      {
        path: "color",
        name: "menu.vehicleconfig.color",
        component: VehicleConfig,
        props: { tab: "color" },
        meta: {
          uiApps: {
            shown: false,
          },
        },
      },
      {
        path: "save",
        name: "menu.vehicleconfig.save",
        component: VehicleConfig,
        props: { tab: "save" },
        meta: {
          uiApps: {
            shown: false,
          },
        },
      },
      {
        path: "debug",
        name: "menu.vehicleconfig.debug",
        component: VehicleConfig,
        props: { tab: "debug" },
      },
    ],
  },
  {
    path: "/vehicle-config/tuning/mirrors/:exitRoute?/",
    name: "menu.vehicleconfig.tuning.mirrors",
    component: Mirrors,
    props: true,
  },
  {
    path: "/vehicle-config/tuning/mirrors-angular",
    name: "menu.vehicleconfig.tuning.mirrors.with-angular",
    component: Mirrors,
    props: { exitRoute: "menu.vehicleconfigold.tuning" },
  },
  {
    path: "/vehicle-config/tuning/mirrors-garage",
    name: "menu.vehicleconfig.tuning.mirrors.in-garage",
    component: Mirrors,
    props: { exitRoute: "garagemode.tuning" },
  },
]
