<template>
  <table class="innerCargoTable">
    <thead>
      <tr class="headings">
        <th name-pad v-if="cargoAttributes.name">Name</th>
        <th v-if="cargoAttributes.offerTime">Availability</th>
        <th v-if="cargoAttributes.origin">Origin</th>
        <th v-if="cargoAttributes.location">Location</th>
        <th class="numberColumn" v-if="cargoAttributes.weight">Weight</th>
        <th class="numberColumn" v-if="cargoAttributes.reward">Reward</th>
        <th v-if="cargoAttributes.modifiers"></th>
        <th v-if="cargoAttributes.destination">Destination</th>
        <th class="numberColumn" v-if="cargoAttributes.distance">Distance</th>
        <th class="numberColumn" v-if="cargoAttributes.slots">Slots</th>
        <th class="numberColumn" v-if="cargoAttributes.quantity">Qty</th>
        <th v-if="cargoAttributes.move || cargoAttributes.route || cargoAttributes.routeOrigin" class="tableButtons"></th>
        <!-- <th v-if="cargoAttributes.route"></th>
        <th v-if="cargoAttributes.routeOrigin"></th> -->
      </tr>
    </thead>
    <tbody>
      <tr :class="getCargoRowClass(cargo)" v-for="cargo in sortedCargo" @mouseover="onCargoHovered(cargo)" @mouseleave="onCargoHovered()">
        <td name-pad v-if="cargoAttributes.name">{{ cargo.name }}</td>
        <td v-if="cargoAttributes.offerTime">
          <div class="progressbar-wrapper">
            <BngProgressBar
              v-if="isFacility && cargo.remainingOfferTime > 0"
              :value="cargo.remainingOfferTime > 0 ? Math.min(cargo.remainingOfferTime, 120) / 120 : 0"
              :max="1"
              :min="0"
              :valueLabelFormat="getNiceTime(cargo.remainingOfferTime)" />
            <BngProgressBar v-else :value="0" :max="1" :min="0" :valueLabelFormat="'Expired'" />
          </div>
        </td>
        <td class="numberColumn" v-if="cargoAttributes.weight">{{ units.buildString("weight", cargo.weight, 0) }}</td>
        <td v-if="cargoAttributes.origin" :class="getCargoLocationClass(cargo)">{{ cargo.originName }}</td>
        <td v-if="cargoAttributes.location">{{ cargo.locationName }}</td>
        <td class="numberColumn" v-if="cargoAttributes.reward">
          <div v-for="(amount, rewardType) in cargo.rewards">
            <BngUnit class="reward-small" v-if="rewardType === 'money'" :money="amount" />
          </div>
        </td>

        <td style="" v-if="cargoAttributes.modifiers">
          <div class="cargo-modifiers">
            <div v-for="modifier in cargo.modifiers">
              <!-- timed cargo -->
              <div class="modifier" v-if="modifier.type == 'timed'">
                <BngIcon class="text-icon" :type="icons.stopwatchSectionOutlinedStart" />
                <!--
                <span v-if="modifier.data.remainingDeliveryTime > 0">
                  {{ getNiceTime(modifier.data.remainingDeliveryTime) }}
                </span>
                <div v-else class="paddedTime">
                  <span v-if="modifier.data.remainingPaddingTime > 0"> {{ getNiceTime(modifier.data.remainingPaddingTime) }} Delayed </span>
                  <span v-else>Late</span>
                </div>
              -->
              </div>

              <div class="modifier" v-else-if="modifier.type == 'supplies'">(Supplies)</div>
              <div class="modifier" v-else-if="modifier.type == 'large'">(Large)</div>
              <div class="modifier" v-else-if="modifier.type == 'precious'">(Precious)</div>
              <div class="modifier" v-else-if="modifier.type == 'post'">(Post)</div>
            </div>
          </div>
        </td>

        <td v-if="cargoAttributes.destination" :class="getCargoLocationClass(cargo)">{{ cargo.destinationName }}</td>
        <td class="numberColumn" v-if="cargoAttributes.distance">{{ units.buildString("length", cargo.distance, 0) }}</td>

        <td class="numberColumn" v-if="cargoAttributes.slots">{{ cargo.slots }}</td>

        <td class="numberColumn" v-if="cargoAttributes.quantity">
          <template v-if="cargo.transientMoveCounts == 0">
            {{ cargo.ids.length }}
          </template>
          <template v-else>
            <div style="color:orange">
            {{cargo.transientMoveCounts}} / {{ cargo.ids.length }}
            </div>
          </template>
        </td>

        <td v-if="cargoAttributes.move || cargoAttributes.route || cargoAttributes.routeOrigin" class="tableButtons">
          <div class="buttonsWrapper">
            <BngButton v-if="cargo.locked" class="cargoButton" v-bng-sound-class="'bng_click_hover_generic'" :accent="ACCENTS.secondary" :disabled="true">
              <BngIcon class="icon" :color="'#ffffff'" :type="icons.lockClosed" />
              <BngIcon class="icon" :type="icons[cargo.lockedReason.icon]" />
              lvl {{ cargo.lockedReason.level }}
            </BngButton>
            <BngButton
              v-else-if="cargoOverviewStore.dropDownData[cargo.ids.at(-1)].items.length < 1 || (isFacility && !cargo.enabled)"
              class="cargoButton"
              v-bng-sound-class="'bng_click_hover_generic'"
              :accent="ACCENTS.secondary"
              :disabled="true">
              {{ isFacility ? (cargo.remainingOfferTime <= 0 ? "Expired" : cargo.disableReason) : "Load" }}
            </BngButton>
            <BngButton
              v-else-if="isFacility && cargoOverviewStore.dropDownData[cargo.ids.at(-1)].items.length > 0"
              class="cargoButton"
              v-bng-sound-class="'bng_click_hover_generic'"
              @click="requestMoveCargoToLocation(cargo.ids.at(-1), cargoOverviewStore.dropDownData[cargo.ids.at(-1)].items[0].value)"
              :accent="ACCENTS.secondary"
              :disabled="isCargoDisabled(cargo)">
              <div v-if="isFacility">Auto Load</div>
              <!--<div v-else>
                {{ cargoOverviewStore.dropDownData[cargo.ids.at(-1)].items[0].label }}
              </div>-->
            </BngButton>

            <BngDropdown
              v-else
              class="targetDropdown"
              bng-nav-item
              v-model="cargoOverviewStore.dropDownData[cargo.ids.at(-1)].dropDownValue"
              :items="cargoOverviewStore.dropDownData[cargo.ids.at(-1)].items"
              :disabled="cargoOverviewStore.dropDownData[cargo.ids.at(-1)].disabled || isCargoDisabled(cargo)" />
            <BngButton
              v-if="cargoAttributes.route"
              :accent="ACCENTS.secondary"
              class="cargoButton"
              v-bng-sound-class="'bng_click_hover_generic'"
              @click="setCargoRoute(cargo.id, false)">
              Set Route
            </BngButton>
            <BngButton
              v-else-if="cargoAttributes.routeOrigin"
              :accent="ACCENTS.secondary"
              class="cargoButton"
              v-bng-sound-class="'bng_click_hover_generic'"
              @click="setCargoRoute(cargo.id, true)">
              Set Route
            </BngButton>
            <BngButton
              class="headingButton"
              v-bng-sound-class="'bng_click_hover_generic'"
              @click="loadCargoCustom(cargo)"
              :disabled="isFacility && (!cargo.enabled || cargo.remainingOfferTime <= 0)">
              Custom Load
            </BngButton>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { lua, useBridge } from "@/bridge"
