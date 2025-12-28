import { ref, watch } from "vue"
import { defineStore } from "pinia"
import { useBridge, lua } from "@/bridge"

export const usePartInventoryStore = defineStore("partInventory", () => {
  const { events } = useBridge()

  // States
  const partInventoryData = ref({})
  const newPartsPopupOpen = ref(false)
  const newParts = ref([])

  const searchString = ref("")

  // Actions
  function requestInitialData() {
    // TODO refactor this to use the return value method
    lua.career_modules_partInventory.sendUIData()
  }

  function closeNewPartsPopup() {
    newPartsPopupOpen.value = false
  }

  function closeMenu() {
    searchString.value = ""
    lua.career_modules_partInventory.closeMenu()
  }

  function partInventoryClosed() {
    lua.career_modules_partInventory.partInventoryClosed()
  }

  function dispose() {
    events.off("partInventoryData")
  }

  function openNewPartsPopup(newPartIds) {
    newPartsPopupOpen.value = true

    newParts.value = []
    for (let i = 0; i < partInventoryData.value.partList.length; i++) {
      let part = partInventoryData.value.partList[i]
      for (let j = 0; j < newPartIds.length; j++) {
        if (part.id == newPartIds[j]) {
          newParts.value.push(part)
          break
        }
      }
    }
  }

  const doesPartPassFilter = (part) => {
    return part.description.description.toLowerCase().includes(searchString.value.toLowerCase()) ||
      part.name.toLowerCase().includes(searchString.value.toLowerCase())
  }

  const searchValueChanged = () => {
    if (partInventoryData.value.partList.filter) {
      partInventoryData.value.filteredPartList = partInventoryData.value.partList.filter(doesPartPassFilter);
    } else {
      partInventoryData.value.filteredPartList = {}
    }
  }

  watch(() => searchString.value, searchValueChanged)

  // Lua events
  events.on("partInventoryData", data => {
    partInventoryData.value = data
    searchValueChanged()
  })

  return {
    closeMenu,
    closeNewPartsPopup,
    dispose,
    newParts,
    newPartsPopupOpen,
    openNewPartsPopup,
    partInventoryClosed,
    partInventoryData,
    requestInitialData,
    searchString
  }
})
