import { ref } from "vue"
import { defineStore } from "pinia"
import { useBridge, lua } from "@/bridge"

export const usePartShoppingStore = defineStore("partShopping", () => {
  const { events } = useBridge()

  // States
  let partShoppingData = ref({})
  let filteredSlots = ref([])
  let path = ref("")
  let filteredParts = ref([])
  let category = ref("")
  let expandedSlots = ref({})
  let searchString = ""
  let slotToScrollTo = ref()

  let backAction = () => {}

  let slotsDict = {}
  let partFilter

  function doesNameContainString(name, searchStrings) {
    for (const searchString of searchStrings) {
      if (name.includes(searchString)) {
        return true
      }
    }
    return false
  }

  // Actions
  function filterParts() {
    filteredParts.value = []
    slotsDict = {}

    if (!partShoppingData.value.partsInShop) return

    for (const [_, part] of Object.entries(partShoppingData.value.partsInShop)) {
      if (!part.slot) continue
      // filter either with the partFilter dict or by the "slot.value"
      if (partFilter) {
        if (doesNameContainString(part.name, partFilter)) {
          filteredParts.value.push(part)
        }
      } else if (part.containingSlot === path.value) {
        filteredParts.value.push(part)
      }

      // build the slots dict
      let niceName = partShoppingData.value.slotsNiceName[part.slot]
      if (niceName !== null && niceName !== undefined) {
        slotsDict[part.slot] = niceName
      } else {
        slotsDict[part.slot] = part.slot
      }
    }
    filteredParts.value.sort((a, b) => {
      // If one has emptyPlaceholder, put it at the beginning
      if (a.emptyPlaceholder) return -1
      if (b.emptyPlaceholder) return 1

      // If one has partId and the other doesn't, put the one with partId at the beginning
      if (a.partId && !b.partId) return -1
      if (!a.partId && b.partId) return 1

      // Otherwise sort by description
      return a.description.description < b.description.description ? -1 : 1
    })
  }

  function getSlotsFromSearchString() {
    let resultSlots = {}
    for (const [_, part] of Object.entries(partShoppingData.value.partsInShop)) {
      if (!slotsDict[part.slot]) continue
      if (part.description.description.toLowerCase().includes(searchString.toLowerCase()) ||
          slotsDict[part.slot].toLowerCase().includes(searchString.toLowerCase())) {
        resultSlots[part.containingSlot] = true
      }
    }
    return resultSlots
  }

  let filteredSlotsDict
  function doesSlotPassFilter(slot) {
    return filteredSlotsDict[slot.path]
  }

  function filterSlots() {

    // TODO fix this for part tree
    if (searchString.length > 0) {
      // TODO filter this based on "category"
      // let slotsList = Object.entries(slotsDict)
      // slotsList.sort(([, aNiceName], [, bNiceName]) => {
      //   return aNiceName < bNiceName ? -1 : 1
      // })

      filteredSlotsDict = getSlotsFromSearchString()
      filteredSlots.value = partShoppingData.value.searchSlotList.filter(doesSlotPassFilter)
    } else {
      filteredSlots.value = []
    }
  }

  function setSlotExpanded(path, expanded) {
    expandedSlots.value[path] = expanded
  }

  function setSlot(_slot) {
    if (_slot == "") {
      slotToScrollTo.value = path.value
    }
    path.value = _slot
    partFilter = undefined
    filterParts()
  }

  function setCategory(_category) {
    category.value = _category
    filterSlots()
    if (category.value == "everything" || category.value == "") {
      setSlot("")
    } else if (category.value == "cargo") {
      // set the slot to anything for now, so the part list is shown
      path.value = "Blablabla"
      partFilter = ["cargo_load"]
      filterParts()
    }
  }

  const requestInitialData = () => {
    lua.career_modules_partShopping.sendShoppingDataToUI()
  }

  const cancelShopping = () => {
    expandedSlots.value = {}
    lua.career_modules_partShopping.cancelShopping()
    setCategory("")
  }

  // convert the children object to an array and sort the children by their nice names
  function fixSlots(slot) {
    if (!("children" in slot)) return

    if (!Array.isArray(slot.children)) {
      // Convert object to array, preserving non-null values
      slot.children = Object.values(slot.children).filter(Boolean)
    }

    // Sort children by their nice names
    slot.children.sort((a, b) => {
      const aName = a.slotNiceName || a.slot
      const bName = b.slotNiceName || b.slot
      return aName < bName ? -1 : 1
    })

    for (const childSlot of slot.children) {
      fixSlots(childSlot)
    }
  }

  const handleShoppingData = data => {
    if (data.partTree) fixSlots(data.partTree)
    partShoppingData.value = data
    filterParts()
    filterSlots()
  }

  const searchValueChanged = _searchString => {
    searchString = _searchString
    filterSlots()
  }

  // Lua events
  const listen = state => {
    const method = state ? "on" : "off"
    events[method]("partShoppingData", handleShoppingData)
  }
  listen(true)

  function dispose() {
    listen(false)
  }

  return {
    partShoppingData,
    slot: path,
    filteredSlots,
    filteredParts,
    category,
    expandedSlots,
    slotToScrollTo,
    searchValueChanged,
    setSlot,
    setCategory,
    requestInitialData,
    cancelShopping,
    dispose,
    setSlotExpanded,
    set backAction(actionFunc) {
      backAction = actionFunc
    },
    get backAction() {
      return backAction
    },
  }
})
