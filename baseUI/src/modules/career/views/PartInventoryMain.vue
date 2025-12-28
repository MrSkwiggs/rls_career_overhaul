<template>
  <ComputerWrapper ref="wrapper" :path="['Part Inventory']" title="Part Inventory" back @back="close">
    <PartList class="part-inventory" @partSold="updateCareerStatus" />
  </ComputerWrapper>
</template>

<script setup>
import { onBeforeMount, onUnmounted, ref, watch, markRaw } from "vue"
import ComputerWrapper from "./ComputerWrapper.vue"
import { usePartInventoryStore } from "../stores/partInventoryStore"
import PartList from "../components/partInventory/PartList.vue"
import PartInventoryAddedParts from "../components/partInventory/PartInventoryAddedParts.vue"
import { openMessage } from "@/services/popup"
import { useComputerStore } from "../stores/computerStore"

const computerStore = useComputerStore()

const wrapper = ref()

const partInventoryStore = usePartInventoryStore()

// display repair popup when required
watch(
  () => partInventoryStore.newPartsPopupOpen,
  (newVal, oldVal) => newVal && confirmAddedParts()
)

const confirmAddedParts = async vehicle => {
  await openMessage("", { component: markRaw(PartInventoryAddedParts), props: { parts: partInventoryStore.newParts } })
  closeNewPartsPopup()
}

const updateCareerStatus = () => {
  wrapper.value.statusUpdate()
}

const start = () => {
  partInventoryStore.requestInitialData()
}

const kill = () => {
  partInventoryStore.partInventoryClosed()
  partInventoryStore.$dispose()
}

onBeforeMount(start)
onUnmounted(kill)

const close = () => {
  partInventoryStore.closeMenu()
}

const closeNewPartsPopup = () => {
  partInventoryStore.closeNewPartsPopup()
}
</script>

<style scoped lang="scss">
.partListCard {
  width: 50%;
  overflow-y: hidden;
  height: 100vh;
  padding: 10px;
  color: white;
  background-color: rgba(0, 0, 0, 0.9);
  & :deep(.card-cnt) {
    background-color: rgba(0, 0, 0, 0.2);
  }
}

.innerList {
  height: 95vh;
  overflow-y: scroll;
  padding: 20px;
}

.part-inventory {
  width: 60%;
  min-width: 40rem;
  height: 50%;
  min-height: 50%;
  height: max-content;
  :deep(.list-content) {
    min-height: 40vh;
  }
}
</style>