import { BngButton, ACCENTS, BngIcon, BngDropdown, BngUnit, icons, BngProgressBar } from "@/common/components/base"
import { useCargoOverviewStore } from "../../stores/cargoOverviewStore"
import { vBngSoundClass } from "@/common/directives"

const emit = defineEmits(["cargoHovered", "loadCargoCustom"])

const props = defineProps({
  cargoAttributes: Object,
  isFacility: Boolean,
  sortedCargo: Array,
})

const cargoOverviewStore = useCargoOverviewStore()

const { units } = useBridge()

const getCargoRowClass = (cargo) => ({
  [isCargoDisabled(cargo) ? "cargoRowDisabled" : "cargoRow"]: true,
  "highlight-transient-row": cargo.transientMove,
  slidingText: cargo.showNewTimer,
  ...(cargoOverviewStore.cargoHighlighted && {
    "highlight-hidden-row": !isCargoDisabled(cargo) && !cargo.highlight,
    "highlight-shown-row": cargo.highlight,
  }),
});


const getCargoLocationClass = cargo => ({
  ...(cargoOverviewStore.cargoHighlighted && {
    ["highlight-hidden-location"]: !isCargoDisabled(cargo) && !cargo.highlight,
    ["highlight-shown-location"]: cargo.highlight,
  }),
})

const isCargoDisabled = cargo => {
  if (!props.isFacility) return false
  if (cargoOverviewStore.cargoData.facility && cargoOverviewStore.cargoData.facility.disabled) return true
  return cargo.remainingOfferTime <= 0 || !cargo.enabled
}

const setCargoRoute = (cargoId, origin) => {
  lua.career_modules_delivery_cargoScreen.setCargoRoute(cargoId, origin)
}

const getNiceTime = timeInSeconds => ~~(timeInSeconds / 60) + (timeInSeconds >= 120 ? " min" : ` : ${pad(~~timeInSeconds % 60)}`)

const niceHealth = hp => ~~hp

const getClassForHealth = hp => {
  if (hp >= 90) return ""
  if (hp > 0) return "healthDamaged"
  return "healthDestroyed"
}

const requestMoveCargoToLocation = (cargoId, moveData) => cargoOverviewStore.requestMoveCargoToLocation(cargoId, moveData)

const onCargoHovered = cargo => emit("cargoHovered", cargo || undefined)
const loadCargoCustom = cargo => emit("loadCargoCustom", cargo || undefined)

const pad = n => ("" + n).padStart(2, 0)
</script>

<style scoped lang="scss">
.innerCargoTable {
  -webkit-border-horizontal-spacing: 0px;
  -webkit-border-vertical-spacing: 2px;
  text-align: left;
  width: 100%;
  flex: 1 1 auto;
  // overflow: hidden;
  [name-pad] {
    padding-left: 0.5em !important;
  }
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
    &.cargo-modifiers {
      display: flex;
    }
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
        min-width: 6em;
        //max-width: 18em;
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

.highlight-transient-row {
  td {
    background-color: rgb(255, 172, 100, 0.4) !important;
  }
}
</style>
