import { defineStore } from "pinia"
import { lua } from "@/bridge"
import { openConfirmation } from "@/services/popup"
import { openRenameLayerDialog } from "@/modules/liveryEditor/utils"

const SELECTION_LUA = lua.extensions.ui_liveryEditor_selection

export const useLayerActionsStore = defineStore("createLayer", () => {
  async function onActionItemSelected(action) {
    if (!action.items) {
      console.log("[onActionItemSelected] do action")
      if (action.value === "group") {
        await lua.extensions.ui_liveryEditor_tools_group.groupLayers()
      } else if (action.value === "ungroup") {
        await lua.extensions.ui_liveryEditor_tools_group.ungroupLayer()
      } else if (action.value === "delete") {
        const res = await openConfirmation(`Delete Layer`, `Are you sure you want to delete ${singleSelectedLayer.value.name}?`)
        if (res) await lua.extensions.ui_liveryEditor_tools_settings.deleteLayer()
      } else if (action.value === "rename") {
        const res = await openRenameLayerDialog("Rename Layer", "", { name: singleSelectedLayer.value.name }, model => {
          return model.name !== null && model.name !== undefined && model.name !== "" && model.name !== singleSelectedLayer.value.name
        })

        if (res.value) await lua.extensions.ui_liveryEditor_tools_settings.rename(res.formData.name)
      } else if (action.value === "duplicate") {
        // await MISC_LUA.duplicate()
        await SELECTION_LUA.duplicateSelectedLayer()
      } else {
        await lua.extensions.ui_liveryEditor_tools.useTool(action.value)
      }
    }
  }

  return { onActionItemSelected }
})
