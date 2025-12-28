import { defineStore, storeToRefs } from "pinia"
import { ref, watch } from "vue"
import { lua, useBridge } from "@/bridge"
import useControls from "@/services/controls"
import router from "@/router"

export const useLiveryMainStore = defineStore("liveryMain", () => {
  const Controls = useControls()
  const { events } = useBridge()
  const isSetupDone = ref(false)
  const { isControllerAvailable } = storeToRefs(Controls)
  const currentSave = ref(initCurrentSave())
  const isLayerEditInitialized = ref(false)

  watch(
    isControllerAvailable,
    async available => {
      if (available) await lua.extensions.ui_liveryEditor.useMousePosition(false)
    },
    { immediate: true }
  )

  async function onSetupDone() {
    if (isControllerAvailable.value) await lua.extensions.ui_liveryEditor.useMousePosition(false)
  }

  function load(file) {
    currentSave.value = file
    isSetupDone.value = false
  }

  function onChangeView(view) {
    console.log("onChangeView", view)
    router.push({ name: view })
  }

  async function setup() {
    if (isSetupDone.value) return
    events.on("liveryEditor_SetupSuccess", onSetupDone)
    events.on("liveryEditor_changeView", onChangeView)
    await lua.extensions.ui_liveryEditor.setup(currentSave.value.location)
    isSetupDone.value = true
  }

  async function save() {
    await lua.extensions.ui_liveryEditor.save(currentSave.value.name)
  }

  async function exit() {
    isSetupDone.value = false
    resetSave()
    await lua.extensions.ui_liveryEditor.deactivate()
  }

  async function setupLayerEdit() {
    if (isLayerEditInitialized.value) return
    await lua.extensions.ui_liveryEditor_camera.setOrthographicView("right")
    isLayerEditInitialized.value = true
  }

  async function exitLayerEdit() {
    isLayerEditInitialized.value = false
  }

  function resetSave() {
    currentSave.value = initCurrentSave()
  }

  function initCurrentSave() {
    return {
      name: createFilename(),
      location: null,
    }
  }

  function dispose() {
    events.off("liveryEditor_SetupSuccess", onSetupDone)
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

  return { currentSave, isSetupDone, load, setupLayerEdit, exitLayerEdit, save, exit, setup, resetSave, dispose }
})
