<template>
  <GridSelector backendName="gameplaySelector" routePath="/gameplay-selector" :defaultPath="{keys: ['allGameplay']}" defaultDetailsMode="detail" :hiddenTabs="['filter']">
    <template #item-details="{ activeItem, activeItemDetails, executeButton, toggleFavourite, exploreFolder, goToMod }">
      <GameplayDetails
        :activeItem="activeItem"
        :activeItemDetails="activeItemDetails"
        :executeButton="executeButton"
        :toggleFavourite="toggleFavourite"
        :exploreFolder="exploreFolder"
        :goToMod="goToMod"
        :showHeaderTitle="true"
      />
    </template>
  </GridSelector>
</template>

<script setup>
import GridSelector from "@/common/modules/gridSelector/GridSelector.vue"
import GameplayDetails from "../components/GameplayDetails.vue"

</script>

<style scoped lang="scss">

</style>
