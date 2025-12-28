<template>
  <GridSelector backendName="vehicleSelector" routePath="/vehicle-selector" :defaultPath="{keys: ['allModels']}" defaultDetailsMode="advanced" tileImagesTopAligned>
    <template #item-details="{ activeItem, activeItemDetails, executeButton, toggleFavourite, exploreFolder, goToMod }">
      <VehicleDetails
        :activeItem="activeItem"
        :activeItemDetails="activeItemDetails"
        :executeButton="executeButton"
        :toggleFavourite="toggleFavourite"
        :exploreFolder="exploreFolder"
        :goToMod="goToMod"
        :showHeaderTitle="true"
      />
    </template>
    <template #management-details="{ managementDetails, executeButton }">
      <ManagementDetails
        :managementDetails="managementDetails"
        :executeButton="executeButton"
      />
    </template>
  </GridSelector>
</template>

<script setup>
import GridSelector from "@/common/modules/gridSelector/GridSelector.vue"
import VehicleDetails from "../components/VehicleDetails.vue"
import ManagementDetails from "../components/ManagementDetails.vue"
</script>

<style scoped lang="scss">

</style>
