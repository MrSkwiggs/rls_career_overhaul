<template>
  <!--div class="vehicle-shop-wrapper"-->
  <BngCard class="vehicle-shop-wrapper" v-bng-blur bng-ui-scope="vehicleList">
    <div class="site-body" bng-nav-scroll bng-nav-scroll-force>
      <div class="heading">
        <span class="header-text">{{ getHeaderText() }}</span>
        <span class="price-notice"><span>*&nbsp;</span><span>Additional taxes and fees are applicable</span></span>
      </div>
      <!-- <div class="layo-ut">
        <span v-for="(layout, key) of layouts" :key="key" @click="switchLayout(key)" :class="{'layout-selected': layout.selected}">{{ layout.name }}</span>
      </div> disabled temporarily -->
      <div v-if="vehicleShoppingStore" class="vehicle-list">
        <VehicleCard
          v-for="(vehicle, key) in vehicleShoppingStore.filteredVehicles"
          :key="key"
          :vehicleShoppingData="vehicleShoppingStore.vehicleShoppingData"
          :vehicle="vehicle" />
      </div>
      <div v-if="vehicleShoppingStore && vehicleShoppingStore.filteredSoldVehicles && vehicleShoppingStore.filteredSoldVehicles.length > 0" class="vehicle-list sold-list">
        <div class="list-section-title">Recently Sold Vehicles You Viewed ({{ vehicleShoppingStore.filteredSoldVehicles.length }})</div>
        <VehicleCard
          v-for="(vehicle, key) in vehicleShoppingStore.filteredSoldVehicles"
          :key="key"
          :vehicleShoppingData="vehicleShoppingStore.vehicleShoppingData"
          :vehicle="vehicle" />
      </div>
    </div>
  </BngCard>
  <!--/div-->
</template>

<script setup>
import { reactive } from "vue"
import VehicleCard from "./VehicleCard.vue"
import { BngCard, BngButton, ACCENTS, BngBinding } from "@/common/components/base"
import { vBngBlur, vBngOnUiNav } from "@/common/directives"
import { lua } from "@/bridge"
import { useVehicleShoppingStore } from "../../stores/vehicleShoppingStore"

import { useUINavScope } from "@/services/uiNav"
useUINavScope("vehicleList")

const vehicleShoppingStore = useVehicleShoppingStore()

const getHeaderText = () => {
  return vehicleShoppingStore?.currentSeller?.name || "BeamCar24"
}

const getWebsiteText = () => {
  const headerText = getHeaderText()
  return headerText.replace(/\s+/g, "-") + ".com"
}

const layouts = reactive([
  { name: "switch", selected: true, class: "" },
  { name: "me", selected: false, class: "" },
  { name: "please", selected: false, class: "" },
])
function switchLayout(key) {
  for (let i = 0; i < layouts.length; i++) layouts[i].selected = key === i
}
</script>

<style scoped lang="scss">
.vehicle-shop-wrapper {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  //background-color: var(--bng-black-8);
  & :deep(.card-cnt) {
    background-color: rgba(0, 0, 0, 0);
  }
  .address-bar {
    flex: 0 0 auto;
    display: flex;
    flex-flow: row;
    align-items: center;
    background-color: var(--bng-cool-gray-700);
    padding: 0.5rem;

    & > .spacer {
      flex: 0.2 0.2 0.25rem;
    }
    & > .field {
      border-radius: var(--bng-corners-1);
      background-color: var(--bng-cool-gray-900);
      // border: 0.0625rem solid var(--bng-cool-gray-600);
      padding: 0.5rem 0.75rem;
      flex: 1 1 auto;
      text-overflow: ellipsis;
      color: white;
      text-align: center;
      // text-transform: lowercase;
      & > span {
        &::before {
          content: " ";
          display: inline-block;
          height: auto;
          color: var(--bng-cool-gray-400);
        }
        &::after {
          content: " ";
          display: inline-block;
          height: auto;
          color: var(--bng-cool-gray-400);
        }
      }
    }
  }

  .site-body {
    min-height: 0;
    overflow: auto;
    color: white;
  }
  .layo-ut {
    position: sticky;
    top: 0px;
    left: 1rem;
    z-index: 9999;
    border-radius: var(--bng-corners-2);
    width: 16rem;
    padding: 0.5rem;
    background: var(--bng-cool-gray-800);
  }
  .price-notice {
    display: inline-flex;
    justify-content: flex-end;
    width: 100%;
    color: var(--bng-cool-gray-200);
  }
  .heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid var(--bng-cool-gray-700);
    > * {
      flex: 1;
    }
    .header-text {
      font-weight: 600;
      font-size: 1.25rem;
    }
  }
  .vehicle-list {
    display: flex;
    flex-flow: row wrap;
    gap: 0.5rem;
    padding: 0.5rem;
    width: 100%;
    overflow-y: auto;
    // height: 90%;
    min-height: 0;
    // background: #bdc8d1;
  }
  .sold-list {
    & :deep(.vehicle-card) {
      filter: grayscale(0.6) brightness(0.8);
    }
  }
  .list-section-title {
    width: 100%;
    text-align: center;
    padding: 0.75rem 0;
  }
}

.layout-selected {
  color: pink;
}
</style>
