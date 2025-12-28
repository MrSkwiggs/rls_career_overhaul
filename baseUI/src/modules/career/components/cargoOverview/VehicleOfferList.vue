<template>
  <BngCardHeading type="ribbon" class="cardHeading">
    {{ displayedHeader }}
    <BngButton
      class="headingButton"
      v-if="facilityId"
      :disabled="!cargoOverviewStore.newCargoAvailable"
      v-bng-sound-class="'bng_click_hover_generic'"
      @click="updateCargoDataAll">
      Refresh
    </BngButton>
  </BngCardHeading>

  <div class="tableWrapper">
    <table class="innerCargoTable">
      <thead>
        <tr class="headings">
          <th>Thumb</th>
          <th class="padLeft">Name</th>
          <th>Task</th>
          <th class="numberColumn">Distance</th>
          <th class="numberColumn">Reward</th>
          <th v-if="offerType != OFFER_TYPE.accepted">Availability</th>
          <th></th>
          <th class="tableButtons"></th>
        </tr>
      </thead>
      <tbody>
        <tr :class="getOfferRowClass(offer)" v-for="offer in sortedOffers" @mouseover="hoverOffer(offer)" @mouseleave="hoverOffer()">
          <td><AspectRatio class="thumbnail" :external-image="offer.thumbnail" /></td>
          <td class="padLeft">
            {{ offer.vehBrand }} {{ offer.vehName }}
            <div v-if="offer.vehMileage > 0">Mileage: {{ units.buildString("length", offer.vehMileage, 0) }}</div>
          </td>
          <td>{{ offer.task }}</td>
          <td class="numberColumn">{{ units.buildString("length", offer.distance, 0) }}</td>
          <td class="numberColumn">
            <div v-for="(amount, rewardType) in offer.rewards">
              <BngUnit class="reward-small" v-if="rewardType === 'money'" :money="amount" />
            </div>
          </td>

          <td v-if="offerType != OFFER_TYPE.accepted">
            <div class="progressbar-wrapper">
              <BngProgressBar
                v-if="offer.remainingOfferTime > 0"
                :value="offer.remainingOfferTime > 0 ? Math.min(offer.remainingOfferTime, 120) / 120 : 0"
                :max="1"
                :min="0"
                :valueLabelFormat="getNiceTime(offer.remainingOfferTime)" />
              <BngProgressBar v-else :value="0" :max="1" :min="0" :valueLabelFormat="'Expired'" />
            </div>
          </td>
          <td></td>
          <td>
            <BngButton
              v-if="offer.locked && offerType != OFFER_TYPE.accepted"
              class="cargoButton"
              v-bng-sound-class="'bng_click_hover_generic'"
              :accent="ACCENTS.secondary"
              :disabled="true">
              <BngIcon class="icon" :color="'#ffffff'" :type="icons.lockClosed" />
              <BngIcon class="icon" :type="icons[offer.lockedReason.icon]" />
              lvl {{ offer.lockedReason.level }}
            </BngButton>
            <BngButton
              v-else-if="!offer.enabled && offerType != OFFER_TYPE.accepted"
              class="cargoButton"
              v-bng-sound-class="'bng_click_hover_generic'"
              :accent="ACCENTS.secondary"
              :disabled="true">
              {{ offer.disableReason }}
            </BngButton>
            <BngButton
              v-else-if="offer.enabled && offerType != OFFER_TYPE.accepted"
              class="cargoButton"
              v-bng-sound-class="'bng_click_hover_generic'"
              :accent="ACCENTS.secondary"
              :disabled="offer.remainingOfferTime <= 0"
              @click="askForLoanerScreen ? confirmOpenLoanerScreen(offer.id) : spawnOfferAndClose(offer.id)">
              Accept
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
import { computed } from "vue"
import { lua, useBridge } from "@/bridge"
import { BngButton, ACCENTS, BngUnit, BngCardHeading, BngProgressBar, BngIcon, icons } from "@/common/components/base"
import { useCargoOverviewStore } from "../../stores/cargoOverviewStore"
import { vBngSoundClass } from "@/common/directives"
import { AspectRatio } from "@/common/components/utility"
import { openConfirmation } from "@/services/popup"
import { $translate } from "@/services/translation"

const { units } = useBridge()

const props = defineProps({
  sortedOffers: Array,
  header: String,
  offerType: String,
  facilityId: String,
  parkingSpotPath: String,
  askForLoanerScreen: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const emit = defineEmits(["openLoanerScreen"])

const cargoOverviewStore = useCargoOverviewStore()

const displayedHeader = computed(() => props.header || OFFER_TYPE_HEADERS[props.offerType] || DEFAULT_OFFER_TYPE_HEADER)

const updateCargoDataAll = () => cargoOverviewStore.requestCargoData(props.facilityId, props.parkingSpotPath)

const getOfferRowClass = offer => ({
  [isCargoDisabled(offer) ? "cargoRowDisabled" : "cargoRow"]: true,
  slidingText: offer.showNewTimer,
  ...(cargoOverviewStore.cargoHighlighted && {
    "highlight-hidden-row": !isCargoDisabled(offer) && !offer.highlight,
    "highlight-shown-row": offer.highlight,
  }),
})

const isCargoDisabled = offer => offer.remainingOfferTime <= 0 || !offer.enabled

const getNiceTime = timeInSeconds => ~~(timeInSeconds / 60) + (timeInSeconds >= 120 ? " min" : ` : ${pad(~~timeInSeconds % 60)}`)

const spawnOfferAndClose = offerId => {
  lua.career_modules_delivery_cargoScreen.commitDeliveryConfiguration()
  lua.career_modules_delivery_cargoScreen.exitCargoOverviewScreen()
  lua.career_modules_delivery_cargoScreen.spawnOffer(offerId, undefined)
}

const spawnOffer = offerId => {
  lua.career_modules_delivery_cargoScreen.commitDeliveryConfiguration()
  lua.career_modules_delivery_cargoScreen.spawnOffer(offerId, false)
}

const confirmOpenLoanerScreen = async offerId => {
  const res = await openConfirmation("", `Do you want to loan a vehicle for this delivery?`, [
    { label: $translate.instant("ui.common.yes"), value: true, extras: { default: true } },
    { label: $translate.instant("ui.common.no"), value: false, extras: { accent: ACCENTS.secondary } },
  ])

  if (res) {
    spawnOffer(offerId)
    emit("openLoanerScreen")
  } else {
    spawnOfferAndClose(offerId)
  }
}

const hoverOffer = offer => {
  if (offer && offer.remainingOfferTime) {
    lua.career_modules_delivery_cargoScreen.showVehicleOfferRoutePreview(offer.id)
  } else {
    lua.career_modules_delivery_cargoScreen.showVehicleOfferRoutePreview(undefined)
  }
}

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
}
</style>
