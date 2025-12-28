<template>
  <ComputerWrapper
    :path="[vehicleShoppingStore.vehicleShoppingData.currentSellerNiceName || ('Vehicle Marketplace')]"
    :title="headerTitle"
    bng-ui-scope="vehicleShopping"
    v-bng-on-ui-nav:tab_l,tab_r="processTabInput"
    back @back="close"
  >
    <template #status>
      Free Inventory Slots: {{ vehicleShoppingStore ? vehicleShoppingStore.vehicleShoppingData.numberOfFreeSlots : 0 }}
    </template>

    <div class="flex-container">
      <div class="content" v-bng-blur="1"> <!-- content -->
        <Tabs class="bng-tabs" :class="{ 'single-tab': tabs.length === 1 }" :selectedIndex="selectedTab" @change="onTabsChange">
          <TabList />

          <div v-if="props.buyingAvailable === 'true'" :tab-heading="buyVehicleTitle" class="buying-tab-content">
            <BngCard v-if="loaded && !selectedSellerId" class="buying-card">
              <div v-if="vehicleShoppingStore.vehicleShoppingData.uiDealershipsData && Object.keys(vehicleShoppingStore.vehicleShoppingData.uiDealershipsData).length">
                <div class="seller-grid">
                  <BngTile
                    v-for="dealership in vehicleShoppingStore.vehicleShoppingData.uiDealershipsData"
                    :key="dealership.id"
                    class="seller-card"
                    :style="{
                      backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0)), url(' + ((dealership.preview && dealership.preview[0] === '/' ? dealership.preview : '/' + dealership.preview)) + ')'
                    }"
                    @click="dealership.vehicleCount && selectSeller(dealership.id)"
                  >
                  <template #label>
                      <div class="seller-card__label">

                        <div class="seller-card__header">
                          <div class="seller-card__title"><BngIcon :type="dealership.icon" />{{ dealership.name }}</div>
                          <div v-if="dealership.description" class="seller-card__subtitle">{{ dealership.description }}</div>
                        </div>
                        <div class="seller-card__vehicle-thumbnails">
                          <template v-for="(vehicle, index) in getDealershipVehicles(dealership.id).slice(0, 5)">
                            <div class="seller-card__vehicle-thumbnail">
                              <AspectRatio :ratio="'16:9'" class="seller-card__vehicle-thumbnail-image" :external-image="vehicle.preview" >
                                <div v-if="index == 0 && getDealershipVehicles(dealership.id).length > 5" class="more-label">
                                  +{{ getDealershipVehicles(dealership.id).length - 4 }}
                                </div>
                              </AspectRatio>
                            </div>

                          </template>

                        </div>
                      </div>
                    </template>
                  </BngTile>
                </div>
              </div>
              <div v-else>
                <span>No sellers available.</span>
              </div>
            </BngCard>
            <VehicleList v-else-if="loaded" />
            <BngCard v-else>
              <BngCardHeading style="color: #fff;">Please wait...</BngCardHeading>
            </BngCard>
          </div>

          <div v-if="props.marketplaceAvailable === 'true'" :tab-heading="sellVehicleTitle" class="marketplace-tab-content">
            <VehicleMarketplace />
          </div>
        </Tabs>
      </div>
    </div>
  </ComputerWrapper>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from "vue"
import { BngCard, BngCardHeading, BngTile, BngIcon } from "@/common/components/base"
import { Tabs, Tab, TabList, AspectRatio } from "@/common/components/utility"
import { useVehicleShoppingStore } from "../stores/vehicleShoppingStore"
import ComputerWrapper from "./ComputerWrapper.vue"
import VehicleList from "../components/vehicleShopping/VehicleList.vue"
import VehicleMarketplace from "../components/vehicleShopping/VehicleMarketplace.vue"
import { lua } from "@/bridge"
import { useComputerStore } from "../stores/computerStore"
import { vBngOnUiNav } from "@/common/directives"
import { useUINavScope } from "@/services/uiNav"
import { useRouter } from "vue-router"
import { vBngBlur } from "@/common/directives"

