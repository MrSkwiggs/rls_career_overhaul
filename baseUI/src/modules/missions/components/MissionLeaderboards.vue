<template>
   <InfoCard class="mission-ratings" header="Leaderboards"  header-type="line">
    <template #content>

      Leaderboard: {{$ctx_t(currentProgressKeyTranslation)}}
      <div class="ratings" v-if="ratings">

        <div class="prop-container">
          <BngPropVal class="prop" v-for="(attr, index) in ratings.ownAggregate" :key="index" :key-label="$t(attr.label)" :value-label="valueOf(attr.value)" :class="{['outline-swoop']: attr.newBest}" :style="{'--animation-delay': attr.animDelay ? (attr.animDelay) : 0}">
          </BngPropVal>
        </div>

      </div>
      <div class="table-wrapper" v-if="ratings && ratings.attempts">
        <div class="replay-visibility">
          <BngIcon class="replay-icon" :type="icons.clapperboard" />
          <div>
            {{$translate.instant("missions.general.replay.replayVisibility")}}
          </div>
        </div>
        <Grid :grid="ratings.attempts" />
        <div
          v-if="!Array.isArray(ratings.attempts.rows) || ratings.attempts.rows.length == 0"
          class="caption">
            No Attempts yet!
        </div>
      </div>
      <div v-else>
        <div
          class="caption">
            No Attempts yet!
        </div>
      </div>

     </template>

    <!-- <template #button>
      <BngButton tabindex="1" :accent="ACCENTS.text">Leaderboards</BngButton>
    </template> -->
  </InfoCard>
</template>

<script setup>
import { ref } from "vue"
import { computed, onMounted, onBeforeUnmount } from 'vue';
import { $translate } from "@/services"
import { BngPropVal, BngMainStars } from "@/common/components/base"
import { BngIcon, icons } from "@/common/components/base"
import { lua, useBridge } from "@/bridge"
import { formatTime } from "@/utils/datetime"
import { storeToRefs } from "pinia"
import { useMissionDetailsStore } from "@/modules/missions/stores/missionDetailsStore"
import InfoCard from "../components/InfoCard.vue"
import Grid from "../components/Grid.vue"
const store = useMissionDetailsStore()
const { formattedProgress, currentProgress,  currentProgressKey, currentProgressKeyTranslation } = storeToRefs(store)
const { units } = useBridge()
const props = defineProps({


})

//const currentProgressKey = ref("3-false-false")
const ratings = computed(() => {
  return currentProgress.value
})
/**
const currentProgressKeyTranslation = computed(() => {
  if(!props.progressKey)
    return "No Progress Key!"
  if(  !props.formattedProgress
    || !props.formattedProgress.progressKeyTranslations
    || !props.formattedProgress.progressKeyTranslations[currentProgressKey])
    return "No Translation Key!"
  return props.formattedProgress.progressKeyTranslations[currentProgressKey]

})
*/


function valueOf(x) {
  if(x.format == "distance") {
    return units.buildString('distance', x.distance, 1)
  }

  return x.text
}

const isMonospace = (td) => {
  return td.format === 'detailledTime' || td.format === 'distance';
};

</script>



<style scoped lang="scss">
.replay-visibility {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}
.replay-icon {
  font-size: 2rem;
  margin-bottom: 0.25rem;
}
.mission-ratings {
  --bng-info-card-width: auto;
  .ratings {
    display: flex;
    flex-wrap: wrap;
    .prop-container {
      display: flex;
      flex-wrap: wrap;
      flex: 1 1 auto;
      padding: 0.5rem 0;
    }
    .prop {
      background-color: rgba(var(--bng-cool-gray-900-rgb), 0.6);
      border-radius: var(--bng-corners-2);
      margin: 0.125rem 0;
      padding: 0.25rem 0.5rem;
      width: 100%;
      display: flex;
      :deep(.key-label) {
        flex: 1 1 auto;
      }
    }
  }


  .table-wrapper {
    padding: 0.15rem;



  }

}
.stars-container {
  display: flex;
  justify-content: center;


}
.stars {
  flex: 0 0 auto;
  padding: 0.15rem 0.25rem;
  margin: 0 0.1rem;
}
.main-stars {
  --star-color: var(--bng-ter-yellow-50);
}
 .bonus-stars {
  --star-color: var(--bng-add-blue-400);
}



.outline-swoop {
  --animation-delay: 0s;
  &::before {
    content: '';
    position: absolute;
    top:0; bottom:0; left:0; right:0;
    // border-radius: 0.5rem;
    background-image:linear-gradient(90deg,
      rgba(255, 255, 255, 0.10) 0%,
      rgba(255, 255, 255, 0.10) 50%,
      rgba(255, 255, 255, 0.25) 74%,
      rgba(255, 255, 255, 0.10) 74.2%,
      rgba(255, 255, 255, 0.00) 100%);
    background-size: 400% 100%; /* Makes the background larger to move */
    background-position: 100% 50%; /* Initial position */
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    padding: 0.125rem; // Adjust this to control stroke thickness
    animation: unlocked-slide-animation 2s cubic-bezier(0.45, 0.01, 0.1, 1) forwards ; /* Smooth loop */
    animation-delay: var(--animation-delay);
  }


  //Background
  background: rgba(var(--bng-orange-500-rgb), 0.0);


  animation:
    fade-bg 1s linear forwards;
    //unlocked-bounce-animation-delayed 2s cubic-bezier(0.45, 0.01, 0.1, 1) forwards; /* Smooth loop */
    animation-delay: var(--animation-delay);
}

@keyframes fade-bg {
  0%, 50% {
   background: rgba(var(--bng-orange-500-rgb), 0.0);
  }

  100% {
    background: rgba(var(--bng-orange-500-rgb), 0.25);
  }
}

@keyframes unlocked-bounce-animation-delayed {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1) ;
  }

  65% {
    transform: scale(1.2) ;
  }


  85% {
    transform: scale(1.2) ;
  }

  100% {
    transform: scale(1) ;
  }
}

@keyframes unlocked-slide-animation {
  0% {
    background-position: 100% 50%;
  }

  50% {
    background-position: 50% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

</style>
