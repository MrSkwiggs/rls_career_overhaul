<template>
  <template v-if="partShoppingStore.slot !== ''">
    <PartsList />
  </template>
  <template v-else>
    <BngInput floating-label="Search" :leading-icon="icons.search" v-model.trim="searchValue" @valueChanged="searchValueChanged" />

    <div class="innerList">
      <!-- show a flat list when the user is searching for something -->
      <Accordion v-if="searchValue.length > 0" class="slot-flat-view">
        <SlotItem
          v-for="slotInfo in partShoppingStore.filteredSlots"
          :static="true"
          :path="slotInfo.path"
          :nicePath="slotInfo.nicePath"
          :slotNiceName="slotInfo.slotNiceName"
          :partNiceName="slotInfo.partNiceName ? slotInfo.partNiceName : null" />
      </Accordion>

      <!-- else show the part tree only if children exists -->
      <PartSubTree
        v-else-if="partShoppingStore.partShoppingData.partTree.children"
        class="slot-tree-view"
        :children="partShoppingStore.partShoppingData.partTree.children" />
    </div>
  </template>
</template>

<script setup>
import { lua } from "@/bridge"
import { BngInput, icons } from "@/common/components/base"
import PartsList from "./PartsList.vue"
import PartSubTree from "./PartSubTree.vue"
import SlotItem from "./SlotItem.vue"
import { Accordion } from "@/common/components/utility"
import { onMounted, onUnmounted, ref } from "vue"
import { usePartShoppingStore } from "../../stores/partShoppingStore"

const partShoppingStore = usePartShoppingStore()

const props = defineProps({
  cancel: Function,
})

const searchValue = ref("")

const searchValueChanged = () => {
  partShoppingStore.searchValueChanged(searchValue.value)
}

let oldBack
onMounted(() => {
  oldBack = partShoppingStore.backAction
  partShoppingStore.backAction = () => partShoppingStore.setCategory("")
})

onUnmounted(() => {
  // TODO this is a hack, but we set the back function explicitly here, because otherwise it breaks when skipping over the slot menu
  partShoppingStore.backAction = () => props.cancel()
  //partShoppingStore.backAction = oldBack
})
</script>

<style scoped lang="scss">
.innerList {
  height: 100%;
  overflow-y: auto;
  & [bng-nav-item] {
    cursor: pointer;
  }
}

.slot-tree-view {
  margin: 0 0.25rem;
}
.slot-flat-view {
  margin: 0 0.75rem;
}
</style>
