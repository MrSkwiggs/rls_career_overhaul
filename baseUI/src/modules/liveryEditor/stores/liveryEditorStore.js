import { computed, ref, reactive } from "vue"
import { defineStore } from "pinia"
import router from "@/router"
import { lua, useBridge } from "@/bridge"
import { buildActionsDrawer } from "../services/actionsDrawerBuilder"
import { openEditFileDialog } from "@/modules/liveryEditor/utils"
import { openFormDialog } from "@/services/popup"
import { openConfirmation } from "@/services/popup"
import { openRenameLayerDialog } from "@/modules/liveryEditor/utils"
import { ACCENTS, icons } from "@/common/components/base"
import ExitEditorDialog from "../components/ExitEditorDialog.vue"

const SELECTION_LUA = lua.extensions.ui_liveryEditor_selection
const SETTINGS_LUA = lua.extensions.ui_liveryEditor_tools_settings
const CAMERA_LUA = lua.extensions.ui_liveryEditor_camera
const EDITOR_LUA = lua.extensions.ui_liveryEditor_editor

export const EDITOR_CONTEXT = {
  default: "default",
  editMode: "editMode",

  newLayer: "newLayer",
}

const SELECT_MODE = {
  single: "single",
  multi: "multi",
}

export const EDITOR_VIEWS = {
  default: "default",
  decalSelector: "decalSelector",
  editMode: "editMode",
}

