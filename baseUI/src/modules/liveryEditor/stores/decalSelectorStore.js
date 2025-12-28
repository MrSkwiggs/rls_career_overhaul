import { computed, ref } from "vue"
import { defineStore } from "pinia"
import { lua, useBridge } from "@/bridge"

const EDITOR_RESOURCES_LUA = lua.extensions.ui_liveryEditor_resources

export const useDecalSelectorStore = defineStore("liveryEditorDecalSelector", () => {
  const { events } = useBridge()

  const categories = ref(null)
  const currentCategory = ref(null)
  const isShow = ref(false)

  const textures = computed(() => {
    if (!categories.value) return undefined

    const category = categories.value.find(x => x.value === currentCategory.value)
    return category ? category.items : undefined
  })

  async function init() {
    categories.value = await EDITOR_RESOURCES_LUA.getTextureCategories()
    if (categories.value && Array.isArray(categories.value) && categories.value.length > 0) {
      const first = categories.value[0].value
      await setCategory(first)
    }
  }

  async function setCategory(category) {
    await fetchTextures(category)
    currentCategory.value = category
  }

  async function fetchTextures(category) {
    const index = categories.value.findIndex(x => x.value === category)
    if (index === -1) {
      return
    }
    const textures = categories.value[index].items
    if (index >= 0 && (!textures || !textures.length === 0)) {
      const categoryWithTextures = await EDITOR_RESOURCES_LUA.getTexturesByCategory(category)
      categories.value[index].items = categoryWithTextures.items
    }
  }

  async function toggle() {
    isShow.value = !isShow.value
    events.emit("liveryEditor_onDecalStateChanged", {
      show: isShow.value,
    })
  }

  async function selectDecalItem(texturePath) {
    // events.emit("liveryEditor_onDecalTextureChanged", texture)
    // const data = lua.extensions.ui_liveryEditor_layers_decals.addLayer({ texturePath })
    // lua.extensions.ui_liveryEditor_layers_decals.setLayer(data.uid)
    await lua.extensions.ui_liveryEditor_layerEdit.setup()
    await lua.extensions.ui_liveryEditor_layerEdit.editNewDecal({ texturePath })
  }

  async function cancelSelection() {
    events.emit("liveryEditor_onDecalSelectorCancelled")
  }

  return {
    categories,
    currentCategory,
    textures,
    isShow,
    init,
    toggle,
    setCategory,
    selectDecalItem,
    cancelSelection,
  }
})
