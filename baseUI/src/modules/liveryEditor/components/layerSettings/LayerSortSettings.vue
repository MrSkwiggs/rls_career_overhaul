<template>
  <div
    class="sort-settings"
    bng-ui-scope="sort-settings"
    v-bng-on-ui-nav:focus_l="() => ORDER_TOOL.changeOrderToBottom()"
    v-bng-on-ui-nav:focus_r="() => ORDER_TOOL.changeOrderToTop()"
    v-bng-on-ui-nav:focus_u="() => ORDER_TOOL.moveOrderUp()"
    v-bng-on-ui-nav:focus_d="() => ORDER_TOOL.moveOrderDown()">
    <div class="setting-item">
      <BngButton @click="() => ORDER_TOOL.moveOrderUp()" :disabled="order === orderMax">
        <div class="icon-binding-wrapper">
          <BngIcon :type="icons.arrowLargeUp" />
          <BngBinding action="menu_item_up" />
        </div>
      </BngButton>
      <BngButton @click="() => ORDER_TOOL.moveOrderDown()" :disabled="order === 2">
        <div class="icon-binding-wrapper">
          <BngIcon :type="icons.arrowLargeDown" />
          <BngBinding action="menu_item_down" />
        </div>
      </BngButton>
      <BngButton v-if="!multiSelected" @click="() => ORDER_TOOL.changeOrderToTop()" :disabled="order === orderMax">
        <div class="icon-binding-wrapper">
          <div class="stacked-arrows">
            <BngIcon :type="icons.arrowLargeUp" />
            <BngIcon :type="icons.arrowLargeUp" />
          </div>
          <BngBinding action="menu_item_right" />
        </div>
      </BngButton>
      <BngButton v-if="!multiSelected" @click="() => ORDER_TOOL.changeOrderToBottom()" :disabled="order === 2">
        <div class="icon-binding-wrapper">
          <div class="stacked-arrows">
            <BngIcon :type="icons.arrowLargeDown" :disabled="store.selectedLayers.length > 1" />
            <BngIcon :type="icons.arrowLargeDown" :disabled="store.selectedLayers.length > 1" />
          </div>
          <BngBinding action="menu_item_left" />
        </div>
      </BngButton>
    </div>
    <div v-if="!multiSelected">
      <BngDropdown v-model="order" :items="orderOptions" />
    </div>
  </div>
</template>

<script>
const ORDER_TOOL = lua.extensions.ui_liveryEditor_tools_group
</script>

<script setup>
import { computed, onMounted } from "vue"
import { BngBinding, BngButton, BngDropdown, BngIcon, icons } from "@/common/components/base"
import { vBngOnUiNav } from "@/common/directives"
import { useLiveryEditorStore } from "@/modules/liveryEditor/stores"
import { lua } from "@/bridge"
// import { UINavEvents } from "@/bridge/libs"
import { getUINavServiceInstance } from "@/services/uiNav"
import { useUINavScope } from "@/services/uiNav"

const store = useLiveryEditorStore()

useUINavScope("sort-settings")

const order = computed({
  get: () => {
    const layer = store.selectedLayers[0]
    return layer.order
  },
  set(newValue) {
    ORDER_TOOL.setOrder(newValue)
  },
})

const orderMax = computed(() => {
  const layer = store.selectedLayers[0]
  return layer.siblingCount
})

const multiSelected = computed(() => store.selectedLayerUids.length > 1)

const orderOptions = computed(() => {
  return Array.from({ length: store.layers.length - 1 }, (_, i) => ({ label: `${i + 1}`, value: i + 2 }))
})

onMounted(() => {
  // UINavEvents.useCrossfire = false
  getUINavServiceInstance().useCrossfire = false
})
</script>

<style lang="scss" scoped>
.setting-item {
  :deep() {
    .bng-button {
      min-height: 5em !important;
      min-width: 5em !important;
    }
  }
}

.stacked-arrows {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  :deep() {
    > :first-child {
      margin-bottom: -0.45rem;
    }
    > :last-child {
      margin-top: -0.45rem;
    }
  }
}

.icon-binding-wrapper {
  display: flex;
  flex-direction: column;
}
</style>
