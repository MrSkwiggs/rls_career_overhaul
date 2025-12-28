<template>
  <LayerInspectorBase v-bng-blur :heading="'Order'">
    <div class="direction-buttons-row">
      <BngTile bng-nav-item label="Move Up" v-bng-on-ui-nav:ok.focusRequired="moveUp" @click="moveUp">
        <div class="icon-binding-wrapper">
          <BngIcon :type="icons.arrowLargeUp" />
        </div>
      </BngTile>
      <BngTile bng-nav-item label="Move Down" v-bng-on-ui-nav:ok.focusRequired="moveDown" @click="moveDown">
        <div class="icon-binding-wrapper">
          <BngIcon :type="icons.arrowLargeDown" />
        </div>
      </BngTile>
    </div>
    <div class="direction-buttons-row">
      <BngTile bng-nav-item label="Move to Top" v-bng-on-ui-nav:ok.focusRequired="moveToTop" @click="moveToTop">
        <div class="icon-binding-wrapper">
          <div class="stacked-arrows">
            <BngIcon :type="icons.arrowLargeUp" />
            <BngIcon :type="icons.arrowLargeUp" />
          </div>
        </div>
      </BngTile>
      <BngTile bng-nav-item label="Move to Bottom" v-bng-on-ui-nav:ok.focusRequired="moveToBottom" @click="moveToBottom">
        <div class="icon-binding-wrapper">
          <div class="stacked-arrows">
            <BngIcon :type="icons.arrowLargeDown" :disabled="store.selectedLayers.length > 1" />
            <BngIcon :type="icons.arrowLargeDown" :disabled="store.selectedLayers.length > 1" />
          </div>
        </div>
      </BngTile>
    </div>
    <div class="dropdown-container">
      <BngDropdown v-model="order" :items="orderOptions" />
    </div>
  </LayerInspectorBase>
</template>

<script></script>

<script setup>
import { computed, onMounted, ref } from "vue"
import { vBngOnUiNav, vBngBlur, vBngDisabled } from "@/common/directives"
import { BngDropdown, BngIcon, BngTile, icons } from "@/common/components/base"
import { lua, useBridge } from "@/bridge"
import LayerInspectorBase from "../components/layerSettings/LayerInspectorBase.vue"
import { useLiveryEditorStore } from "@/modules/liveryEditor/stores"

const ORDER_TOOL = lua.extensions.ui_liveryEditor_tools_group

const store = useLiveryEditorStore()

const _order = ref(2)
const order = computed({
  get: () => {
    // const layer = store.selectedLayers[0]
    // return layer.order
    return _order.value
  },
  set(newValue) {
    _order.value = newValue
    ORDER_TOOL.setOrder(newValue)
  },
})

const orderMax = computed(() => {
  const layer = store.selectedLayers[0]
  return layer.siblingCount
})

const orderOptions = computed(() => {
  return Array.from({ length: store.layers.length - 1 }, (_, i) => ({ label: `${i + 1}`, value: i + 2 }))
})

onMounted(() => {
  if (store.selectedLayers && store.selectedLayers.length > 0) {
    _order.value = store.selectedLayers[0].order
  }
})

const moveUp = () => {
  const res = ORDER_TOOL.moveOrderUp()
  res.then(value => (_order.value = value))
}
const moveDown = () => {
  const res = ORDER_TOOL.moveOrderDown()
  res.then(value => (_order.value = value))
}
const moveToTop = () => {
  const res = ORDER_TOOL.changeOrderToTop()
  res.then(value => (_order.value = value))
}
const moveToBottom = () => {
  const res = ORDER_TOOL.changeOrderToBottom()
  res.then(value => (_order.value = value))
}
</script>

<style lang="scss" scoped>
$infobarHeight: 4rem;

.direction-buttons-row {
  display: flex;
  align-items: center;
}

.dropdown-container {
  display: flex;
  align-items: center;
  width: 100%;

  > :first-child {
    width: 100%;
  }
}
</style>
