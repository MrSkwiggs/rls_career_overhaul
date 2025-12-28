<template>
  <BngCardHeading type="ribbon" class="cardHeading">
    Material Offers
    <BngButton
      class="headingButton"
      v-if="facilityId"
      :disabled="!cargoOverviewStore.newCargoAvailable"
      v-bng-sound-class="'bng_click_hover_generic'"
      @click="updateCargoDataAll">
      Refresh
    </BngButton>
  </BngCardHeading>
  <div class="materialContainer">
    <div class="materialCard" v-for="storageData in filteredSortedStorages" >
      <div class="materialHeader">
        {{(storageData.isProvider?'Offering: ':'Accepting: ') + $t(storageData.material.name)}}
      </div>
      <BngProgressBar
        :value="storageData.storage.storedVolume"
        :max="storageData.storage.capacity"
        :min="0"
        :showValueLabel="true"
        :valueLabelFormat="units.buildString('volume', storageData.storage.storedVolume, 0) + ' / ' + units.buildString('volume', storageData.storage.capacity, 0)" />
      <BngButton v-for="action in storageData.targetLocations"
        @click="loadmaterial(storageData.material.id, action.maxAmount, action.location)"
        :disabled="action.disabled">
          Fill {{action.label}} ({{units.buildString('volume', action.maxAmount, 0)}})
        </BngButton>

      <BngButton v-if="storageData.targetLocations && storageData.storage.storedVolume > 0"
        @click="loadCustom(storageData)"
        >
          Load Custom
        </BngButton>
      <BngButton v-for="action in storageData.sellButtons"

      >
          {{action.label}} ({{units.buildString('volume', action.amount, 0)}}) ( for {{action.money}}$)
        </BngButton>

      <div class="locationsContainer" v-if="!storageData.locations || !storageData.locations.length || storageData.locations.length == 0" >
        Nowhere to deliver from or to? (Probably an issue)
      </div>
      <div class="locationsContainer" v-else>
        {{storageData.isProvider?'Deliver to: ':'Pick up from: '}}
        <div class="locationsFlexRow">
          <div v-for="location in storageData.locations" @mouseover="onLocationHovered(location, !storageData.isProvider)" @mouseleave="onLocationHovered()">
            <div  class="location" :class="getLocationClass(location)" >
              {{$tt(location.name)}} ({{units.buildString('length', location.distance, 1)}})
            </div>
          </div>
        </div>
      </div>


    </div>
  </div>
</template>


<script setup>
import { computed } from "vue"
import { lua, useBridge } from "@/bridge"
import { BngButton, BngUnit, BngCardHeading, BngProgressBar, BngIcon, icons } from "@/common/components/base"
import { useCargoOverviewStore } from "../../stores/cargoOverviewStore"
import { vBngSoundClass } from "@/common/directives"
import { AspectRatio } from "@/common/components/utility"
import CargoLoadPopup from "../cargoOverview/CargoLoadPopup.vue"
import { openScreenOverlay, addPopup } from "@/services/popup"
const { units } = useBridge()

const props = defineProps({
  sortedStorages: Object,
  facilityId: String,
  parkingSpotPath: String,
  cargoType: String,
})

const filteredSortedStorages = computed(() => {
  return props.sortedStorages.filter((s) => {return s.material.type===props.cargoType})

})

const cargoOverviewStore = useCargoOverviewStore()

const updateCargoDataAll = () => cargoOverviewStore.requestCargoData(props.facilityId, props.parkingSpotPath)


const getNiceTime = timeInSeconds => ~~(timeInSeconds / 60) + (timeInSeconds >= 120 ? " min" : ` : ${pad(~~timeInSeconds % 60)}`)

const hoverOffer = offer => {
  if (offer && offer.remainingOfferTime) {
    lua.career_modules_delivery_cargoScreen.showVehicleOfferRoutePreview(offer.id)
  } else {
    lua.career_modules_delivery_cargoScreen.showVehicleOfferRoutePreview(undefined)
  }
}

const loadmaterial = (material, amount, targetLocation) => {
  lua.career_modules_delivery_cargoScreen.moveMaterialFromUi(material, props.cargoType, amount, targetLocation)
  cargoOverviewStore.requestCargoData(props.facilityId, props.parkingSpotPath)
}



const onLocationHovered = (loc, asProvider) => {
  if (loc) {
    lua.career_modules_delivery_cargoScreen.showLocationRoutePreview(loc.id, asProvider)
  } else {
    lua.career_modules_delivery_cargoScreen.showLocationRoutePreview(undefined, false)
  }
}

let loadingPrompt = null
const loadCustom = (storageData) => {
  loadingPrompt = addPopup(CargoLoadPopup,{storageData: storageData}).promise
}

const getLocationClass = location => ({
  ...(cargoOverviewStore.cargoHighlighted && {
    ["highlight-hidden-location"]: !location.highlight,
    ["highlight-shown-location"]: location.highlight,
  }),
})

</script>

<style scoped lang="scss">

.materialContainer {
  overflow-y:scroll;
  padding-left: 0.5em;
  padding-right: 0.5em;
  padding-bottom: 0.5em;
  padding-top: 0em;
  .materialHeader {
    font-size:1.5em;
    font-weight:800;
  }
}

.materialCard {
  background-color: rgba(255,255,255, 0.05);
  border-radius:var(--bng-corners-2);
  padding:0.5em;
  margin-bottom:0.5em;
}

.locationsContainer {
  background-color: rgba(var(--bng-cool-gray-700-rgb), 0.4);
  border-radius:var(--bng-corners-2);
  padding:0.5em;

  .locationsFlexRow {
    display:flex;
    flex-flow:wrap;
    .location {
      background-color: rgba(var(--bng-cool-gray-700-rgb), 0.6);
      padding: 0.25em 0.5em;

      border-radius:var(--bng-corners-2);
      margin:0.1em;
      display:flex;

    }
    .highlight-hidden-location {
      color: rgba(var(--bng-cool-gray-500-rgb), 1);
      background-color: rgba(var(--bng-cool-gray-800-rgb), 0.6);
    }

    .highlight-shown-location {
      color: #ff6600 !important;
      background-color: rgba(var(--bng-cool-gray-600-rgb), 0.6);
    }

  }
}

</style>
