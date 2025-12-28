// Career routes --------------------------------------

import ProgressLanding from "./views/ProgressLanding.vue"
import CargoDeliveryReward from "./views/CargoDeliveryReward.vue"
import CargoOverview from "./views/CargoOverviewMain.vue"
import CargoDropOff from "./views/CargoDropOff.vue"
import Computer from "./views/ComputerMain.vue"
import Insurances from "./views/InsurancesMain.vue"
import DriverAbstract from "./views/DriverAbstract.vue"
import Logbook from "./views/Logbook.vue"
import Milestones from "./views/Milestones.vue"
import MyCargo from "./views/MyCargo.vue"
import Painting from "./views/PaintingMain.vue"
import PartInventory from "./views/PartInventoryMain.vue"
import PartShopping from "./views/PartShoppingMain.vue"
import Pause from "./views/Pause.vue"
import PauseBigMiddlePanel from "./views/PauseBigMiddlePanel.vue"
import Profiles from "./views/Profiles.vue"
import Repair from "./views/RepairMain.vue"
import Tuning from "./views/TuningMain.vue"
import VehicleInventory from "./views/VehicleInventoryMain.vue"
import VehiclePurchase from "./views/VehiclePurchaseMain.vue"
import VehicleShopping from "./views/VehicleShoppingMain.vue"
import VehiclePerformance from "./views/VehiclePerformanceMain.vue"
import ChooseInsurance from "./views/ChooseInsuranceMain.vue"
import Negotiation from "./views/VehicleNegotiationMain.vue"

export default [
  // Career Pause
  {
    path: "/menu.careerPause",
    name: "menu.careerPause",
    component: Pause,
    props: true,
    meta: {
      clickThrough: true,
      infoBar: {
        withAngular: true,
        visible: true,
        showSysInfo: true,
      },
      uiApps: {
        shown: false,
      },
      topBar: {
        visible: true
      }
    },
  },
  {
    path: "/career",
    children: [
      // Choose Insurance
      {
        path: "chooseInsurance",
        name: "chooseInsurance",
        component: ChooseInsurance,
      },

      // Career Pause (WIP with middle panel)
      {
        path: "pauseBigMiddlePanel",
        name: "pauseBigMiddlePanel",
        component: PauseBigMiddlePanel,
        props: true,
      },

      // Logbook
      {
        path: "logbook/:id(\\*?.*?)?",
        name: "logbook",
        component: Logbook,
        meta: {
          uiApps: {
            shown: false,
          },
        },
        props: true,
      },

      {
        path: "milestones/:id(\\*?.*?)?",
        name: "milestones",
        component: Milestones,
        props: true,
        meta: {
          uiApps: {
            shown: false,
          },
        },
      },

      // Computer
      {
        path: "computer",
        name: "computer",
        component: Computer,
        props: true,
        meta: {
          uiApps: {
            shown: false,
            //layout: "tasklist",
          },
        },
      },

      // Vehicle Inventory
      {
        path: "vehicleInventory",
        name: "vehicleInventory",
        component: VehicleInventory,
      },

      // Vehicle Certification
      {
        path: "vehiclePerformance/:inventoryId?",
        name: "vehiclePerformance",
        component: VehiclePerformance,
        props: true,
      },

      // Tuning
      {
        path: "tuning",
        name: "tuning",
        component: Tuning,
      },

      // Painting
      {
        path: "painting",
        name: "painting",
        component: Painting,
      },

      // Repair
      {
        path: "repair/:header?",
        name: "repair",
        component: Repair,
        props: true,
      },

      // Part Shopping
      {
        path: "partShopping",
        name: "partShopping",
        component: PartShopping,
        meta: {
          uiApps: {
            shown: false,
            //layout: "tasklist",
          },
        },
      },

      // Part Inventory
      {
        path: "partInventory",
        name: "partInventory",
        component: PartInventory,
      },

      // Vehicle Purchase
      {
        path: "vehiclePurchase/:vehicleInfo?/:playerMoney?/:inventoryHasFreeSlot?/:lastVehicleInfo?",
        name: "vehiclePurchase",
        component: VehiclePurchase,
        props: true,
        meta: {
          uiApps: {
            shown: false,
          },
        },
      },

      // Negotiation
      {
        path: "negotiation",
        name: "negotiation",
        component: Negotiation,
      },

      // Vehicle Shopping
      {
        path: "vehicleShopping/:screenTag?/:buyingAvailable?/:marketplaceAvailable?/:selectedSellerId?",
        name: "vehicleShopping",
        component: VehicleShopping,
        props: true,
        meta: {
          uiApps: {
            shown: false,
            //layout: "tasklist",
          },
        },
      },

      // Insurance policies List
      {
        path: "insurances",
        name: "insurances",
        component: Insurances,
      },

      // Driver's Abstract
      {
        path: "playerAbstract",
        name: "playerAbstract",
        component: DriverAbstract,
      },

      // Delivery Reward
      {
        path: "cargoDeliveryReward",
        name: "cargoDeliveryReward",
        component: CargoDeliveryReward,
        props: true,
      },

      // delivery dropoff
      {
        path: "cargoDropOff/:facilityId?/:parkingSpotPath(\\*?.*?)?",
        name: "cargoDropOff",
        component: CargoDropOff,
        props: true,
      },

      // Cargo Overview
      {
        path: "cargoOverview/:facilityId?/:parkingSpotPath(\\*?.*?)?",
        name: "cargoOverview",
        component: CargoOverview,
        props: true,
        meta: {
          uiApps: {
            shown: false,
          },
        },
      },
      {
        path: "myCargo",
        name: "myCargo",
        component: MyCargo,
        props: true,
        meta: {
          uiApps: {
            shown: false,
          },
        },
      },

      // Branch Landing Page
      {
        path: "progressLanding/:pathId?/:comesFromBigMap?",
        name: "progressLanding",
        component: ProgressLanding,
        props: route => ({
          pathId: route.params.pathId,
          comesFromBigMap: route.params.comesFromBigMap === "true" || route.params.comesFromBigMap === true
        }),
        meta: {
          uiApps: {
            shown: false,
          },
          infoBar: {
            visible: true,
          },
        },
      },

      // Domain Landing Page
      {
        path: "domainSelection",
        name: "domainSelection",
        component: ProgressLanding,
        props: true,
        meta: {
          uiApps: {
            shown: false,
          },
          infoBar: {
            visible: true,
          },
        },
      },


      // Profiles
      {
        path: "profiles",
        name: "profiles",
        component: Profiles,
        meta: {
          uiApps: {
            shown: false,
          },
          infoBar: {
            visible: true,
            showSysInfo: true,
          },
        }
      }
    ],
  },
]
