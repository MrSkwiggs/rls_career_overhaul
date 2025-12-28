<template>
  <div class="customload-wrapper" bng-ui-scope="cargoLoadPopup">
    <BngCard>
      <BngCardHeading type="ribbon" v-if="!throwAway">Custom Loading</BngCardHeading>
      <BngCardHeading type="ribbon" v-else> Throwing away {{ loadingName }}</BngCardHeading>
      <div class="card-container">
        <CargoCard :ribbon="false" :card="card" :hideProps="false" :hideModsAndTimer="true" :showButtons="false" :detailed="true" :alwaysShowLoadingWrapper="isFacilityCard" />

      </div>
      <template v-if="vehicles && vehicles.length > 1">
        <span>Vehicles</span>
        <BngPillFilters
          v-if="!throwAway"
          v-model="vehicleFilterModel"
          selectMany
          :options="vehicleFilterOptions"
          :showCheckIcon="false"
          @valueChanged="vehicleFilterChanged" />
      </template>

      <div class="content target-grid">
        <template v-if="targetLocations && !throwAway" v-for="(target, targetIndex) in targetLocations">
          <div class="target-tile" v-if="!target.hidden">
            <CardGroup :label="target.label" :meta="target.meta">
              <div class="to-load" :class="{ 'none-assigned': target.loadSliderValue == 0 }">
                <div class="loading-controls amount-load">
                  <BngButton class="less" :iconLeft="icons.minus" accent="text" @click="less(target)"> </BngButton>
                  <BngSlider
                    bng-no-nav
                    class="slider"
                    :min="0"
                    :max="target.loadSliderMax"
                    :step="1"
                    v-model="target.loadSliderValue"
                    @valueChanged="updateSliderAmounts(target)" />
                  <BngButton class="more" :iconLeft="icons.plus" accent="text" @click="more(target)"> </BngButton>
                  <div class="amount">×{{ target.loadSliderValue }}</div>
                </div>
                <div class="chevron-arrow">
                  <svg class="chevron-outer" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <svg class="chevron-inner" viewBox="4 2 12 60" preserveAspectRatio="xMaxYMid slice">
                      <path
                        v-if="target.loadSliderValue === 0"
                        d="M-11 -2H1L14 32L1 66H-11V-2Z"
                        fill="rgb(var(--chevron-color))"
                        fill-opacity="var(--chevron-alpha)"
                        stroke="rgb(var(--chevron-color))"
                        stroke-width="3"
                        vector-effect="non-scaling-stroke" />
                      <path
                        v-else
                        d="M-11 -2H1L14 32L1 66H-11V-2Z"
                        fill="rgb(var(--chevron-color))"
                        fill-opacity="var(--chevron-alpha)"
                        stroke="var(--bng-orange-500)"
                        stroke-width="3"
                        vector-effect="non-scaling-stroke" />
                    </svg>
                  </svg>
                </div>
              </div>
            </CardGroup>
          </div>
        </template>

        <div class="target-tile trash" v-if="cargo && cargo.throwAwayInfo && totalAvailableAmount">
          <CardGroup   :label="'Trash'" :meta="trashMeta" >
            <div class="to-load" :class="{ 'none-assigned': throwAwayValue == 0 }">
              <div class="loading-controls amount-load">
                <BngButton class="less" :iconLeft="icons.minus" accent="text" @click="less()"> </BngButton>
                <BngSlider
                  bng-no-nav
                  class="slider"
                  :min="0"
                  :max="totalAvailableAmount"
                  :step="1"
                  v-model="throwAwayValue"
                  @valueChanged="updateThrowAwayAmount" />
                <BngButton class="more" :iconLeft="icons.plus" accent="text" @click="more()"> </BngButton>
                <div class="amount">×{{ throwAwayValue }}</div>
              </div>
              <div class="chevron-arrow">
                <svg class="chevron-outer" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <svg class="chevron-inner" viewBox="4 2 12 60" preserveAspectRatio="xMaxYMid slice">
                    <path
                      v-if="throwAwayValue === 0"
                      d="M-11 -2H1L14 32L1 66H-11V-2Z"
                      fill="rgb(var(--chevron-color))"
                      fill-opacity="var(--chevron-alpha)"
                      stroke="rgb(var(--chevron-color))"
                      stroke-width="3"
                      vector-effect="non-scaling-stroke" />
                    <path
                      v-else
                      d="M-11 -2H1L14 32L1 66H-11V-2Z"
                      fill="rgb(var(--chevron-color))"
                      fill-opacity="var(--chevron-alpha)"
                      stroke="var(--bng-add-red-500)"
                      stroke-width="3"
                      vector-effect="non-scaling-stroke" />
                  </svg>
                </svg>
              </div>
            </div>
          </CardGroup>
        </div>

      </div>
      <div class="buttons content">
        <BngButton class="button" v-bng-on-ui-nav:back,menu.asMouse :label="'Cancel'" accent="secondary" @click="cancelClickHandler" />

        <template v-if="cargo && cargo.throwAwayInfo && throwAwayValue > 0">
          <BngButton v-bng-focus-if="true" class="button" v-bng-on-ui-nav:back,menu.asMouse accent="attention" @click="acceptClickHandler">
            {{ throwAway ? "Throw Away" : "Accept" }}
            (<BngUnit :money="-cargo.throwAwayInfo.penalty * throwAwayValue" />)
          </BngButton>
        </template>
        <template v-else>
          <BngButton v-bng-focus-if="true" class="button" v-bng-on-ui-nav:back,menu.asMouse :label="'Accept'" accent="main" @click="acceptClickHandler" />
        </template>
      </div>
    </BngCard>
  </div>
