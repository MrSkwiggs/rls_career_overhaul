<template>
  <div class="cargoTable" v-if="cargoVehicleData">
    <!-- display player cargo -->
    <div class="playerVehicle" v-for="vehicleData in cargoVehicleData">
      <h3 class="subHeader">{{ vehicleData.niceName }}</h3>
      <div v-for="containerData in vehicleData.containers">
        <div class="playerContainer" >
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
                        width: (containerData.usedCargoSlots > 0 ? (containerData.usedCargoSlots / containerData.totalCargoSlots) * 100 : 0) + '%',
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
                    <div class="progress-label">{{ containerData.usedCargoSlots + "/" + containerData.totalCargoSlots }}</div>
                  </div>
                </div>
              </div>
              <div v-if="getDisplayAmountHighlightSlots(containerData) > containerData.totalCargoSlots" class="noSpaceLabel">Not enough space</div>
            </div>
          </h3>
          <div v-if="containerData.cargo.length" class="cargoGrid">
            <CargoCard v-for="cargo in containerData.cargo" @cargoHovered="onCargoHovered" :cargo="cargo" @onAmountSelectorChanged="onAmountSelectorChanged">
            </CargoCard>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { icons } from "@/common/components/base"
</script>

<script setup>
import { ref } from "vue"
import { lua, useBridge } from "@/bridge"
import { BngButton, BngCardHeading, BngIcon, BngUnit, BngSwitch } from "@/common/components/base"
import { useCargoOverviewStore } from "../../stores/cargoOverviewStore"
import { vBngClick, vBngSoundClass } from "@/common/directives"
import CargoCard from "../cargoOverview/CargoCard.vue"

const emit = defineEmits(["cargoHovered", "onAmountSelectorChanged"])
function onAmountSelectorChanged(value) {
  emit("onAmountSelectorChanged")
}
const { units } = useBridge()

const emptySlotHighlightAmount = ref(0)
const props = defineProps({
  facilityId: String,
  parkingSpotPath: String,
  cargoType: String,
  cargoVehicleData: Object,
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

const getDisplayAmountHighlightSlots = containerData =>
  emptySlotHighlightAmount.value <= 0 ? 0 : containerData.usedCargoSlots + emptySlotHighlightAmount.value

const showCargoContainerHelpPopup = () => lua.career_modules_delivery_cargoScreen.showCargoContainerHelpPopup()

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
  grid-template-columns: repeat(auto-fill, minmax(15em, 1fr));
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
