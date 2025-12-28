<template>
   <InfoCard class="leagues-card" header="Series Progress"  header-type="ribbon">
    <template #content>
      <div class="list">
      <template v-for="league in leagues" :key="league.id">
        <LeagueRow
        :league="league"
        :goToBigMap="goToBigMap"
        :condensed="true"
       />
      </template>
      </div>
    </template>
  </InfoCard>
</template>

<script setup>
import { ref } from "vue"
import { $translate } from "@/services"
import { lua, useBridge } from "@/bridge"
import InfoCard from "../components/InfoCard.vue"
import LeagueRow from "../../career/components/progress/LeagueRow.vue"
const props = defineProps({
  leagues: {
    type: Object,
    required: false,
  }
})
const goToBigMap = mission => {
  if (mission && mission.startable) {
    lua.career_modules_branches_landing.openBigMapWithMissionSelected(mission.id)
  }
}
</script>

<style scoped lang="scss">
.list {
  padding-bottom: 1.5rem;
}
</style>