</template>

<script setup>
import { BngButton, ACCENTS, BngCard, BngCardHeading, BngImageTile, BngDivider, BngUnit, icons, BngSlider, BngPillFilters } from "@/common/components/base"
import { onMounted, ref, onUnmounted } from "vue"
import { lua, useBridge } from "@/bridge"
import { vBngDisabled, vBngFocusIf, vBngOnUiNav, vBngClick } from "@/common/directives"
import { useGameContextStore } from "@/services"
import { openConfirmation } from "@/services/popup"
import { useUINavScope, getUINavServiceInstance, UI_EVENTS } from "@/services/uiNav"
// import { default as UINavEvents, UI_EVENTS } from "@/bridge/libs/UINavEvents"
import { $translate } from "@/services/translation"
import { useCargoOverviewStore } from "../../stores/cargoOverviewStore"
import CargoCard from "./CargoCard.vue"
import CardGroup from "./CardGroup.vue"
import CargoInfo from "./CargoInfo.vue"

const cargoOverviewStore = useCargoOverviewStore()
const { events } = useBridge()
const { units } = useBridge()
useUINavScope("cargoLoadPopup")

const emit = defineEmits(["return"])

const props = defineProps({
  cargo: Object,
  storageData: Object,
  throwAway: Boolean,
})

const isFacilityCard = ref(false)
const vehicleFilterModel = ref([])
const vehicleFilterOptions = ref([])
const vehicleFilterChanged = function (filter) {
  for (let target of targetLocations.value) {
    target.hidden = target.containerVehicleInfo && !filter.includes(target.containerVehicleInfo.vehId)
  }
}

let originalTransientMoveCounts = 0
let original_transientMaterialMoveAmount = 0

const card = ref({})
const stepSliderValue = ref(0)
const throwAwayValue = ref(0)
const trashMeta = ref({})

const loadingName = ref("")
const slotsPerItem = ref(0)
const weightPerItem = ref(0)
const moneyRewardPerItem = ref(0)
const targetLocations = ref({})

const less = function (target) {
  if(target) {
    target.loadSliderValue = Math.max(0, target.loadSliderValue - 1)
    updateSliderAmounts(target)
  } else {
    throwAwayValue.value = Math.max(0, throwAwayValue.value - 1)
    updateThrowAwayAmount()
  }
}

const more = function (target) {
  if(target) {
    target.loadSliderValue = Math.min(target.loadSliderMax, target.loadSliderValue + 1)
    updateSliderAmounts(target)
  } else {
    throwAwayValue.value = Math.min(totalAvailableAmount.value, throwAwayValue.value + 1)
    updateThrowAwayAmount()
  }
}

async function openConfirmationPopup(index, button) {
  const res = await openConfirmation("", button.confirmationText || "Are you sure?", [
    { label: $translate.instant("ui.common.yes"), value: true, extras: { default: true } },
    { label: $translate.instant("ui.common.no"), value: false, extras: { accent: ACCENTS.secondary } },
  ])
  if (res) executeButtonAction(index, button)
}

const clickHandler = (index, button, fromController) => {
  if (button.confirmationText && !fromController) {
    openConfirmationPopup(index, button)
    return
  }
  if (!button.confirmationText) executeButtonAction(index, button)
}

