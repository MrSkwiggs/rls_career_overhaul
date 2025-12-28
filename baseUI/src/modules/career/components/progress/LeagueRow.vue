<template>
  <div class="league-row" :class="{'locked':!league._unlocked, 'condensed':condensed}" :style="leagueStyle">
    <!-- Progress Bar (Left Side) -->
    <div class="progress-track">
      <div
        v-if="league._unlocked"
        class="progress-fill"
        style="height: 100%"
      ></div>
    </div>

    <div class="header">
      <div class="name">
        <BngIcon :type="icons[league.icon]" class="skill-icon" :color="league._unlocked ? 'white' : 'gray'"/>
        {{ $ctx_t(league.name) }}
      </div>
      <div class="stars" v-if="!nowUnlocked">
        <template v-if="league._unlocked">
          <BngMainStars

            :unlocked-stars="league.totalStarsObtained"
            :total-stars="league.totalStarsAvailable"
            class="main-stars"
            :scale="0.8"
            reverse
            numerical
            />
        </template>
      </div>
      <div v-else class="stars">
        <BngIcon :type="icons.lockOpened"/>
      </div>
    </div>
    <div class="content-row" :class="{'vertical': vertical}" >
      <div class="info">
        <template v-for="cond in league.unlock">
          <BngCard  v-if="!cond.hidden">
            <div class="unlock-condition">
              <div class="info">
                <BngIcon
                  class="icon"
                  :type="cond.met ? icons.lockOpened : icons.lockClosed"
                  :color="cond.met ? 'white' : 'gray'"
                />
                <div class="label">
                  {{cond.label}}
                </div>
              </div>
              <BngProgressBar
                v-if="cond.progress"
                :value="cond.progress.cur"
                :min="cond.progress.min"
                :max="cond.progress.max"
                :valueLabelFormat="''"
                class="progress" />
            </div>
          </BngCard>
        </template>
        <div class="description">
          {{ $ctx_t(league.description) }}
        </div>
      </div>
      <div class="cards-container" v-if="!condensed">

          <MissionCard
            class="clickable-card"
            v-for="mission in league.missions"
            :key="mission.id"
            :mission="mission"
            @clicked="leagueMissionClicked"
            :showStartableIcons="true"
          />
          <MissionCard
            class="clickable-card"
            v-for="driftSpot in league.driftSpots"
            :key="driftSpot.id"
            :mission="driftSpot"
            @clicked="leagueMissionClicked"
          />
          <template v-if="league.comingSoon" v-for="info in league.comingSoon">
            <BngCard class="card-height" >
              <div class="basic-card locked coming-soon">
                <BngIcon
                  class="icon"
                  :type="icons[info.icon]"
                  :color="'gray'" />
                <div class="label">
                  {{info.label}}
                </div>
              </div>
            </BngCard>
          </template>
      </div>
      <div v-else class="right">
        {{league.missions.length}} Challenges

      </div>
    </div>
  </div>
</template>

<!--
<template v-for="milestone in league.milestones">
  <MilestoneCard
    class="milestone"
    tabindex="1"
    :milestone="milestone"
    :isCondensed="true"
     />
</template>
-->
<script setup>
import MissionCard from "../progress/MissionCard.vue"
import MilestoneCard from "../milestones/MilestoneCard.vue"
import { BngIcon, icons, BngCard, BngMainStars, BngProgressBar } from "@/common/components/base"
import { ref, computed } from "vue"

const props = defineProps({
  league: Object,
  leagueMissionClicked: Function,
  condensed: Boolean,
  vertical: Boolean,
  nowUnlocked: Boolean,
})

