<template>
  <template v-if="cargoOverviewStore.cargoData">
    <div class="heading-wrapper">
      <BngCardHeading type="ribbon" class="cardHeading">
        {{ facilityId ? "Available Cargo - " + cargoOverviewStore.cargoData.facility.name : "My Cargo" }}
      </BngCardHeading>
      <div class="buttons-container">
        <BngButton
          class="headingButton"
          v-if="facilityId"
          :disabled="!cargoOverviewStore.newCargoAvailable"
          v-bng-sound-class="'bng_click_hover_generic'"
          @click="updateCargoDataAll">
          Refresh
        </BngButton>

        <BngSwitch v-if="!facilityId" v-model="cargoOverviewStore.automaticRoute"> Automatic route </BngSwitch>

        <BngButton
          class="headingButton"
          v-if="!facilityId && cargoOverviewStore.cargoData.player.penaltyForAbandon > 0"
          v-bng-sound-class="'bng_click_hover_generic'"
          show-hold
          v-bng-click="{ holdCallback: () => exitMode(), holdDelay: 1000, repeatInterval: 0 }"
          :accent="ACCENTS.attention">
          Dump all cargo and pay <BngUnit :money="cargoOverviewStore.cargoData.player.penaltyForAbandon" />
        </BngButton>
      </div>
    </div>

    <!-- progress bar if the facility is disabled -->
    <!-- This part is currently not used
    <div class="lockedFacility" v-if="facilityId && cargoOverviewStore.cargoData.facility.disabled">
      <h3 class="subHeader">{{ cargoOverviewStore.cargoData.facility.disabledReasonHeader }} <BngIcon class="text-icon" :type="icons.lockClosed" /></h3>
      <div class="locked-reason">{{ cargoOverviewStore.cargoData.facility.disabledReasonContent }}</div>
      <div v-for="prog in cargoOverviewStore.cargoData.facility.progress" class="unlock-progress">
        <-- TO/DO - please replace with BngProgressBar or discuss why not
        <div v-if="prog.type === 'progressBar'" class="progressbar-wrapper">
          <div class="progressbar-background">
            <div class="progress-label">{{ $ctx_t(prog.label) }}</div>
            <div class="progressbar-fill" :style="{ width: (prog.currValue > 0 ? (prog.currValue / (prog.maxValue - prog.minValue)) * 100 : 0) + '%' }"></div>
          </div>
        </div>
      </div>
    </div>
  -->

    <div class="cargoTable">
      <!-- display a facility -->
      <div v-if="facilityId" class="scrollable-table" :class="getFacilityClass()">

        <CargoTable
          :isFacility="true"
          :cargoType="cargoType"
          :sortedCargo="cargoOverviewStore.sortedParcelOffersByCargoType[cargoType]"
          :cargoAttributes="parkingSpotPath ? CARGO_ATTRIBS.outgoing : CARGO_ATTRIBS.outgoingNoParkingSpot"
          @cargoHovered="onCargoHovered"
          @loadCargoCustom="loadCargoCustom"
          v-if="cargoOverviewStore.sortedParcelOffersByCargoType[cargoType]" />
        <div v-else>No cargo available</div>
      <!--
        <div class="cargoGrid" >
          <template v-for="cargo in cargoOverviewStore.sortedParcelOffersByCargoType[cargoType]">
            <CargoCard :cargo="cargo"
            :focus="'destination'"
            :hideStats="false" :hideModsAndTimer="false"
             />
          </template>
        </div>
      -->
      </div>

      <!-- display player cargo -->
      <div v-else class="playerVehicle" v-for="vehicleData in cargoOverviewStore.cargoData.player.vehicles">
        <div v-if="vehicleData.hasContainersOfCargoType[cargoType]">
          <h3 class="subHeader">{{ vehicleData.niceName }}</h3>
          <div v-for="containerData in vehicleData.containers">
            <div class="playerContainer" v-if="containerData.cargoTypesString === cargoType">
              <h3 class="subHeader">
                <div class="wrapper">
                  <div class="containerName">{{ containerData.name }}</div>
                  <div class="slots">Slots:</div>
                  <div>
                    <!-- This does not use bngProgressBar because we need to disaplay 2 progress bars on top of each other, if cargo is hovered -->
                    <div class="progressbar-wrapper slotsProgressBar">
                      <div class="slotsProgressbarBackground">
                        <div
                          class="slotsProgressbarFill"
                          :style="{
                            width: ((containerData.usedCargoSlots - containerData.transientCargoSlots) > 0 ? ((containerData.usedCargoSlots - containerData.transientCargoSlots) / containerData.totalCargoSlots) * 100 : 0) + '%',
                          }"></div>

                        <!-- hovering over cargo -->
                        <div v-if="getDisplayAmountHighlightSlots(containerData) > 0">
                          <!-- the hovered cargo fits the container -->
                          <div
                            v-if="getDisplayAmountHighlightSlots(containerData) <= containerData.totalCargoSlots"
                            class="slotsProgressbarFill slotHighlight"
                            :style="{
                              backgroundColor: 'rgb(255, 130, 47)',
                              zIndex: -1,
                              width: Math.min((getDisplayAmountHighlightSlots(containerData) / containerData.totalCargoSlots) * 100, 110) + '%',
                            }" />
                          <!-- the hovered cargo doesnt fit the container -->
                          <div v-else class="slotsProgressbarFill slotHighlight nonHighlighted" />
                        </div>
                        <div class="progress-label">{{ (containerData.usedCargoSlots) + "/" + containerData.totalCargoSlots }}</div>
                      </div>
                    </div>
                  </div>
                  <div v-if="getDisplayAmountHighlightSlots(containerData) > containerData.totalCargoSlots" class="noSpaceLabel">Not enough space</div>
                </div>
              </h3>
            </div>
            <div v-if="containerData.cargo.length">
              <CargoTable
                v-if="containerData.cargoTypesString === cargoType"
                :isFacility="false"
                :cargoType="cargoType"
                :sortedCargo="containerData.cargo"
                :cargoAttributes="CARGO_ATTRIBS.player"
                @cargoHovered="onCargoHovered"
                @loadCargoCustom="loadCargoCustom" />
            </div>
          </div>
        </div>
      </div>
      <div v-if="!facilityId && !cargoOverviewStore.cargoData.player.hasContainersOfCargoType[cargoType]" style="max-width: 48em">
        <p>Your vehicle has no cargo containers installed that can hold this type of cargo. Head to you garage and install some!</p>
        <p>Access the <b>Computer</b> and navigate to <b>Purchase Parts</b> and then <b>Cargo Parts</b>.</p>
        <BngButton @click="showCargoContainerHelpPopup">Show me how!</BngButton>
      </div>

      <div v-if="!facilityId" class="summary">
        <div class="item">
          Penalty for abandoning deliveries:
          <BngUnit :money="cargoOverviewStore.cargoData.player.penaltyForAbandon" />
        </div>
        <div class="item">
          Reward sum:
          <BngUnit :money="cargoOverviewStore.cargoData.player.loadedCargoMoneySum" />
        </div>
        <div class="item">
          Cargo weight:
          {{ units.buildString("weight", cargoOverviewStore.cargoData.player.weightSum, 1) }}
        </div>
      </div>
    </div>
  </template>
