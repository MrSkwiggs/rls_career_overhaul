<template>
  <div
    v-bng-blur
    bng-ui-scope="liveryeditor-decal-selector"
    v-bng-on-ui-nav:menu="() => store.cancelSelection()"
    v-bng-on-ui-nav:back="() => store.cancelSelection()"
    v-bng-on-ui-nav:tab_l="() => switchCategory(-1)"
    v-bng-on-ui-nav:tab_r="() => switchCategory(1)"
    class="decal-selector">
    <div class="header-wrapper">
      <BngCardHeading class="decal-selector-heading" type="ribbon">Select Decal</BngCardHeading>
      <BngButton :bng-no-nav="true" accent="attention" label="Close" @click="store.cancelSelection">
        <BngBinding action="menu_item_back" />
      </BngButton>
    </div>
    <div v-if="store.categories" class="filters-wrapper">
      <div>
        <BngIcon :type="icons.arrowSmallLeft" />
        <BngBinding action="menu_tab_left" />
      </div>
      <BngPillFilters v-model="selectedCategory" :bng-no-child-nav="true" :options="store.categories" required />
      <div>
        <BngBinding action="menu_tab_right" />
        <BngIcon :type="icons.arrowSmallRight" />
      </div>
    </div>
    <BngList v-if="store.textures && store.textures.length > 0" noBackground>
      <DecalSelectorItem
        v-for="(item, index) in store.textures"
        bng-nav-item
        :key="item.preview"
        :externalImage="item.preview"
        :data-decal-item="index"
        v-bng-on-ui-nav:ok.asMouse.focusRequired
        @click="() => store.selectDecalItem(item.preview)" />
    </BngList>
  </div>
</template>

<script setup>
import { onBeforeMount, computed, onMounted, onUnmounted, ref, onBeforeUnmount } from "vue"
import { BngList, BngIcon, BngBinding, icons, BngCardHeading, BngButton } from "@/common/components/base"
import { vBngOnUiNav, vBngBlur } from "@/common/directives"
import BngPillFilters from "@/common/components/base/bngPillFilters.vue"
import DecalSelectorItem from "./DecalSelectorItem.vue"
import { useDecalSelectorStore, useEditorHeaderStore } from "@/modules/liveryEditor/stores"
// import { UINavEvents } from "@/bridge/libs"
import { getUINavServiceInstance, useUINavScope } from "@/services/uiNav"

useUINavScope("liveryeditor-decal-selector")

const store = useDecalSelectorStore()
const headerStore = useEditorHeaderStore()

const selectedCategory = computed({
  get: () => [store.currentCategory],
  async set(values) {
    await store.setCategory(values[0])
  },
})

const switchCategory = direction => {
  let index = store.categories.findIndex(x => x.value === store.currentCategory)

  if (index === -1) return

  if (direction === -1) {
    if (index > 0) {
      index = index - 1
    } else {
      index = store.categories.length - 1
    }
  } else {
    if (index < store.categories.length - 1) {
      index = index + 1
    } else {
      index = 0
    }
  }

  // store.currentCategoryValue = store.categories[index].value
  store.setCategory(store.categories[index].value)
}

onBeforeMount(async () => {
  await store.init()
  // selectedCategory.value = store.currentCategoryValue
  // categories.value = await lua.extensions.ui_liveryEditor_resources.getTextureCategories()
  // if (categories.value && categories.value.length > 0) selectedCategory.value = categories.value[0].value
  // UINavEvents.useCrossfire = true
  getUINavServiceInstance().useCrossfire = true
})

// HEADER
let headerItemsHiddenValue = null

onMounted(() => {
  headerItemsHiddenValue = headerStore.itemsHidden
  if (!headerStore.itemsHidden) headerStore.itemsHidden = true
})

onUnmounted(() => {
  headerStore.itemsHidden = headerItemsHiddenValue
})
</script>

<style lang="scss" scoped>
.decal-selector {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 0.5rem;
  border-radius: var(--bng-corners-1);
  background: rgba(0, 0, 0, 0.7);
  overflow-y: hidden;

  .header-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .decal-selector-heading {
      color: white;
      font-size: 2em;
    }
  }

  .filters-wrapper {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;
    padding-bottom: 0.5rem;
  }
}
</style>
