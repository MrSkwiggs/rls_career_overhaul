<template>
  <InfoCard :header="translatedHeader" headerType="ribbon" class="dynamic" :class="{'experimental':panel.experimental, 'full-height': panel.fullHeight}" :no-blur="noBlur">
    <template #content>
      <BngCardHeading type="ribbon" class="replay-heading">
        Stage Score
      </BngCardHeading>
      <div class="score-section-container">
        <div class="score-section" v-if="panel.stepScoreData.speedScore">
          <span class="score-section-title">{{ panel.stepScoreData.speedScore.scoreName }}</span>
          <span>{{ panel.stepScoreData.speedScore.actualSpeed.text }} : {{ panel.stepScoreData.speedScore.actualSpeed.value }} {{ panel.stepScoreData.speedScore.actualSpeed.unit }}</span>
          <span>{{ panel.stepScoreData.speedScore.targetSpeed.text }} : {{ panel.stepScoreData.speedScore.targetSpeed.value }} {{ panel.stepScoreData.speedScore.targetSpeed.unit }}</span>
          <span>{{ panel.stepScoreData.speedScore.diff.text }} : {{ panel.stepScoreData.speedScore.diff.value }} {{ panel.stepScoreData.speedScore.diff.unit }}</span>
          <span class="score-earned">Score : {{ panel.stepScoreData.speedScore.score }} / {{ panel.stepScoreData.speedScore.maxScore }}</span>
        </div>

        <div class="score-section" v-if="panel.stepScoreData.timeScore">
          <span class="score-section-title">{{ panel.stepScoreData.timeScore.scoreName }}</span>
          <span>{{ panel.stepScoreData.timeScore.timeToImpact.text }} : {{ panel.stepScoreData.timeScore.timeToImpact.value }} {{ panel.stepScoreData.timeScore.timeToImpact.unit }}</span>
          <span class="score-earned">Score : {{ panel.stepScoreData.timeScore.score }} / {{ panel.stepScoreData.timeScore.maxScore }}</span>
        </div>

        <div class="score-section" v-if="panel.stepScoreData.damageLocationScore">
          <span class="score-section-title">{{ panel.stepScoreData.damageLocationScore.scoreName }}</span>
          <span>{{ panel.stepScoreData.damageLocationScore.requiredImpactLocation.text }} : {{ panel.stepScoreData.damageLocationScore.requiredImpactLocation.value }}</span>
          <span>{{ panel.stepScoreData.damageLocationScore.actualImpactLocation.text }} : {{ panel.stepScoreData.damageLocationScore.actualImpactLocation.value }} {{ panel.stepScoreData.damageLocationScore.actualImpactLocation.precision }}</span>
          <span class="score-earned">Score : {{ panel.stepScoreData.damageLocationScore.score }} / {{ panel.stepScoreData.damageLocationScore.maxScore }}</span>
        </div>
      </div>

      <span class="new-score-title">New score : </span>
      <PointsBar />

      <DynamicComponent  :template="content" v-if="content && content !== ''"/>
    </template>
  </InfoCard>
</template>



<script setup>
import { ref, computed } from "vue"
import { onMounted, onBeforeUnmount } from 'vue';
import { $translate } from "@/services"
import BngCardHeading from "@/common/components/base/bngCardHeading.vue"
import { lua, useBridge } from "@/bridge"
import InfoCard from "../components/InfoCard.vue"
import Grid from "../components/Grid.vue"
import { DynamicComponent } from "@/common/components/utility"
import { BngPropVal } from "@/common/components/base"
import { $content } from "@/services"
import PointsBar from "@/modules/apps/pointsBar/app.vue"
const { units } = useBridge()

const props = defineProps({
  panel: {
    type: Object,
    required: true,
  },
  noBlur: {
    type: Boolean,
    default: false
  }
})

let wooshDelays = []
let thumpDelays = []

onMounted(() => {

});

onBeforeUnmount(() => {

});


</script>

<style scoped lang="scss">
.dynamic {
  :deep(.info-content) {
    padding: 0 1rem;
    margin-top:10px;
    :first-child {
      margin-top: 0;
    }
  }

}

.full-height {
  height: 100%;
}

.new-score-title {
  font-size: 1.4rem;
  color: white;
  margin-bottom: 10px;
}

.score-section-container {
  display: flex;
  flex-direction: column;
  gap: 40px;
  margin: 40px 0 40px 0;
}
.score-section-title {
  font-size: 1.4rem;
  color: white;
  margin-bottom: 10px;
}
.score-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--bng-orange-300);
  font-weight: 500;
}

.score-earned {
  font-size: 1.4rem;
  color:rgb(255, 213, 0);
  margin-top: 10px;
  margin-bottom: 10px;
}
.experimental {
  :deep(.card-cnt) {
    border: 2px solid rgba(220,0,0, 0.8);
    background-color: rgba(22,0,0, 0.6);
  }
  :deep(.card-heading) {
    &.heading-style-ribbon::before {
      background: rgba(220,0,0, 0.8);
    }
  }
}

</style>