export const useLiveryEditorStore = defineStore("liveryEditor", () => {
  const { events } = useBridge()

  const layers = ref(null)
  const visibleLayersCount = ref(null)
  const selectedTool = ref(null)
  const currentFile = ref(null)
  const currentContext = ref(null)
  const history = ref(null)

  const selectMode = ref(SELECT_MODE.single)
  const selectedLayers = ref([])
  const layerActions = ref(null)

  const categories = ref(null)
  const textures = ref(null)
  const editorView = ref(EDITOR_VIEWS.main)

  const cameraView = ref(null)

  const showLayersManager = computed(() => !(selectedTool.value && currentContext.value === EDITOR_CONTEXT.editMode))
  const showLayerActions = computed(() => selectedLayers.value)
  const selectedLayerUids = computed(() => (selectedLayers.value ? selectedLayers.value.map(x => x.uid) : undefined))

  events.on("liveryEditor_OnLayersUpdated", data => {
    console.log("liveryEditor_OnLayersUpdated", data)
    layers.value = data
  })

  events.on("liveryEditor_Layers_OnVisibleCountChanged", data => {
    console.log("liveryEditor_Layers_OnVisibleCountChanged", data)
    visibleLayersCount.value = data
  })

  events.on("LiveryEditor_onSaveFileLoaded", data => {
    console.log("LiveryEditor_onSaveFileLoaded", data)
    currentFile.value = data
  })

  events.on("LiveryEditorLayersUpdate", data => {
    console.log("LiveryEditorLayersUpdated", data)
    layers.value = data
  })

  events.on("LiveryEditor_SelectedLayersDataUpdated", async data => {
    console.log("LiveryEditor_SelectedLayersDataUpdated", data)
    selectedLayers.value = data && Array.isArray(data) ? data : undefined
  })

  events.on("LiverEditorLayerActionsUpdated", async data => {
    console.log("LiverEditorLayerActionsUpdated", data)

    // if (!data || data.length === 0) {
    //   layerActions.value = null
    // } else {
    //   layerActions.value = await buildActionsDrawer(data)
    //   setLayerActionsProperties()
    // }
  })

  events.on("LiveryEditor_onHistoryUpdated", data => {
    console.log("LiveryEditor_onHistoryUpdated", data)
    history.value = data
  })

  events.on("LiveryEditor_SelectedLayersChanged", data => {
    console.log("selected Layer Updated", data)
    currentContext.value = data && data.length > 0 ? EDITOR_CONTEXT.selectedLayer : null
  })

  events.on("LiveryEditorToolChanged", data => {
    console.log("LiverEditorToolChanged", data)
    selectedTool.value = data
  })

  events.on("LiveryEditor_OnCameraChanged", data => {
    console.log("LiverEditorToolChanged", data)
    cameraView.value = data
  })

  const dismissLayerActions = async () => {
    await lua.extensions.ui_liveryEditor_selection.clearSelection()
  }

  const toggleEditModeLayout = async enable => {
    enable = typeof enable === "boolean" ? enable : currentContext.value === EDITOR_CONTEXT.default

    if (enable) {
      currentContext.value = EDITOR_CONTEXT.editMode
      editorView.value = EDITOR_VIEWS.editMode
    } else {
      currentContext.value = EDITOR_CONTEXT.default
      editorView.value = EDITOR_VIEWS.default
    }
  }

  function toggleShowDecalSelector() {
    if (editorView.value === EDITOR_VIEWS.decalSelector) {
      editorView.value = EDITOR_VIEWS.editMode
    } else {
      editorView.value = EDITOR_VIEWS.decalSelector
    }
  }

  const requestDismissLayerActions = () => {
    if (currentContext.value === EDITOR_CONTEXT.newLayer) {
      currentContext.value = null
    } else if (currentContext.value === EDITOR_CONTEXT.selectedLayer) {
      selectedLayers.value = []
    }
  }

  const selectSingle = async layerUid => {
    await lua.extensions.ui_liveryEditor_selection.setSelected(layerUid)
  }

  const toggleVisibility = async layer => await lua.extensions.ui_liveryEditor_tools_settings.toggleVisibilityById(layer.id)

  const toggleLock = async layer => await lua.extensions.ui_liveryEditor_tools_settings.toggleLockById(layer.id)

  const changeOrder = async (layer, direction) => {
    if (direction === -1) await lua.extensions.ui_liveryEditor_tools_group.moveOrderUpById(layer.uid)
    else if (direction === 1) await lua.extensions.ui_liveryEditor_tools_group.moveOrderDownById(layer.uid)
  }

  const startEditor = async () => {
    await lua.extensions.ui_liveryEditor_editor.startEditor()
    await lua.extensions.ui_liveryEditor_editor.startSession()
    currentContext.value = EDITOR_CONTEXT.default
    editorView.value = EDITOR_VIEWS.default
    await CAMERA_LUA.setOrthographicView("right")

    categories.value = await lua.extensions.ui_liveryEditor_resources.getTextureCategories()
    if (categories.value && categories.value.length > 0) {
      const firstCategory = categories.value[0]
      setTexturesByCategory(firstCategory.value)
    }
  }

  async function setTexturesByCategory(category) {
    const textureCategory = await lua.extensions.ui_liveryEditor_resources.getTexturesByCategory(category)
    textures.value = textureCategory.items
  }

  const createSaveFile = async filename => {
    await lua.extensions.ui_liveryEditor_userData.createSaveFile(filename)
  }

  const useTool = async (toolName, params) => {
    await lua.extensions.ui_liveryEditor_tools.useTool(toolName)
  }

  function setLayerActionsProperties() {
    // set visibility
    const showHideIndex = layerActions.value.findIndex(x => x.value === "visibility")
    if (showHideIndex > -1) {
      const aggregateShowHide =
        selectedLayers.value && selectedLayers.value.length > 1 ? selectedLayers.value.find(x => x.enabled) !== undefined : selectedLayers.value[0].enabled
      console.log("aggregateShowHide", aggregateShowHide)
      layerActions.value[showHideIndex].active = aggregateShowHide
    }

    // set highlight
    const highlightIndex = layerActions.value.findIndex(x => x.value === "highlight")
    if (highlightIndex > -1) {
      const highlighted = selectedLayers.value[0].highlighted
      layerActions.value[highlightIndex].active = highlighted
    }
  }

  async function onActionItemSelected(action) {
    if (!action.items) {
      const firstSelected = selectedLayers.value && selectedLayers.value.length > 0 ? selectedLayers.value[0] : null
      if (action.value === "delete") {
        const res = await openConfirmation(`Delete Layer`, `Are you sure you want to delete ${firstSelected.name}?`)
        if (res) await lua.extensions.ui_liveryEditor_tools_settings.deleteLayer()
      } else if (action.value === "rename") {
        const res = await openRenameLayerDialog("Rename Layer", "", { name: firstSelected.name }, model => {
          return model.name !== null && model.name !== undefined && model.name !== "" && model.name !== firstSelected.name
        })

        if (res.value) await lua.extensions.ui_liveryEditor_tools_settings.rename(res.formData.name)
      } else if (action.value === "duplicate") {
        await SELECTION_LUA.duplicateSelectedLayer()
      } else if (action.value === "visibility") {
        await SETTINGS_LUA.toggleVisibility()
      } else if (action.value === "highlight") {
        await SELECTION_LUA.toggleHighlightSelectedLayer()
      } else {
        await lua.extensions.ui_liveryEditor_tools.useTool(action.value)
      }
    }
  }

  const editorState = reactive({
    isOpenExitDialog: false,
    exitDialogResult: null,
    saving: false,
  })

  async function openExitDialog() {
    const exitEditorForm = ref({
      name: currentFile.value ? currentFile.value.name : undefined,
      applySkin: currentFile.value && currentFile.value.name ? true : false,
    })
    const formValidator = form => {
      if (!form || !form.name) return { error: true, message: "Invalid Save Name" }
      return { error: false }
    }

    const buttons = [
      { label: "Cancel", value: -1, extras: { cancel: true, accent: ACCENTS.secondary } },
      { label: "Save and Exit", value: 1, emitData: true, disableIfInvalid: true, extras: { icon: icons.saveAs1 } },
      { label: "Exit", value: 0, emitData: true, extras: { accent: ACCENTS.attention, icon: icons.exit } },
    ]
    const res = await openFormDialog(ExitEditorDialog, exitEditorForm, formValidator, "Exit Editor", null, buttons)

    if (res.value === -1) return false

    if (res.value === 1) await EDITOR_LUA.save(res.formData.name)
    if (res.formData.applySkin) await EDITOR_LUA.applySkin()

    await exit()
    return true
  }

  async function save(forceOpenPopup = false) {
    if (!currentFile.value || !currentFile.value.name || forceOpenPopup) {
      editorState.isOpenExitDialog = true

      const model = { name: currentFile.value ? currentFile.value.name : createFilename() }
      const res = await openEditFileDialog("Save file", "Enter name of your new save file", model, model => {
        return model.name !== null && model.name !== undefined && model.name !== ""
      })

      if (res.value) {
        editorState.saving = true
        // await rootStore.save(res.value.name)
        await lua.extensions.ui_liveryEditor_editor.save(res.formData.name)
        editorState.saving = false
      }

      editorState.isOpenExitDialog = false

      return res.value
    } else {
      // editorState.saving = true
      await lua.extensions.ui_liveryEditor_editor.save(currentFile.value.name)
      // editorState.saving = false
    }
  }

  async function exit() {
    router.replace({ name: "garagemode" })
    await lua.extensions.ui_liveryEditor_editor.exitEditor()
  }

  function createFilename() {
    const currentDate = new Date()

    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, "0") // Months are zero-based
    const day = String(currentDate.getDate()).padStart(2, "0")
    const hours = String(currentDate.getHours()).padStart(2, "0")
    const minutes = String(currentDate.getMinutes()).padStart(2, "0")
    const seconds = String(currentDate.getSeconds()).padStart(2, "0")

    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`
  }

  function dispose() {}

  return {
    ...SELECTION_LUA,
    ...CAMERA_LUA,
    ...SETTINGS_LUA,
    layers,
    visibleLayersCount,
    layerActions,
    selectedTool,
    currentFile,
    currentContext,
    textures,
    categories,
    editorView,
    showLayersManager,
    showLayerActions,
    cameraView,
    editorState,
    dismissLayerActions,
    setTexturesByCategory,
    toggleEditModeLayout,
    toggleShowDecalSelector,
    requestDismissLayerActions,
    onActionItemSelected,
    selectMode,
    selectedLayers,
    selectedLayerUids,
    createSaveFile,
    toggleVisibility,
    toggleLock,
    startEditor,
    save,
    useTool,
    selectSingle,
    changeOrder,
    openExitDialog,
  }
})
