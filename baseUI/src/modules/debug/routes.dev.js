// Debug routes --------------------------------------
import ComponentsView from "@/modules/debug/views/ComponentsView.vue"
import RoutesListView from "@/modules/debug/views/RouteListView.vue"
import UITestView from "@/modules/debug/views/UITestView.vue"
import UITestViewPavel from "@/modules/debug/views/UITestViewPavel.vue"
import UITestViewDestiny from "@/modules/debug/views/UITestViewDestiny.vue"
import UITestViewBird from "@/modules/debug/views/UITestViewBird.vue"
import ControllerUITest from "@/modules/debug/views/ControllerUITest.vue"
import ActiviityStart from "@/modules/activitystart/views/ActivityStart.vue"
import MilestoneMain from "@/modules/milestones/views/MilestoneMain.vue"
import BngScopedNavTest from "./views/BngScopedNavTest.vue"

export default [
  {
    path: "/components/:component?",
    name: "components",
    component: ComponentsView,
    props: true,
  },
  {
    path: "/routelist",
    name: "routelist",
    component: RoutesListView,
  },
  {
    path: "/ui-test",
    name: "ui-test",
    component: UITestView,
  },
  {
    path: "/ui-test-pavel",
    name: "ui-test-pavel",
    component: UITestViewPavel,
  },
  {
    path: "/ui-test-destiny",
    name: "ui-test-destiny",
    component: UITestViewDestiny,
  },
  {
    path: "/ui-test-bird",
    name: "ui-test-bird",
    component: UITestViewBird,
  },
  {
    path: "/bngScopedTestNav",
    name: "bngScopedTestNav",
    component: BngScopedNavTest,
  },
  {
    path: "/controllerUITest",
    name: "controllerUITest",
    component: ControllerUITest,
  },
  {
    path: "/ActivityStart",
    name: "ActivityStart",
    component: ActiviityStart,
  },
  {
    path: "/milestones_",
    name: "milestones_",
    component: MilestoneMain,
  },
]