const acceptClickHandler = () => {
  let loading = {}
  let loadIdx = 0

  if (props.cargo) {
    for (let id of props.cargo.ids) {
      lua.career_modules_delivery_cargoScreen.clearTransientMoveForCargo(id)
    }
  }
  if (props.storageData) {
    lua.career_modules_delivery_cargoScreen.clearTransientMovesForStorage(props.storageData.material.id)
  }
  if(!props.throwAway) {
    for (let target of targetLocations.value) {
      if (props.cargo) {
        for (let i = 0; i < target.loadSliderValue; i++) {
          const id = props.cargo.ids[loadIdx]
          console.log(loadIdx, id)
          loadIdx++
          cargoOverviewStore.requestMoveCargoToLocation(id, target, true)
        }
      }

      if (props.storageData) {
        lua.career_modules_delivery_cargoScreen.moveMaterialFromUi(props.storageData.material.id, props.cargoType, target.loadSliderValue, target.location)
      }
    }
  }

  if (props.cargo && props.cargo.throwAwayInfo) {
    for (; loadIdx < props.cargo.ids.length; loadIdx++) {
      const id = props.cargo.ids[loadIdx]
      console.log(loadIdx, id, "goes to trash")
      cargoOverviewStore.requestMoveCargoToLocation(id, props.cargo.throwAwayInfo, true)
    }
    lua.career_modules_delivery_cargoScreen.applyTransientMoves()
  }

  cargoOverviewStore.requestCargoDataSimple()

  emit("return", true)
}

const cancelClickHandler = () => {
  if(isFacilityCard.value) {
    card.value.transientMoveCounts = originalTransientMoveCounts
    card.value._transientMaterialMoveAmount = original_transientMaterialMoveAmount
  }
  emit("return", true)
}

const getDisplayAmountHighlightSlots = target => target.usedCargoSlots + target.loadSliderValue * slotsPerItem.value

let totalAvailableAmount = ref(0)
let loadedAmount = ref(0)
const updateSliderAmounts = changedItem => {
  //setup sliders for target locations
  //first, figure out how much is already loaded and how much is still available
  loadedAmount.value = 0
  for (let target of targetLocations.value) {
    if (target.maxAmount) {
      loadedAmount.value += target.loadSliderValue
    }
  }

  let tooMuch = loadedAmount.value - totalAvailableAmount.value
  if(tooMuch > 0) {
    for (let target of targetLocations.value) {
      if (target.maxAmount && target !== changedItem) {
        let before = target.loadSliderValue
        target.loadSliderValue = Math.max(0, target.loadSliderValue - tooMuch)
        let diff = target.loadSliderValue - before
        tooMuch += diff
      }
    }
    loadedAmount.value = totalAvailableAmount.value
  }


  for (let target of targetLocations.value) {
    target.meta.usedCargoSlots = target.usedCargoSlots + target.loadSliderValue * slotsPerItem.value
    target.meta.fillPercentHighlight = target.meta.usedCargoSlots / target.meta.totalCargoSlots
  }

  if(isFacilityCard.value) {
    throwAwayValue.value = totalAvailableAmount.value - loadedAmount.value
    card.value.transientMoveCounts = loadedAmount.value
    card.value._transientMaterialMoveAmount = loadedAmount.value
    trashMeta.value.fillPercent = throwAwayValue.value / totalAvailableAmount.value
  }
}

const updateThrowAwayAmount = () => {
  loadedAmount.value = 0
  for (let target of targetLocations.value) {
    if (target.maxAmount) {
      loadedAmount.value += target.loadSliderValue
    }
  }

  let tooMuch = loadedAmount.value - totalAvailableAmount.value + throwAwayValue.value
    for (let target of targetLocations.value) {
      if (target.maxAmount) {
        let before = target.loadSliderValue
        target.loadSliderValue = Math.min(target.loadSliderMax ,Math.max(0, target.loadSliderValue - tooMuch))
        let diff = target.loadSliderValue - before
        tooMuch += diff
      }
    loadedAmount.value = totalAvailableAmount.value
  }
  updateSliderAmounts()
}

