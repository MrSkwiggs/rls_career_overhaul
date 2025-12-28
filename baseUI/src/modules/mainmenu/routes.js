// MainMenu routes --------------------------------------
import { LayoutEmpty } from "@/common/layouts"
import MainMenu from "./views/MainMenu.vue"
// import ClassicView from "./views/ClassicView.vue"
import MainView from "./views/MainView.vue"
import OthersView from "./views/OthersView.vue"
import DiscoverView from "./views/DiscoverView.vue"

export default [
  {
    path: "/menu.mainmenu",
    component: MainMenu,
    meta: {
      infoBar: {
        visible: true,
        showSysInfo: true,
      },
      uiApps: {
        shown: false,
      },
      topBar: {
        visible: true,
      }
    },
    children: [
      {
        path: "",
        name: "menu.mainmenu",
        component: MainView,
      },
      {
        path: "others",
        name: "menu.mainmenu.others",
        component: OthersView,
        meta: {
          topBar: {
            visible: false,
          }
        }
      },
      {
        path: "discover",
        name: "menu.mainmenu.discover",
        component: DiscoverView,
        meta: {
          topBar: {
            visible: false,
          }
        }
      },
    ]
  },
  // { // this state doesn't seem to happen in angular as well
  //   path: "/menu.start_loadmainmenu",
  //   name: "menu.start_loadmainmenu",
  //   component: MainMenu,
  // },
  { // this state is used to display top/info-bar in menus
    path: "/menu.:sub(.*)?",
    name: "menu",
    component: LayoutEmpty, // just an empty content to make vue-router happy
    meta: {
      clickThrough: true,
      topBar: {
        visible: true
      },
      infoBar: {
        withAngular: true,
        visible: true,
        showSysInfo: true,
      }
    },
  },
]