</template>

<script>
import { icons } from "@/common/components/base"

const CARGO_ATTRIBS = {
  player: {
    quantity: true,
    name: true,
    destination: true,
    location: false,
    origin: false,
    distance: true,
    reward: true,
    move: true,
    slots: true,
    route: true,
    weight: true,
    modifiers: true,
  },

  outgoing: {
    quantity: true,
    name: true,
    destination: true,
    location: false,
    origin: false,
    distance: true,
    reward: true,
    move: true,
    slots: true,
    offerTime: true,
    weight: true,
    modifiers: true,
  },

  outgoingNoParkingSpot: {
    quantity: true,
    name: true,
    destination: true,
    location: false,
    origin: true,
    distance: true,
    reward: true,
    move: false,
    slots: true,
    offerTime: true,
    weight: true,
    modifiers: true,
    routeOrigin: true,
  },
}
</script>

<script setup>
import { ref } from "vue"
import { lua, useBridge } from "@/bridge"
import { BngButton, ACCENTS, BngCardHeading, BngIcon, BngUnit, BngSwitch } from "@/common/components/base"
import { useCargoOverviewStore } from "../../stores/cargoOverviewStore"
import { vBngClick, vBngSoundClass } from "@/common/directives"
import CargoTable from "../cargoOverview/CargoTable.vue"
import CargoCard from "../cargoOverview/CargoCard.vue"
import CargoLoadPopup from "../cargoOverview/CargoLoadPopup.vue"
import { openScreenOverlay, addPopup } from "@/services/popup"
const emit = defineEmits(["cargoHovered"])
const { units } = useBridge()

const emptySlotHighlightAmount = ref(0)
const props = defineProps({
  facilityId: String,
  parkingSpotPath: String,
  cargoType: String,
})

const exitMode = () => {
  lua.career_modules_delivery_cargoScreen.exitDeliveryMode()
  lua.career_modules_delivery_cargoScreen.exitCargoOverviewScreen()
}

const cargoOverviewStore = useCargoOverviewStore()

const updateCargoDataAll = () => {
  cargoOverviewStore.requestCargoData(props.facilityId, props.parkingSpotPath)
}

const onCargoHovered = cargo => emit("cargoHovered", cargo)

const getFacilityClass = () => (cargoOverviewStore.cargoData.facility.disabled ? "disabledFacility" : "")

const highlightEmptySlots = amount => (emptySlotHighlightAmount.value = amount)