const splittable = ref(false)
const start = () => {
  // UINavEvents.activate()
  getUINavServiceInstance().activate()
  // UINavEvents.clearFilteredEvents()
  getUINavServiceInstance().clearFilteredEvents()
  // UINavEvents.clearFilteredEvents()
  if (props.cargo) {
    loadingName.value = props.cargo.name
    slotsPerItem.value = props.cargo.slots
    weightPerItem.value = props.cargo.weight
    moneyRewardPerItem.value = props.cargo.rewardMoney
    targetLocations.value = props.cargo.targetLocations
    //stepSliderValue.value = Math.max(...props.cargo.targetLocations.filter((x) => x.maxAmount != null).map((x) => x.maxAmount))
    //stepSliderValue.value = Math.min(stepSliderValue.value, props.cargo.ids.length)
    totalAvailableAmount.value = props.cargo.ids.length

    if (props.cargo.splittable) {
      // handle first cargo item like storage
      splittable.value = true
      totalAvailableAmount.value = props.cargo.slots
      slotsPerItem.value = 1
      for (let target of targetLocations.value) {
        target.maxAmount = target.totalCargoSlots - target.usedCargoSlots
      }
    }
    card.value = props.cargo
    isFacilityCard.value = card.value.isFacilityCard
    originalTransientMoveCounts = card.value.transientMoveCounts
  }
  if (props.storageData) {
    console.log(props.storageData)
    loadingName.value = props.storageData.material.name
    slotsPerItem.value = 1
    weightPerItem.value = props.storageData.material.density
    moneyRewardPerItem.value = 1
    targetLocations.value = props.storageData.targetLocations
    //stepSliderValue.value = Math.max(...props.storageData.targetLocations.filter((x) => x.maxAmount != null).map((x) => x.maxAmount))
    totalAvailableAmount.value = props.storageData.storage.storedVolume
    card.value = props.storageData
    isFacilityCard.value = card.value.isFacilityCard
  }

  if (!targetLocations.value.length) targetLocations.value = []
  for (let target of targetLocations.value) {
    target.loadSliderValue = ref(target.selectedAmount)
    target.loadSliderMax = ref(Math.min(target.maxAmount, totalAvailableAmount.value))
    target.meta = {
      type: "container",
      usedCargoSlots: target.usedCargoSlots,
      //usedSlots: target.usedCargoSlots,
      totalCargoSlots: target.totalCargoSlots,
      //availableSlots: target.totalCargoSlots,
      icon: "cardboardBox",
      fillPercent: target.usedCargoSlots / target.totalCargoSlots,
    }
  }
  updateSliderAmounts()

  // create target location filters
  let vehicles = {}
  for (let target of targetLocations.value) {
    if (target.containerVehicleInfo) {
      vehicles[target.containerVehicleInfo.vehId] = target.containerVehicleInfo
    }
  }
  vehicleFilterOptions.value = []
  for (let vehId in vehicles) {
    let veh = vehicles[vehId]
    vehicleFilterOptions.value.push({ value: veh.vehId, label: veh.vehName })
  }
  vehicleFilterOptions.value.sort((a, b) => a.name < b.name)

  vehicleFilterModel.value = []
  for (let vehId in vehicles) {
    vehicleFilterModel.value.push(parseInt(vehId))
  }

  trashMeta.value = {
    type:'trash',
    fillPercent:0
  }
  if (props.throwAway) {
    throwAwayValue.value = totalAvailableAmount.value
    trashMeta.value.fillPercent = 1
  }
}


const kill = () => {
  if (window.bngVue.getCurrentRoute().name == "unknown") getUINavServiceInstance().setFilteredEventsAllExcept(UI_EVENTS.menu, UI_EVENTS.pause, UI_EVENTS.center_cam)
  // UINavEvents.setFilteredEvents.allExcept(UI_EVENTS.menu, UI_EVENTS.pause, UI_EVENTS.center_cam)
}

onMounted(start)
onUnmounted(kill)
</script>

<script>
import { popupPosition, popupContainer } from "@/services/popup"
export default {
  wrapper: {
    fade: true, // everything but popup will fade away (become semi-transparent and desaturated)
    blur: true, // fullscreen in-game blur
    style: popupContainer.default, // can be multiple in array
  },
  position: [popupPosition.center, popupPosition.center], // can be single w/o array
}
</script>

<style scoped lang="scss">
@use "@/styles/modules/mixins" as *;
@use "@/styles/modules/density" as *;

$text-color: white;