useUINavScope("vehicleShopping")

const buyVehicleTitle = 'Buy Vehicles'
const sellVehicleTitle = 'Sell Vehicles'

const computerStore = useComputerStore()
const vehicleShoppingStore = useVehicleShoppingStore()

const selectedTab = ref(0)
const selectedSellerId = ref("")

const router = useRouter()

const loaded = ref(false)

const selectSeller = (sellerId) => {
  setSelectedSellerId(sellerId)
  updateRouteScreenTag()
}

const tabs = computed(() => {
  let tabs = []
  if (props.buyingAvailable === 'true') {
    tabs.push(buyVehicleTitle)
  }
  if (props.marketplaceAvailable === 'true') {
    tabs.push(sellVehicleTitle)
  }
  return tabs
})

const props = defineProps({
  screenTag: {
    type: String,
    default: "",
  },
  buyingAvailable: {
    type: String,
    default: "true",
  },
  marketplaceAvailable: {
    type: String,
    default: "true",
  },
  selectedSellerId: {
    type: String,
    default: "",
  },
})

const processTabInput = (event) => {
  if (event.detail.name === "tab_l") {
    selectedTab.value = (selectedTab.value - 1 + tabs.value.length) % tabs.value.length
  } else if (event.detail.name === "tab_r") {
    selectedTab.value = (selectedTab.value + 1) % tabs.value.length
  }
}

const onTabsChange = (tab, old) => {
  const idx = tabs.value.indexOf((tab && tab.heading) ? tab.heading : "")
  if (idx !== -1) selectedTab.value = idx
  if (selectedTab.value === tabs.value.indexOf(buyVehicleTitle)) {
    selectedSellerId.value = ""
  }
}

const headerTitle = computed(() => {
  switch (tabs.value[selectedTab.value]) {
    case buyVehicleTitle:
      return "Buy Vehicles"
    case sellVehicleTitle:
      return "Sell Vehicles"
    default:
      return "Available Vehicles"
  }
})

const updateRouteScreenTag = () => {
  const isSelling = selectedTab.value === tabs.value.indexOf(sellVehicleTitle)
  const screenTag = isSelling ? "marketplace" : "buying"
  router.replace({
    name: "vehicleShopping",
    params: {
      screenTag,
      buyingAvailable: props.buyingAvailable,
      marketplaceAvailable: props.marketplaceAvailable,
      selectedSellerId: selectedSellerId.value,
    },
  })
}

watch(selectedTab, () => {
  updateRouteScreenTag()
})

const setSelectedSellerId = (sellerId) => {
  selectedSellerId.value = sellerId
  vehicleShoppingStore.setSelectedSellerId(selectedSellerId.value)
}

const dealershipVehiclesMap = computed(() => {
  const map = new Map()
  if (!vehicleShoppingStore.vehicleShoppingData.vehiclesInShop) return map

  vehicleShoppingStore.vehicleShoppingData.vehiclesInShop
    .filter(vehicle => vehicle.preview)
    .forEach(vehicle => {
      if (!map.has(vehicle.sellerId)) {
        map.set(vehicle.sellerId, [])
      }
      map.get(vehicle.sellerId).push(vehicle)
    })

  return map
})

const getDealershipVehicles = (dealershipId) => {
  return dealershipVehiclesMap.value.get(dealershipId) || []
}

const start = () => {
  nextTick(async () => {
    await vehicleShoppingStore.requestVehicleShoppingData()
    loaded.value = true
    if (vehicleShoppingStore.vehicleShoppingData.currentSeller) {
      setSelectedSellerId(vehicleShoppingStore.vehicleShoppingData.currentSeller)
    } else {
      setSelectedSellerId(props.selectedSellerId)
    }

    if (props.screenTag == "buying") {
      selectedTab.value = tabs.value.indexOf(buyVehicleTitle)
    } else if (props.screenTag == "marketplace") {
      selectedTab.value = tabs.value.indexOf(sellVehicleTitle)
    } else {
      selectedTab.value = 0
    }
    updateRouteScreenTag()
  })
}

