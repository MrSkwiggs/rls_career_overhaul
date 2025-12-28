import { openFormDialog } from "@/services/popup"
import FileEditForm from "@/modules/liveryEditor/components/fileManager/FileEditForm.vue"
import RenameLayerForm from "@/modules/liveryEditor/components/RenameLayerForm.vue"
import ExitEditorDialog from "@/modules/liveryEditor/components/ExitEditorDialog.vue"

export const openEditFileDialog = (title, description, formModel, formValidator) => {
  return openFormDialog(FileEditForm, formModel, formValidator, title, description)
}

export const openRenameLayerDialog = (title, description, formModel, formValidator) => {
  return openFormDialog(RenameLayerForm, formModel, formValidator, title, description)
}

// export const openExitEditorDialog = (title, description, formModel, formValidator) => {
//   return openFormDialog(ExitEditorDialog, formModel, formValidator, title, description)
// }