.customload-wrapper {
  color: white;
  background-color: rgba(#555, 1);
  max-width: 32em;
  max-height: 90vh;
  display: flex;
  overflow:hidden;
  :deep(.bng-card-wrapper) {
    height:auto;
  }

  .card-container {
    //padding: 0 0.75rem 0.25rem 0.75rem;
    padding: 0.5em 1em;
    flex: 0 0 auto;
  }
  .content {
    display: flex;
    flex-flow: row wrap;
    align-items: stretch;
    align-content: baseline;
    justify-content: center;
    padding: 0 0.5rem 0.5rem 0.5rem;
    flex: 0 0 auto;

    .reward-small {
    }
    .info-value {
      padding-top: 0.4em;
      font-weight: 800;
    }

    .amount {
      display: flex;
      flex-flow: row;
      flex: 1 1 auto;
      padding: 0em 1em;
      .label {
      }
    }
    .slider {
      //margin: 0em 1em
    }

    .recovery-option-button {
      padding: 0;
    }
    .recovery-option-tile {
      //align-items: baseline;
      font-size: 1em;
      background-color: transparent;

      // Setting round corners and focus frame offset for focusable tile
      $f-offset: 0.25rem;
      $rad: $border-rad-1;

      width: 12rem;
      display: flex;
      flex-direction: column;
      min-width: 10rem;
      justify-content: space-between;
      align-items: stretch;
      background-color: rgba(50, 50, 50, 0.6);
      border-radius: $rad;
      padding: 0.5rem;
      transition: background-color ease-in 75ms;
      color: $text-color;
      user-select: none;

      // Modify the focus frame radius and offset based on tile corner radius
      @include modify-focus($rad, $f-offset);

      .contents {
        padding: 0.8rem 0.5rem;
      }
      .name {
      }

      .vertical-divider {
        margin-top: 0;
        margin-bottom: 0;
      }

      .units {
        display: inline-flex;
        align-items: baseline;
      }

      & > .label {
        flex: 1 1 auto;
      }
      .units-icon,
      .recovery-icon {
        margin-right: 0.125em;
        font-size: 1.5em;
      }

      .recovery-icon {
        font-size: 2em;
      }

      .units-icon {
        transform: translateY(0.05em);
      }

      :deep(.info-item) {
        padding: 0.5rem;
        .icon {
          width: auto;
          height: auto;
        }
      }
    }
  }
  .button {
    //TODO: this causes overflow
    //width:100%;
    //max-width:100%;
    flex: 1 1 auto;
  }
  .target-grid {
    display: flex;
    flex-flow: row wrap;
    padding: 0 1em 0em 1em;
    flex: 1 1 auto;
    overflow-y:scroll;
    margin-bottom:1em;

    .target-tile {
      flex: 1 1 auto;
      .loading-controls {
        overflow: hidden;
        display: flex;
        .less {
          margin-right: 1rem;
        }
        .slider {
        }
        .more {
          margin-left: 1rem;
        }
        .amount {
          min-width: 5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }
      }
    }
    .trash {
      .to-load {
        :deep(.amount-load) {
          background: linear-gradient(90deg, rgba(var(--bng-add-red-500-rgb), 0.5) 0%, rgba(var(--bng-orange-500-rgb), 0) 90%);
        background-color: rgba(var(--chevron-color), var(--chevron-alpha));
        }
      }
    }
  }
}

.to-load {
  color: white;
  position: relative;

  display: flex;
  align-items: stretch;

  --chevron-color: var(--bng-cool-gray-700-rgb);
  --chevron-alpha: 1;

  overflow: hidden;

  padding-right: 1.25rem;

  :deep(.amount-load) {
    width: 100%;
    display: flex;
    align-items: baseline;
    line-height: 1.5rem;
    position: relative;
    background: linear-gradient(90deg, rgba(var(--bng-orange-500-rgb), 0.5) 0%, rgba(var(--bng-orange-500-rgb), 0) 90%);
    --paddings: 0.125em 0 0.225em 0.5em;
    background-color: rgba(var(--chevron-color), var(--chevron-alpha));
  }

  .chevron-arrow {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    width: 1.25rem;
    // height: 2rem;
    overflow: hidden;
    .chevron-outer {
      overflow: hidden;
    }
  }
}

.none-assigned {
  :deep(.amount-load) {
    background: none !important;
    --paddings: 0.125em 0 0.225em 0.5em;
    background-color: rgba(var(--chevron-color), var(--chevron-alpha)) !important;
    color: gray;
  }
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

.slots {
  float: left;
  margin-top: 0.5em;
  //padding-left: 1em;
}
.slotsProgressBar {
  //padding-left: 0.5em;
}
.noSpaceLabel {
  padding-left: 1em;
  margin-top: 0.5em;
}

.slotOverview {
  margin-left: 0.5em;
}

.slotsProgressbarBackground {
  //padding-left: 1em;
  display: flex;
  border-radius: var(--bng-corners-1);
  width: 100%;
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
</style>
