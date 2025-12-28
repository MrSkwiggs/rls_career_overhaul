import { computed, reactive, ref } from "vue"
import { defineStore } from "pinia"

export const HEADER_SECTION_TYPE = {
  start: "start",
  center: "center",
  end: "end",
}

export const useEditorHeaderStore = defineStore("editorHeader", () => {
  const header = reactive({
    heading: null,
    preheading: [],
    type: "line",
  })
  const headerItems = ref([])

  const startSectionItems = computed(() => headerItems.value.filter(x => x.section === HEADER_SECTION_TYPE.start))
  const centerSectionItems = computed(() => headerItems.value.filter(x => x.section === HEADER_SECTION_TYPE.center))
  const endSectionItems = computed(() => headerItems.value.filter(x => x.section === HEADER_SECTION_TYPE.end))

  const headerHidden = ref(false)
  const itemsHidden = ref(false)

  const setHeader = (heading, headerType = "line") => {
    header.heading = heading
    header.type = headerType
  }

  const setPreheader = text => {
    if (typeof text === "string") header.preheading = [text]
    else header.preheading = text
  }

  const addItems = (items, prepend = false) => {
    if (prepend) headerItems.value.unshift(...items)
    else headerItems.value.push(...items)
  }

  const addItem = (item, prepend = false) => {
    if (prepend) headerItems.value.unshift(item)
    else headerItems.value.push(item)
  }

  const addOrUpdateItem = (item, prepend = false, prependIdOrIndex = 0) => {
    let existingIndex = -1
    if (headerItems.value) existingIndex = headerItems.value.findIndex(x => x.id === item.id)

    if (existingIndex > -1) {
      headerItems.value[existingIndex] = { ...item }
    } else if (prepend) {
      let preprendIdIndex = findIdOrIndex(prependIdOrIndex)
      headerItems.value.splice(preprendIdIndex, 0, item)
    } else {
      headerItems.value.push(item)
    }
  }

  const removeItem = itemOrId => {
    const id = itemOrId.hasOwnProperty("id") ? itemOrId.id : itemOrId
    const index = headerItems.value.findIndex(x => x.id === id)
    if (index > -1) headerItems.value.splice(index, 1)
  }

  const removeItems = itemsOrIds => itemsOrIds.forEach(x => removeItem(x))

  const removeItemsExcept = itemsOrIds => {
    const ids = itemsOrIds.map(x => (x.hasOwnProperty("id") ? x.id : x))
    const filtered = items.value.filter(x => !ids.includes(x.id))
    removeItems(filtered)
  }

  const showItem = itemOrId => {
    const index = findIdOrIndex(itemOrId)
    if (index > -1) headerItems.value[index].hidden = false
  }

  const hideItem = itemOrId => {
    const index = findIdOrIndex(itemOrId)
    if (index > -1) headerItems.value[index].hidden = true
  }

  const clearItems = () => (headerItems.value = [])

  const getItem = id => items.value.find(x => x.id === id)

  function findIdOrIndex(idOrIndex) {
    let prependIdIndex = headerItems.value.findIndex(x => x.id === idOrIndex)
    if (prependIdIndex === -1 && typeof idOrIndex === "number" && idOrIndex > -1 && idOrIndex < headerItems.value.length) prependIdIndex = idOrIndex
    return prependIdIndex
  }

  return {
    header,
    startSectionItems,
    centerSectionItems,
    endSectionItems,
    headerHidden,
    itemsHidden,
    setHeader,
    setPreheader,
    addItem,
    addItems,
    addOrUpdateItem,
    removeItem,
    removeItems,
    removeItemsExcept,
    showItem,
    hideItem,
    clearItems,
    getItem,
  }
})
