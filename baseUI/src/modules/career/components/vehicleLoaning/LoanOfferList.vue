<template>
  <BngCardHeading type="ribbon" class="cardHeading">
    {{ displayedHeader }}
  </BngCardHeading>

  <div class="tableWrapper">
    <table class="innerCargoTable">
      <thead>
        <tr class="headings">
          <th></th>
          <th class="padLeft">Name</th>
          <th class="padLeft">Reputation Level</th>
          <th class="tableButtons"></th>
        </tr>
      </thead>
      <tbody>
        <tr class="cargoRow" v-for="offer in cargoOverviewStore.loanerOffers">
          <td><AspectRatio class="thumbnail" :external-image="offer.thumbnail" /></td>
          <td class="padLeft">
            {{ offer.name }}
            <div v-if="offer.mileage > 0">Mileage: {{ units.buildString("length", offer.mileage, 0) }}</div>
          </td>
          <td class="padLeft">
            {{ offer.reputationLvl }}
          </td>
          <td>
            <!-- <BngButton
              v-if="offer.enabled"
              class="cargoButton"
              v-bng-sound-class="'bng_click_hover_generic'"
              :accent="ACCENTS.secondary"
              @click="spawnOffer(offer)">
              Accept
            </BngButton>
            <BngTooltip v-else position="right" :text="offer.disableReason">
              <BngButton :disabled="true" :accent="ACCENTS.secondary">Accept</BngButton>
            </BngTooltip> -->
            <div v-bng-tooltip:right="!offer.enabled ? offer.disableReason : undefined">
              <BngButton
                v-bng-sound-class="'bng_click_hover_generic'"
                class="cargoButton"
                :accent="ACCENTS.secondary"
                :disabled="!offer.enabled"
                @click="spawnOffer(offer)"
                >Accept</BngButton
              >
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <BngCardHeading type="ribbon" class="cardHeading"> Loaned Vehicles at {{ facility.name }} </BngCardHeading>
  <div class="tableWrapper">
    <table class="innerCargoTable">
      <thead>
        <tr class="headings">
          <th></th>
          <th class="padLeft">Name</th>
          <th class="tableButtons"></th>
        </tr>
      </thead>
      <tbody>
        <tr class="cargoRow" v-for="vehicle in returnableVehicles">
          <td><AspectRatio class="thumbnail" :external-image="vehicle.thumbnail" /></td>
          <td class="padLeft">
            {{ vehicle.niceName }}
          </td>
          <td>
            <BngButton class="cargoButton" v-bng-sound-class="'bng_click_hover_generic'" :accent="ACCENTS.secondary" @click="returnVehicle(vehicle.id)">
              Return
            </BngButton>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
const OFFER_TYPE = {
    accepted: "Accepted",
  },
  OFFER_TYPE_HEADERS = {
    Vehicle: "Vehicle Offers",
    Trailer: "Trailer Offers",
  },
  DEFAULT_OFFER_TYPE_HEADER = "Offers"
</script>

<script setup>
import { computed, onMounted, ref } from "vue"
import { lua, useBridge } from "@/bridge"
import { BngButton, ACCENTS, BngUnit, BngCardHeading, BngProgressBar, BngIcon, icons } from "@/common/components/base"
import { useCargoOverviewStore } from "../../stores/cargoOverviewStore"
import { vBngSoundClass, vBngTooltip } from "@/common/directives"
import { AspectRatio } from "@/common/components/utility"

const { units } = useBridge()

const returnableVehicles = ref([])
const cargoOverviewStore = useCargoOverviewStore()

const props = defineProps({
  header: String,
  offerType: String,
  facility: Object,
  parkingSpotPath: String,
})

const displayedHeader = computed(() => props.header || OFFER_TYPE_HEADERS[props.offerType] || DEFAULT_OFFER_TYPE_HEADER)

const spawnOffer = offer => {
  lua.career_modules_delivery_cargoScreen.exitCargoOverviewScreen()
  let loanInfo = { sourceFacility: { type: "deliveryProvider", id: props.facility.id }, loanType: "work" }
  lua.career_modules_loanerVehicles.spawnAndLoanVehicle(offer, loanInfo)
}

const start = () => {
  lua.career_modules_loanerVehicles.getLoanedVehiclesByOrg(props.facility.organization.id).then(vehicles => {
    returnableVehicles.value = vehicles
  })
}

const returnVehicle = vehId => {
  lua.career_modules_loanerVehicles.returnVehicle(vehId).then(() => {
    start()
    cargoOverviewStore.requestCargoData(props.facility.id, props.parkingSpotPath)
  })
}

