<template>
  <div class="main-container-grid">
    <div class="scores-container">
      <div class="permanent">
        <span class="points-label">{{$translate.instant("missions.drift.general.pointsShort")}}: </span>{{permanentScore}}
      </div>
      <div class="potential" :class="{ 'animate-potential-score': isAnimatingPotentialScore }">
        + {{potentialScore}}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { BngIcon, icons } from "@/common/components/base"
import { useLibStore } from '@/services'
import { useStreams, useEvents } from '@/services/events'
import { $translate } from "@/services/translation"

const events = useEvents()

const permanentScore = ref(0)
const potentialScore = ref(0)
const isAnimatingPotentialScore = ref(false)
const dontUpdateScores = ref(false)
const lastPotentialScore = ref(0)

onMounted(() => {
  events.on('setDriftPersistentDriftScored', (score, combo) => {
    isAnimatingPotentialScore.value = true
    dontUpdateScores.value = true
    potentialScore.value = score
    lastPotentialScore.value = potentialScore.value

    setTimeout(() => {
      isAnimatingPotentialScore.value = false
    }, 1000)

    // Wait 1 second before updating the potential score
    setTimeout(() => {
      dontUpdateScores.value = false
    }, 900)
  })
})

onUnmounted(() => {
  events.off('setDriftPersistentDriftScored');
});

const streamsList = ['drift']
useStreams(streamsList, (streams) => {
  for (const stream of streamsList) { if (!streams[stream]) { return } }

  if (dontUpdateScores.value)
    return

  permanentScore.value = streams.drift.permanentScore
  potentialScore.value = streams.drift.potentialScore
})

</script>

<style scoped lang="scss">
.main-container-grid{
  color: white;
  font-family: Overpass-mono, var(--fnt-defs);
}
.scores-container {
  height: 5rem;
  font-size: 2.5rem;
  text-align:right;
  text-justify: center;
  font-style: italic;

  .permanent{
    font-size: 2.5rem;
    font-weight: 500;
    padding-right: 0.75rem;
    background: linear-gradient(-90deg,
    rgba(0, 0, 0, 0.35),
    rgba(0, 0, 0, 0.35) 50%,
    rgba(0, 0, 0, 0) 100%);
    position: relative;

    .points-label {
      font-size: 1.5rem;
      margin-right: 0.25rem;
      font-weight: 300;
    }

    &::after {
      content: '';
      position: absolute;
      right: 0;
      top: 0;
      width: 3px;
      height: 100%;
      background-color: #ffcc00;
    }
  }
  .potential{
    font-size: 2rem;
    padding-right: 0.75rem;
    font-weight: 300;
    color: #ffe16b;
    filter: drop-shadow(0rem 0.125rem 0.5rem rgb(0, 0, 0, 0.8));
    opacity: 1;
    transition: opacity 0.3s;

    &.animate-potential-score {
      transform: translateY(-100%) scale(0.8);
      opacity: 0;
      transition: all 1s;
    }
  }
}


</style>