function hexToRgb(hex) {
  // Remove the hash if present
  hex = hex.replace(/^#/, '')

  // Parse the hex values
  const bigint = parseInt(hex, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255

  return `${r}, ${g}, ${b}`
}

const leagueStyle = computed(() => {
  if (!props.league.accentColor) return {}

  const style = {}

  if (props.league.accentColor.startsWith("#")) {
    style['--league-accent-color'] = hexToRgb(props.league.accentColor)
  } else if (props.league.accentColor.startsWith("var(--")) {
    style['--league-accent-color'] = props.league.accentColor
  }

  return style
})
</script>

<style lang="scss" scoped>

.league-row {
  display: flex;
  flex-flow: column;
  background-color: rgba(white, 0.05);
  border-radius: var(--bng-corners-1);
  padding: 0 !important;
  padding-left: 1rem !important;
  position: relative;
  overflow: hidden;

  &:not(.locked) {
    background: linear-gradient(
      to left,
      rgba(white, 0.15) 0%,
      color-mix(in srgb, rgba(var(--league-accent-color), 1) 30%, transparent) 100%,
      rgba(black, 0.6) 12rem
    );
  }

  .progress-track {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 1rem;
    background-color: rgba(black, 0.4);
    overflow: hidden;
    z-index: 0;
    border-radius: var(--bng-corners-1) 0 0 var(--bng-corners-1);

    .progress-fill {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(
        to bottom,
        rgba(var(--league-accent-color), 1),
        color-mix(in srgb, rgba(var(--league-accent-color), 1) 80%, white)
      );
    }
  }

  .header {
    display: flex;
    border-radius: var(--bng-corners-1) var(--bng-corners-1) 0 0;
    padding: 0.33rem 0.5rem;
    flex: 0 0 auto;
    font-size: 1.25rem;
    font-weight: 800;
    background-color: rgba(var(--bng-cool-gray-700-rgb), 0.4);
    position: relative;
    z-index: 1;
    align-items: center;

    .name {
      flex: 1 1 auto;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-style: italic;

      .skill-icon {
        margin-top: 0.1rem;
        font-size: 1.6rem;
        font-style: normal;
      }
    }
    .stars {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;

      > .main-stars {
        --star-color: var(--bng-ter-yellow-50);
        padding: 0.25rem 0.5rem;
      }
    }
  }
  .content-row {
    flex: 1 1 auto;
    display: flex;
    padding: 0.5rem 0.5rem 0.5rem 0.75rem;
    flex-flow:row;
    gap: 0.5rem;
    >.info {
      display: flex;
      flex-flow: column;
      z-index: 1;
      flex: 0 0 20rem;
      font-size: 0.9rem;
      gap: 0.5rem;
    }
    >.cards-container {
      z-index: 1;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(20em, 1fr));
      gap: 0.5rem;
      grid-auto-rows: 0.1fr;
      align-items: stretch;
      flex: 1 1 auto;
      .milestone {
        height: 100%;
      }
    }
    .right {
      text-align: right;
      width: 100%;
      padding-right: 0.5rem;
    }
  }

  .vertical {
    flex-flow: column;
      padding: 0.25rem 0.5rem 0.5rem 0.5rem;
    >.info {
      flex: 1 0 auto;
      padding-bottom: 0.5rem;
      padding-left: 0.5rem;
    }
    >.cards-container {
      gap: 0.5rem;
    }
  }
}

.locked {
  color: var(--bng-cool-gray-500);

  :deep(.icon) {
    color: var(--bng-cool-gray-500);
  }

  .header {
    background-color: rgba(var(--bng-cool-gray-800-rgb), 0.3);
  }
}

.condensed {
  .header {
    font-size: 1.2rem;
  }
}

.card-height{
  height: 100%;
}

.unlock-condition {
  display: flex;
  flex-flow: column;
  background: linear-gradient(
            to right,
            rgba(var(--league-accent-color), 0.1),
            black
          );

  .info {
    flex: 1 1 auto;
    display: flex;
    flex-flow: row;
    align-items: center;
    gap: 0.5rem;
    padding: 0.2rem;

    .icon {
      flex: 0 0 auto;
      font-size: 1.5rem;
      z-index: 1;
    }

    .label {
      font-weight: 500;
    }
  }

    > .progress {
      padding: 0;
      :deep(.progress-bar) {
        overflow: hidden;
        border-radius: var(--bng-corners-1);
        height: 0.2rem;
        background: linear-gradient(
            to right,
            rgba(var(--league-accent-color), 0.25),
            color-mix(in srgb, rgba(var(--league-accent-color), 1) 25%, black)
          );
        .progress-fill {
          background: rgba(var(--league-accent-color), 1) !important;
        }
      }
  }
}

.basic-card {
  display: flex;
  flex-flow: row;
  border-radius: var(--bng-corners-1);
  height: 100%;
  position: relative;
  padding: 0.75rem 0.5rem;
  background-color: rgba(black, 0.3);
  align-items: center;
  gap: 0.5rem;



  .icon {
    flex: 0 0 auto;
    display: flex;
    font-size: 1.5rem;
    z-index: 1;
  }

  .info {
    flex: 1 1 auto;
    display: flex;
    flex-flow: column;
    gap: 0.5rem;

    .label {
      font-weight: 500;
      line-height: 1.3;
    }
  }
}

.coming-soon {
  align-items: center;
  background: repeating-linear-gradient(
    -45deg,
    rgba(white, 0.05),
    rgba(white, 0.05) 1rem,
    rgba(white, 0) 1rem,
    rgba(white, 0) 2rem
  );
}


</style>
