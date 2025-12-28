import { computed, reactive, ref } from "vue"
import { defineStore } from "pinia"
import { lua, useBridge } from "@/bridge"
import { EDITOR_CONTEXT, EDITOR_VIEWS, useLiveryEditorStore } from "@/modules/liveryEditor/stores"

const EDIT_MODE = lua.extensions.ui_liveryEditor_editMode
const DECAL_LAYER = lua.extensions.ui_liveryEditor_layers_decals
const TRANSFORM_TOOL = lua.extensions.ui_liveryEditor_tools_transform
const MATERIAL_TOOL = lua.extensions.ui_liveryEditor_tools_material
const SETTINGS_TOOL = lua.extensions.ui_liveryEditor_tools_settings

export const useLayerSettingsStore = defineStore("layerSettings", () => {
  const { events } = useBridge()
  const rootStore = useLiveryEditorStore()

  const active = ref(false)
  const targetLayer = ref({})
  const currentTool = ref(null)
  const toolsData = ref(null)
  const requestApplyActive = ref(false)
  const decalTexture = ref(null)
  const isChangeDecal = ref(null)
  const activeSettings = ref(null)
  const editModeState = reactive({
    lockScaling: false,
  })

  const isStampMode = computed(() => toolsData.value && toolsData.value.mode === "stamp")

  const _reapplyActive = ref(false)

  const cursorData = ref(null)
  const _appliedLayers = ref(null)
  const activeLayerUid = ref(null)
  const reapplyActive = computed({
    get: () => _reapplyActive.value,
    set: async newValue => {
      if (newValue) await lua.extensions.ui_liveryEditor_editMode.requestReapply()
      else await lua.extensions.ui_liveryEditor_editMode.cancelReapply()
    },
  })

  // Need to check if array because empty lua table is cast as an empty object
  const appliedLayers = computed(() => (!_appliedLayers.value || !Array.isArray(_appliedLayers.value) ? null : _appliedLayers.value))

  events.on("liveryEditor_EditMode_OnActiveStatusChanged", async data => {
    console.log("liveryEditor_EditMode_OnActiveStatusChanged", data)
    active.value = data
  })

  events.on("LiveryEditor_CursorUpdated", async data => {
    console.log("LiveryEditor_CursorUpdated", data)
    cursorData.value = data
  })

  events.on("LiveryEditor_SelectedLayersDataUpdated", async data => {
    console.log("LiveryEditor_SelectedLayersDataUpdated", data)
    // Only first layers properties can be displayed
    // lua backend will decide whether to update all if there are multiple selected layers.
    // For example, changing material for multiple layers
    if (data && Array.isArray(data) && data.length > 0) {
      targetLayer.value = data[0]
    }
  })

  events.on("liveryEditor_OnSettingsChanged_UseMousePos", data => {
    console.log("liveryEditor_OnSettingsChanged_UseMousePos", data)
    if (cursorData.value) cursorData.value.isUseMousePos = data
  })

  events.on("liveryEditor_OnEditMode_ReapplyChanged", data => {
    console.log("liveryEditor_OnEditMode_ReapplyChanged", data)
    _reapplyActive.value = data
  })

  events.on("LiveryEditorToolChanged", data => {
    console.log("LiverEditorToolChanged", data)
    currentTool.value = data
  })

  events.on("LiveryEditor_ToolDataUpdated", async data => {
    console.log("LiveryEditor_ToolDataUpdated", data)
    toolsData.value = data
  })

  events.on("liveryEditor_EditMode_OnRequestApplyChanged", async data => {
    console.log("liveryEditor_EditMode_OnRequestApplyChanged", data)
    requestApplyActive.value = data
  })

  events.on("liveryEditor_EditMode_OnAppliedLayersUpdated", async data => {
    console.log("liveryEditor_EditMode_OnAppliedLayersUpdated", data)
    _appliedLayers.value = data
  })

  events.on("liveryEditor_EditMode_OnActiveLayerChanged", async data => {
    console.log("liveryEditor_EditMode_OnActiveLayerChanged", data)
    activeLayerUid.value = data
  })

  events.on("liveryEditor_onDecalTextureChanged", async data => {
    console.log("liveryEditor_onDecalTextureChanged", data)
    console.log("liveryEditor_onDecalTextureChanged active value", active.value)

    if (!active.value) {
      await EDIT_MODE.activate()
    } else if (!isChangeDecal.value && !requestApplyActive.value) {
      await requestApply()
    }

    await MATERIAL_TOOL.setDecal(data)
    rootStore.toggleShowDecalSelector()
    isChangeDecal.value = null
  })

  events.on("liveryEditor_onDecalSelectorCancelled", async data => {
    console.log("liveryEditor_onDecalSelectorCancelled", data)
    if (!active.value) {
      // exit edit mode and go back to default layout
      rootStore.toggleEditModeLayout()
    } else {
      rootStore.toggleShowDecalSelector()
    }

    isChangeDecal.value = null
  })

  function init() {
    if (!active.value) rootStore.toggleShowDecalSelector()
    else EDIT_MODE.resetCursorProperties([])
  }

  const deactivate = async () => {
    await lua.extensions.ui_liveryEditor_editMode.deactivate()
    // TODO: change to put the context in lua
    rootStore.currentContext = EDITOR_CONTEXT.default
    rootStore.editorView = EDITOR_VIEWS.default
  }

  const toggleRequestApply = async () => await lua.extensions.ui_liveryEditor_editMode.toggleRequestApply()
  const requestApply = async () => await lua.extensions.ui_liveryEditor_editMode.requestApply()
  const cancelRequestApply = async () => await lua.extensions.ui_liveryEditor_editMode.cancelRequestApply()

  const getInitialData = async () => await lua.extensions.ui_liveryEditor_layers_cursor.requestData()

  const toggleStamp = async () => {
    if (toolsData.value && toolsData.value.mode === "stamp") {
      await lua.extensions.ui_liveryEditor_tools_transform.cancelStamp()
    } else {
      await lua.extensions.ui_liveryEditor_tools_transform.useStamp()
    }
  }

  const setActiveLayer = async layerUid => {
    await lua.extensions.ui_liveryEditor_editMode.setActiveLayer(layerUid)
  }

  const requestReapply = async () => {
    await lua.extensions.ui_liveryEditor_editMode.requestReapply()
  }

  const cancelReapply = async () => {
    await lua.extensions.ui_liveryEditor_editMode.cancelReapply()
  }

  const cancelChanges = async () => {
    await lua.extensions.ui_liveryEditor_editMode.cancelChanges()
    await lua.extensions.ui_liveryEditor_editMode.deactivate()
    await lua.extensions.ui_liveryEditor_tools.closeCurrentTool()
  }

  const requestChangeDecal = async () => {
    isChangeDecal.value = true
    rootStore.toggleShowDecalSelector()
  }

  const toggleReapply = () => (reapplyActive.value = !reapplyActive.value)

  const apply = async () => await lua.extensions.ui_liveryEditor_editMode.apply()

  const saveChanges = async params => {
    await lua.extensions.ui_liveryEditor_editMode.saveChanges(params)
    await lua.extensions.ui_liveryEditor_editMode.deactivate()

    // TODO: change to put the context in lua
    rootStore.currentContext = EDITOR_CONTEXT.default
    rootStore.editorView = EDITOR_VIEWS.default
  }

  const closeCurrentTool = async () => {
    await lua.extensions.ui_liveryEditor_tools.closeCurrentTool()
  }

  return {
    ...EDIT_MODE,
    ...TRANSFORM_TOOL,
    ...MATERIAL_TOOL,
    ...SETTINGS_TOOL,
    ...DECAL_LAYER,
    active,
    cursorData,
    appliedLayers,
    activeLayerUid,
    requestApplyActive,
    reapplyActive,
    decalTexture,
    editModeState,
    activeSettings,
    init,
    deactivate,
    getInitialData,

    toolsData,
    targetLayer,
    isStampMode,
    toggleStamp,
    requestReapply,
    cancelReapply,
    cancelChanges,
    requestApply,
    cancelRequestApply,
    toggleRequestApply,
    toggleReapply,
    setActiveLayer,
    saveChanges,
    requestChangeDecal,
    apply,
    closeCurrentTool,
  }
})
