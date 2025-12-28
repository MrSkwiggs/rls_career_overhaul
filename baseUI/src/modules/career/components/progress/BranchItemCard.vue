<template>
  <BngCard bng-nav-item @click="goToBigMap" :class="{ 'card-wrapper': true, 'click-startable': mission && mission.startable }" v-bng-disabled="isSkeleton">
    <div class="condensed">
      <AspectRatio 
        v-if="!isSkeleton" 
        class="image" 
        :style="{ 
          backgroundImage: 'url(' + mission.preview + ')', 
          maskImage: 'linear-gradient(to left, rgba(0, 0, 0, 0.75) 10%, rgba(0, 0, 0, 0.0) 100%)', 
          
        }">
      </AspectRatio>
      <BngIcon
        class="mission-icon"
        :type="isSkeleton ? icons[Object.values(MISSION_UNIT_TYPES)[0]] : icons[MISSION_UNIT_TYPES[mission.icon]] || icons[mission.icon]"
        :color="isSkeleton || !mission.startable ? 'var(--bng-cool-gray-200)' : '#fff'" />

      <div class="main-info">
        <div v-if="!isSkeleton && !mission.startable" class="locked-background">
          <BngIcon class="glyph-locked" :type="icons.lockClosed" :color="'#fff'" />
        </div>
        <div v-if="!isSkeleton" class="heading">
          {{ $tt(mission.label) }}
        </div>
        <!-- mission -->
        <div v-if="!isSkeleton && !isFacility" class="rewards">
          <div class="mission-stars">
            <BngMainStars
              v-if="mission.formattedProgress.unlockedStars"
              :unlocked-stars="mission.formattedProgress.unlockedStars.defaultUnlockedStarCount"
              :total-stars="mission.formattedProgress.unlockedStars.totalDefaultStarCount"
              class="main-stars" />
            <BngMainStars
              v-if="mission.formattedProgress.unlockedStars && mission.formattedProgress.unlockedStars.totalBonusStarCount > 0"
              :unlocked-stars="mission.formattedProgress.unlockedStars.bonusUnlockedStarCount"
              :total-stars="mission.formattedProgress.unlockedStars.totalBonusStarCount"
              class="bonus-stars" />
          </div>
        </div>

        <!-- TODO - should this whole message only be displayed if game controller is plugged in? -->
        <!--
        <div v-if="!isSkeleton && mission && mission.startable" class="go-to-bigmap-label">
          Press <BngBinding ui-event="ok" deviceMask="xinput" /> to view in Map
        </div>
        -->
      </div>
    </div>
  </BngCard>
</template>

<script>
const MISSION_UNIT_TYPES = {
  mission_timeTrials_triangle: "stopwatchSectionOutlinedEnd",
  mission_rockcrawling01_triangle: "rockCrawling01",
  mission_drift_triangle: "drift01",
  mission_airace01_triangle: "AIRace",
  mission_cannon_triangle: "cannon",
  mission_barrelknocker01_triangle: "barrelKnocker01",
  mission_precisionParking_triangle: "parking",
  mission_longjump_triangle: "jump",
  mission_copChase_triangle: "carsChase02",
  mission_evade_triangle: "evade",
}
</script>

<script setup>
import { BngMainStars, BngIcon, icons, BngCard, BngBinding } from "@/common/components/base"
import { vBngDisabled } from "@/common/directives"
import RewardsPills from "../progress/RewardsPills.vue"
import { AspectRatio } from "@/common/components/utility"
import { getAssetURL } from "@/utils"

const props = defineProps({
  mission: Object,
  isFacility: Boolean,
  isSkeleton: Boolean,
})

const emit = defineEmits(["goToBigMap"])

const goToBigMap = () => emit("goToBigMap", props.mission)
</script>

<style scoped lang="scss">
.card-wrapper {
  height: 100%;
  &[disabled] {
    pointer-events: none;
  }
  &:focus,
  &:hover {
    background-color: rgba(255, 255, 255, 0.4);
  }
  .condensed {
    display: flex;
    border-radius: var(--bng-corners-2);
    maskImage: linear-gradient(to right, rgba(0, 0, 0, 0.75) 50%, rgba(0, 0, 0, 0.1) 100%);
    height: 100%;
    position: relative;
    .image {
      position: absolute;
      top: 0; bottom: 0;
      left: 66%; right: 0%;
      z-index: 0;
    }
    padding: 0.5rem 0.25rem;
    .mission-icon {
      flex: 0 0 2.5rem;
      display: flex;
      font-size: 2rem;
      z-index: 1;
      align-self: start;
     }

    .main-info {
      z-index: 1;
      position: relative;
      flex: 1 0 auto;

      color: white;
      display: flex;
      flex-flow: column;

      > .go-to-bigmap-label {
        display: hidden;
        padding-top: 0.5rem;
        text-align: right;
      }
      > .locked-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        display: flex;
        justify-main-info: center;
        align-items: center;
        background-color: rgba($color: #000000, $alpha: 0.7);
        .glyph-locked {
          font-size: 10em;
        }
      }

      > .heading {
        font-weight: 800;
        font-size: 1.25rem;
      }

      > * {
        flex: 0 0 auto;
      }
      > .middle-main-info {
        flex: 1 0 auto;
      }

      > .rewards {
        // display: flex;
        // flex-flow: column;
        display: grid;
        gap: 0.25rem;
        grid-template-columns: 1fr auto;

        .mission-rewards-label {
          font-weight: 600;
          padding: 0.25rem 0 0;
          grid-column: 1 / -1;
        }



        .mission-rewards {
          display: flex;
          flex-flow: row wrap;
          flex: 1 0 auto;
          grid-column: 1;
          &.money {
            flex: 0 0 auto;
            grid-column: -1;
            justify-main-info: flex-end;
          }
        }

        > .mission-stars {
          display: flex;
          flex-flow: row;
          & > * {
            margin-right: 0.25rem;
            margin-bottom: 0.25rem;
            min-height: fit-main-info;
            max-width: fit-main-info;
          }
          > .main-stars {
            --star-color: var(--bng-ter-yellow-50);
            padding: 0.25rem 0.5rem;
          }
          > .bonus-stars {
            --star-color: var(--bng-add-blue-400);
            padding: 0.25rem 0.5rem;
          }
        }
      }
    }
  }
}
</style>