onMounted(start)

const pad = n => ("" + n).padStart(2, 0)
</script>

<style scoped lang="scss">
.tableWrapper {
  max-height: 25vh;
  overflow-y: auto;
}

.padLeft {
  padding-left: 0.5em;
}

.innerCargoTable {
  -webkit-border-horizontal-spacing: 0px;
  -webkit-border-vertical-spacing: 2px;
  text-align: left;
  width: 100%;
  flex: 1 1 auto;
  // overflow: hidden;
  & .headings {
    & th {
      position: sticky;
      top: 0;
      background-color: rgba(var(--bng-cool-gray-800-rgb), 0.9);
      z-index: 1;
      padding: 0.1em 0.2em 0em;
    }
  }
  & th,
  & td {
    // padding-right: 0.75em;
    background-color: rgba(var(--bng-cool-gray-800-rgb), 0.5);
    padding: 0em 0.2em 0em;
    &.tableButtons {
      // display: flex;
      // flex-flow: row nowrap;
      //   text-align: end;
      //   & :deep(.targetDropdown) {
      //     text-align: center;
      //     * {
      //       text-align: start;
      //     }
      //   }
      .buttonsWrapper {
        display: flex;
        flex-flow: row wrap;
        min-width: 8em;
        max-width: 18em;
        align-items: baseline;
        justify-content: flex-end;
      }
    }
  }
}

.reward-small {
  font-size: 0.875rem !important;
}

.modifier {
  float: left;
  padding-left: 0.2em;
}

.paddedTime {
  //align-items: baseline;
  margin-top: 0.25em;
  float: right;
  color: rgb(255, 50, 35);
}

.healthDamaged {
  color: rgb(255, 255, 35);
}

.healthDestroyed {
  color: rgb(255, 50, 35);
}

.headingButton {
  font-size: 0.875rem;
  float: right;
}

@keyframes pulsing {
  50% {
    color: rgb(255, 251, 0);
  }
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(0%);
  }
}

.slidingText {
  animation: pulsing 1s steps(1) infinite, slideIn 0.7s linear forwards;
}

.slot {
  float: left;
  width: 5px;
  height: 1em;
  margin: 0.2em;
  background-color: rgb(255, 102, 0);
}

.cargoRow {
  td {
    background-color: rgba(var(--bng-cool-gray-700-rgb), 0.25);
  }
}

.cargoRowDisabled {
  td {
    background-color: rgba(var(--bng-cool-gray-700-rgb), 0.6);
    color: rgba(var(--bng-cool-gray-400-rgb), 1);
  }
}

.targetDropdown {
  text-align: center;
}

.numberColumn {
  text-align: center;
}

.cargoButton {
  min-height: 0;
  //height: 1.6em;
  //padding: 0.1em 0.1em;
  white-space: pre-wrap;
}

:deep(.text-icon) {
  min-width: 1em;
  min-height: 1em;
  display: inline-block;
  transform: translateY(0.125em);
  // width: 1.5em;
  // height: 1.5em;
  font-size: 1.5rem !important;
}

:deep(.icon) {
  color: rgba(255, 255, 255, 1) !important;
}

.progressbar-wrapper {
  position: relative;
  display: flex;
  flex-direction: row;

  :deep(.bng-progress-bar) {
    width: 5.1em;
    border-color: rgba(0, 0, 0, 0.5);
    border-style: solid;
    border-radius: var(--bng-corners-1);
  }
  :deep(.bng-progress-bar .progress-bar) {
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 0;
  }
  :deep(.bng-progress-bar .progress-bar .progress-fill) {
    background-color: rgba(104, 103, 103, 0.877);
    border-radius: var(--bng-corners-1);
  }
  :deep(.bng-progress-bar .progress-bar .info) {
    font-size: 1rem;
    text-align: center;
    font-weight: 500;
    padding: 0.2em 0.2em;
    display: block;
  }
}

.highlight-hidden-location {
  color: rgba(var(--bng-cool-gray-400-rgb), 1);
}

.highlight-shown-location {
  color: #ff6600 !important;
  font-weight: bold;
}

.highlight-hidden-row {
  td {
    //background-color: rgba(var(--bng-cool-gray-700-rgb), 0.8);
  }
}

.highlight-shown-row {
  td {
    background-color: #ff882288 !important;
  }
}

.thumbnail {
  border-radius: var(--bng-corners-2);
  width: 5em;
}
</style>
