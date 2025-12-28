import LiveryEditorVue from "@/modules/liveryEditor/views/LiveryEditor.vue"
// import LiveryFileManager from "@/modules/liveryEditor/views/LiveryFileManager"
// import LiveryMain from "@/modules/liveryEditor/views/LiveryMain"
import { LiveryMain, LiveryManager } from "@/modules/liveryEditor/views"
import LiveryPaintMain from "./views/LiveryPaintMain.vue"
import LiveryDecalsMain from "./views/LiveryDecalsMain.vue"
import LiveryDecalSelector from "./views/LiveryDecalSelector.vue"
import LiveryLayerEdit from "./views/LiveryLayerEdit.vue"
import LiveryCameraSettings from "./views/LiveryCameraSettings.vue"
import LayerTransform from "./views/LayerTransform.vue"
import LayerMaterials from "./views/LayerMaterials.vue"
import LayerProjection from "./views/LayerProjection.vue"
import LiverySettingsMain from "./views/LiverySettingsMain.vue"

export default [
  {
    path: "/livery-editor",
    name: "LiveryEditor",
    component: LiveryEditorVue,
  },
  {
    path: "/livery-main",
    name: "LiveryMain",
    component: LiveryMain,
  },
  {
    path: "/livery-paint",
    name: "LiveryPaint",
    component: LiveryPaintMain,
  },
  {
    path: "/livery-decals",
    name: "LiveryDecals",
    component: LiveryDecalsMain,
  },
  {
    path: "/livery-settings",
    name: "LiverySettings",
    component: LiverySettingsMain,
  },
  {
    path: "/livery-camera-settings",
    name: "LiveryCameraSettings",
    component: LiveryCameraSettings,
  },
  {
    path: "/livery-decal-selector",
    name: "LiveryDecalSelector",
    component: LiveryDecalSelector,
  },
  {
    path: "/livery-layer-edit",
    name: "LiveryLayerEdit",
    component: LiveryLayerEdit,
  },
  {
    path: "/layer-transform",
    name: "LayerTransform",
    component: LayerTransform,
  },
  {
    path: "/layer-materials",
    name: "LayerMaterials",
    component: LayerMaterials,
  },
  {
    path: "/layer-projection",
    name: "LayerProjection",
    component: LayerProjection,
  },
  {
    path: "/livery-manager",
    name: "LiveryManager",
    component: LiveryManager,
  },
]
