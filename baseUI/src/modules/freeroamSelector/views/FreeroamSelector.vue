<template>
  <GridSelector backendName="freeroamSelector" routePath="/freeroam-selector" :defaultPath="{keys: ['allFreeroam']}" defaultDetailsMode="detail" :hiddenTabs="['filter']" >
    <template #item-details="{ activeItem, activeItemDetails, executeButton, toggleFavourite, exploreFolder, goToMod }">
      <GameplayDetails
        :activeItem="activeItem"
        :activeItemDetails="activeItemDetails"
        :executeButton="executeButton"
        :toggleFavourite="toggleFavourite"
        :exploreFolder="exploreFolder"
        :goToMod="goToMod"
      />
    </template>
  </GridSelector>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue"
import GridSelector from "@/common/modules/gridSelector/GridSelector.vue"
import GameplayDetails from "@/modules/gameplaySelector/components/GameplayDetails.vue"
import LevelConfigurationModal from "../components/LevelConfigurationModal.vue"
import { useBridge } from "@/bridge"
import { addPopup } from "@/services/popup"

const { events } = useBridge()

// Guihook listener for opening level configuration modal
const handleOpenLevelConfigPopup = (data) => {
  addPopup(LevelConfigurationModal, {
    levelData: data,
  }).promise
}

// Set up guihook listener
onMounted(() => {
  events.on("openLevelConfigurationPopup", handleOpenLevelConfigPopup)
})

onUnmounted(() => {
  events.off("openLevelConfigurationPopup", handleOpenLevelConfigPopup)
})
</script>

<style scoped lang="scss">

</style>
