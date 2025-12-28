import FreeroamSelector from "./views/FreeroamSelector.vue"
import FreeroamConfigurator from "./views/FreeroamConfigurator.vue"
import FreeroamWizard from "./views/FreeroamWizard.vue"

export default [
  {
    name: "menu.freeroamselector",
    path: "/freeroam-selector/:pathMatch(.*)*/:itemDetails(.*)*",
    component: FreeroamSelector,
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
  },
  {
    name: "menu.freeroamconfigurator",
    path: "/freeroam-configurator",
    component: FreeroamConfigurator,
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
        visible: false,
      }
    },
  },
  {
    name: "menu.freeroamWizard",
    path: "/freeroam-wizard/:step/:pathMatch(.*)*/:itemDetails(.*)*",
    component: FreeroamWizard,
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
        visible: false,
      }
    },
  }
]