const getDisplayAmountHighlightSlots = containerData => containerData.transientCargoSlots == 0 ? 0 : containerData.usedCargoSlots
  //emptySlotHighlightAmount.value <= 0 ? 0 : containerData.usedCargoSlots + emptySlotHighlightAmount.value

const showCargoContainerHelpPopup = () => lua.career_modules_delivery_cargoScreen.showCargoContainerHelpPopup()

let loadingPrompt = null
const loadCargoCustom = cargo => {
  loadingPrompt = addPopup(CargoLoadPopup, { cargo: cargo }).promise
}

defineExpose({
  highlightEmptySlots,
})
</script>

<style scoped lang="scss">
@use "@/styles/modules/density" as *;

.headingButton {
  font-size: 0.875rem;
  float: right;
}

.cargoGrid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fill, minmax(30em, 1fr));
  padding: 0.25rem;
}


.playerCargo {
  .cargoTable {
    flex: 1 1 auto;
    .playerContainer {
      background-color: rgba(var(--bng-cool-gray-700-rgb), 0.6);
      padding-left: 0.5em;
      padding-right: 0.5em;
      padding-bottom: 0.5em;
      padding-top: 0em;
      margin-top: 1em;
      border-radius: $border-rad-2;
    }
    .playerVehicle {
      flex: 1 1 auto;
      overflow-y: auto;
    }
  }
}

.cargoTable {
  padding: 0 0.5rem 0.5rem;
  flex: 0 1 auto;
  display: flex;
  flex-flow: column;
  // overflow-y: auto;
  position: relative;
  .scrollable-table {
    max-height: 30vh;
    flex: 1 1 auto;
    overflow-y: auto;
    border-radius: $border-rad-2;
  }
}

.lockedFacility {
  flex: 0 0 auto;
  display: flex;
  flex-flow: column;
  .unlock-progress {
    flex: 0 0 auto;
    padding: 0 0.5em 1em 0.5em;
    min-height: 2em;
  }
  .locked-reason {
    color: red;
    padding-bottom: 1em;
  }
}

.disabledFacility {
  color: rgb(172, 172, 172);
  flex: 1 1 auto;
}

.text-icon {
  min-width: 1em;
  min-height: 1em;
  display: inline-block;
  transform: translateY(0.15em);
}

.slot {
  float: left;
  width: 0.4em;
  height: 1.2em;
  margin: 0.05em;
  margin-top: 0.3em;
}

.slotEmpty {
  border: 0.01em solid rgb(255, 102, 0);
}

.slotFull {
  background-color: rgb(255, 102, 0);
}

@keyframes pulsing {
  50% {
    opacity: 0.5;
  }
}

.slotHighlight {
  animation: pulsing 0.8s ease-in-out infinite;
  background-color: rgb(255, 130, 47);
}

.subHeader {
  margin-block-end: 0.5em;

  .wrapper {
    display: flex;
  }
  .containerName {
    float: left;
    margin-top: 0.5em;
  }
  .slots {
    float: left;
    margin-top: 0.5em;
    padding-left: 1em;
  }
  .slotsProgressBar {
    padding-left: 0.5em;
  }
  .noSpaceLabel {
    padding-left: 1em;
    margin-top: 0.5em;
  }
}

.slotOverview {
  margin-left: 0.5em;
}

.slotsProgressbarBackground {
  //padding-left: 1em;
  display: flex;
  border-radius: var(--bng-corners-1);
  width: 20em;
  background-color: rgba(0, 0, 0, 0.781);
  transform: translate(0%, 20%);

  .nonHighlighted {
    background-color: rgb(255, 56, 49) !important;
    width: 100%;
    animation: undefined;
  }
}

.slotsProgressbarFill {
  background-color: rgb(255, 102, 0);
  position: absolute;
  border-radius: var(--bng-corners-1);
  height: 100%;
}

.progressbar-background {
  display: flex;
  border-radius: var(--bng-corners-1);
  width: 100%;
}

.progressbar-fill {
  background-color: rgba(114, 113, 113, 0.877);
  position: absolute;
  height: 100%;
}

.progressbar-wrapper {
  position: relative;
  display: flex;
  flex-direction: row;
  border-radius: var(--bng-corners-1);
}
.progress-label {
  display: flex;
  flex-direction: row;
  z-index: 2;
  position: relative;
  padding-left: 0.5em;
  padding-top: 0.2em;

  text-align: center;
  height: 100%;
}

.summary {
  flex: 0 0 auto;
  padding-top: 0.5em;
  .item {
    float: left;
    padding-right: 5em;
  }
}

.heading-wrapper {
  display: flex;
  flex-flow: row wrap;
  align-items: flex-start;
  flex: 0 0 auto;
  padding: 0.5rem 0.5rem 0.5rem 0;
  align-items: center;

  .cardHeading {
    flex: 1 0 auto;
    margin: 0;
  }

  .buttons-container {
    display: flex;
    flex: 0 0.5 auto;
    flex-flow: row nowrap;
    align-items: stretch;
  }
}
</style>
