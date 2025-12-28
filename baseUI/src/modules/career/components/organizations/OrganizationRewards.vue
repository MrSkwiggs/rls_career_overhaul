<template>
  <div>
    <BngCard class="rewardCard">
      <table class="innerCargoTable">
        <thead>
          <tr class="headings">
            <th class="padLeft">Level</th>
            <th class="padLeft">Status</th>
            <th v-if="organization.offersDeliveries" class="padLeft">Delivery Reward Bonus</th>
            <th v-if="organization.loanableVehicles" class="padLeft">Loaner Cut</th>
            <th v-if="organization.hasUnlocks" class="padLeft">Unlocks</th>
          </tr>
        </thead>
        <tbody>
          <tr class="cargoRow" :style="getRowStyle(levelData)" v-for="levelData in organization.reputationLevels.slice().reverse()">
            <td class="padLeft">{{ levelData.level }}</td>
            <td class="padLeft"> {{ levelData.label }}</td>
            <td v-if="organization.offersDeliveries" class="padLeft"> {{ ((levelData.deliveryBonus.value-1) * 100).toFixed(0) }}%</td>
            <td v-if="organization.loanableVehicles" class="padLeft">  {{ levelData.loanerCut.value * 100 }}%</td>
            <td v-if="organization.hasUnlocks" class="padLeft">
              <div v-if="levelData.unlocks && levelData.unlocks.length">
                {{ levelData.unlocks[0].label }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </BngCard>
  </div>
</template>

<script setup>
import { BngIcon,icons } from "@/common/components/base"

const levelColors = {
  "-1": [0, 15, 30],
  "0": [40, 15, 30],
  "1": [40, 15, 30],
  "2": [125, 15, 30],
  "3": [125, 15, 30],
}

const getRowStyle = levelData => {
  let color = levelColors[levelData.level]
  return "background-color: hsla(" + color[0] + "," + (levelData.level == props.organization.reputation.level ? 80 : color[1]) + "%," + (levelData.level == props.organization.reputation.level ? 50 : color[2]) + "%, 1);"
}

const props = defineProps({
  organization: Object,
})

</script>

<style scoped lang="scss">

.cargoRow {
}

.rewardCard {
  //width: 20em;
}

.padLeft {
  text-align: center;
}

.innerCargoTable {
  background-color: rgb(255, 255, 255);
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
      background-color: rgba(var(--bng-cool-gray-800-rgb), 1);
      z-index: 1;
      padding: 0.1em 0.5em 0em;
    }
  }
  & th,
  & td {
    // padding-right: 0.75em;
    background-color: rgba(var(--bng-cool-gray-800-rgb), 0);
    padding: 0em 0.2em 0em;
  }
}
.condensed {
  display: flex;
  flex-flow: column;
  position: relative;
  border-radius: var(--bng-corners-2);
  overflow: hidden;

  background-color: rgb(255, 255, 255);

  &:hover {
    background-color: rgba(255, 255, 255, 0.4);
  }

  .complete {
    z-index: 15;
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 0.22em;
    //background-color: rgba(0,0,0,0.4);
  }

  > .claimable {
    cursor: pointer;
  }

  > .animated-border {
    z-index: 10;
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 0.22em;
    border-radius: var(--bng-corners-2);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;

    &::before {
      position: absolute;
      content: "";
      display: block;
      top: -100%;
      left: -100%;
      right: -100%;
      bottom: -100%;
      background: linear-gradient(#e6cf43, #ed3823, #e6cf43, #ff6600, #e6cf43);
      animation: rotate-gradient linear 2s infinite;
    }
  }

  :deep(.image) {
    //background-image: url('/levels/west_coast_usa/spawns_quarry.jpg') !important;
    align-self: stretch;
    // .icon {
    //   width: 2rem;
    //   height: 2rem;
    // }

    .glyph {
      font-size: 6em;
      &.small {
        font-size: 2.5em;
      }
    }

    :deep(*) > .icon {
      width: 2rem;
      height: 2rem;
    }
    overflow-y: hidden;
    // height: 6em;

    .step {
      position: absolute;
      top: 0;
      right: 0.5em;
      padding: 0.25em 0.5em;
      background-color: rgba(var(--bng-cool-gray-900-rgb), 0.9);
      border-radius: 0 0 var(--bng-corners-2) var(--bng-corners-2);
    }
  }

  .content {
    flex: 1 0 auto;
    padding: 0.75rem 0.75rem 0.75rem 0.75rem;

    .heading {
      grid-area: 1 / 1 / 1 / -1;
      font-weight: 800;
    }

    .middle-content {
      grid-column-start: 1;
      grid-column-end: -1;
    }

    color: white;
    display: grid;
    gap: 0.5rem 0.2rem;
    grid-template:
      "heading heading heading heading" minmax(2rem, auto)
      "content content content content" 1fr
      "progress progress progress progress" minmax(2rem, auto) /
      1fr 1fr 1fr 1fr;
    //align-content: space-between;

    .progress {
      grid-area: auto / 1 / auto / -1;
      :deep(.progress-bar){
        overflow: hidden;
        border-radius: var(--bng-corners-1);
      }
    }
  }
}

.complete-badge {
  position: absolute;
  top: 0;
  left: 0em;
  padding: 0.3em 0.5em;
  background-color: rgba(var(--bng-cool-gray-900-rgb), 0.6);
  border-radius: 0 0 var(--bng-corners-2);
}

@keyframes rotate-gradient {
  to {
    transform: rotate(360deg);
  }
}
</style>