const kill = async () => {
  await lua.career_modules_vehicleShopping.onShoppingMenuClosed()
  vehicleShoppingStore.$dispose()
}

const close = () => {
  if (!vehicleShoppingStore.vehicleShoppingData.currentSeller && selectedTab.value === tabs.value.indexOf(buyVehicleTitle) && selectedSellerId.value) {
    selectedSellerId.value = ""
  } else {
    router.back()
  }
}

onMounted(start)
onUnmounted(kill)
</script>

<style scoped lang="scss">
.active-tab {
  background-color: var(--bng-accents);
  color: white;
}

.flex-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 80rem;
}

.tabs {
  flex-shrink: 0;
}

.content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.content :deep(.bng-tabs) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  --tab-bg: var(--bng-black-o8, 0.5);
  --tab-content-bg: var(--bng-black-o8, 0.5);
  --tab-list-corners: var(--bng-corners-2);
  --tab-content-corners: var(--bng-corners-2);
  .tab-list {
    >* {
      flex: 1 auto;
      max-width: none;
      background-color: rgba(var(--bng-cool-gray-400-rgb), 0.1);
    }
  }
}

.content :deep(.tab-container) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.content :deep(.tab-content) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.buying-tab-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  :deep(.bng-card) {
    --bg-opacity: 0.0;
  }
}

.marketplace-tab-content {
  padding: 0.5em;
}
/* Seller grid/cards */
.seller-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20em, 1fr));
  gap: 0.5em;
  padding: 0.5em;
}

.seller-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  text-align: left;
  overflow: hidden;
  border-radius: var(--bng-corners-2);
  //padding: 12px;
  padding: 0;
  cursor: pointer;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  height: 14em;
  width: auto;
  color: var(--bng-off-white-brighter);
  /* Uniform dark overlay over image */
  background-color: rgba(0, 0, 0, 0.1);
  background-blend-mode: multiply;
  :deep(.content-container) {
    display: none;
  }
}

.seller-card:hover {
  background-color: rgba(0, 0, 0, 0.0);
  border-color: rgba(255, 255, 255, 0.12);
}

.seller-card.disabled {
  filter: grayscale(100%);
}

.seller-card__label {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  height: 100%;
}

.seller-card__header {
  padding: 0.75rem;
}

.seller-card__title {
  font-weight: 600;
  font-size: 1.05rem;
  margin-bottom: 0.25rem;
  :deep(.icon-base) {
    margin-right: 0.5rem;
  }
}

.seller-card__subtitle {
  font-size: 0.8rem;
  font-weight: 200;
  padding-top: 0;
}

.seller-card__footer {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.seller-card__vehicle-thumbnails {
  display: flex;
  flex-direction: row;
  flex-flow: row-reverse nowrap;
  align-items: flex-end;
  justify-content: space-around;
  width: 100%;
  margin-top: auto;

  gap: 0.25em;
  padding: 0.25em;
  background: linear-gradient(to top, rgba(0, 0, 0, 1) 0, rgba(0, 0, 0, 0.8) 2rem, rgba(0, 0, 0, 0) 100%);
  overflow: hidden;
  height: 5rem;


  .seller-card__vehicle-thumbnail-image {
    width: 4.8em;
    border-radius: var(--bng-corners-1);
    overflow: hidden;

    .more-label {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(0, 0, 0, 0.75);
      color: white;
      font-size: 1.25rem;
      font-weight: 500;
    }
  }

}

.seller-card :deep(.content) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  height: 100%;
  width: 100%;
}

.availability {
  padding: 0.25rem 0.5rem;
  border-radius: var(--bng-corners-1);
  background-color: var(--bng-orange-500);

  font-weight: 600;
  font-size: 0.85rem;
}

.availability.empty {
  background-color: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.6);
}

/* Hide tab list when there's only one tab */
:deep(.single-tab .tab-list) {
  display: none;
}

</style>
