<template>
  <div class="mission-unlocks">
    <template v-if="change && change.unlockedLeagues && change.unlockedLeagues.length > 0">
      <BngCardHeading :type="'ribbon'">Unlocked Series</BngCardHeading>
      <div class="league-container">
        <LeagueRow
          v-for="league in change.unlockedLeagues"
          :key="league.id"
          :league="league"
          vertical
          nowUnlocked
          condensed
          class="league"
        />
      </div>
    </template>
    <template v-if="change && change.unlockedMissions && change.unlockedMissions.length > 0">
      <BngCardHeading :type="'ribbon'">Unlocked Challenges</BngCardHeading>
      <div class="cards-container">
        <template v-for="elem in change.unlockedMissions" :key="elem.id">
          <MissionCard
            v-if="!elem.hidden"
            class="clickable-card"
            :mission="elem.formatted"
          />
        </template>
      </div>
    </template>
  </div>
</template>

<script setup>
import LeagueRow from '../../career/components/progress/LeagueRow.vue'
import MissionCard from '../../career/components/progress/MissionCard.vue'
import {  BngCardHeading } from "@/common/components/base"

const props = defineProps({
  change: {
    type: Object,
    required: false,
  }
})

// Expose sound cancellation method like other components
defineExpose({
  cancelSoundDelays() {
    console.log('MissionUnlocks: Cancelling sound delays')
  }
})
</script>

<style scoped lang="scss">
.mission-unlocks {
  display: flex;
  flex-direction: column;
  color: white;
  border-radius: var(--bng-corners-1);
  font-style: normal;
  font-weight: 400;
  // line-height: 1.25rem; /* 125% */
  letter-spacing: 0.02rem;
  width: 25rem;
}

.league {
  margin: 0.25rem 0;
}

.league-container {
  padding: 1.5rem 0;
}

.cards-container {
  display: grid;
  grid-template-columns: 100%;
  gap: 0.5rem;
  grid-auto-rows: 0.1fr;
  align-items: stretch;
  flex: 1 1 auto;
  padding: 0.5rem;

  .milestone {
    height: 100%;
  }
}

.clickable-card {
  cursor: pointer;

  &:hover {
    filter: brightness(1.1);
  }
}
</style>