<template>
   <InfoCard class="mission-ratings" header="Ratings"  header-type="ribbon" :no-blur="simple">
    <template #content>
      <div class="ratings">

        <div class="prop-container">
          <BngPropVal
            class="prop task-item"
            v-for="(attr, index) in ratings.ownAggregate"
            :key="index"
            :key-label="$t(attr.label)"
            :value-label="valueOf(attr.value)"
            :class="{
              //'outline-swoop': attr.newBest && !ratings.skipAnimations,
              'animation-complete': attr.newBest
            }"
            :style="{'--animation-delay': attr.animDelay ? (attr.animDelay) : 0}"
          >
          </BngPropVal>
        </div>

      </div>
      <div class="table-wrapper">
        <Grid :grid="ratings.attempts" />
        <div
          v-if="!Array.isArray(ratings.attempts.rows) || ratings.attempts.rows.length == 0"
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
import { onMounted, onBeforeUnmount } from 'vue';
import { $translate } from "@/services"
import { BngPropVal, BngMainStars } from "@/common/components/base"
import { BngIcon, icons } from "@/common/components/base"
import { lua, useBridge } from "@/bridge"
import { formatTime } from "@/utils/datetime"
import InfoCard from "../components/InfoCard.vue"
import Grid from "../components/Grid.vue"
const { units } = useBridge()
const props = defineProps({
  ratings: {
    type: Object,
    required: false,
  },
  simple: {
    type: Boolean,
    required: false,
  }
})

function valueOf(x) {
  if(x.format == "distance") {
    return units.buildString('distance', x.distance, 1)
  }

  return x.text
}

const isMonospace = (td) => {
  return td.format === 'detailledTime' || td.format === 'distance';
};

const wooshDelays = [];
const WOOSH = "event:>UI>Career>EndScreen_Whoosh_Ratings"
const HIGHLIGHT = "event:>UI>Career>EndScreen_Highlight_Ratings";

onMounted(() => {
  if (!props.ratings.animationFinished) {
    // Clear any existing timeouts
    wooshDelays.length = 0;

    // Iterate over props.ratings.ownAggregate
    for (const attr of props.ratings.ownAggregate) {
      if (attr.soundDelay) {
        const wooshId = setTimeout(() => {
          lua.Engine.Audio.playOnce("AudioGui", WOOSH);
        }, attr.soundDelay);
        wooshDelays.push(wooshId); // Correct array method

        const highlightId = setTimeout(() => {
          lua.Engine.Audio.playOnce("AudioGui", HIGHLIGHT);
        }, attr.soundDelay+1000);
        wooshDelays.push(highlightId); // Correct array method
      }
    }
  }
});

onBeforeUnmount(() => {
  // Clear all timeouts when the component unmounts
  for (const id of wooshDelays) {
    clearTimeout(id);
  }
});

let now = Date.now()/1000
</script>



<style scoped lang="scss">
.mission-ratings {
  width: auto;

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
    display: flex;
    flex-flow: column nowrap;
    .caption {
      color: var(--bng-cool-gray-200);
      padding: 1rem;
      display: flex;
      justify-content: center;
      align-items: center;
      background: linear-gradient(to bottom, rgba(var(--bng-cool-gray-900-rgb), 0), rgba(var(--bng-cool-gray-900-rgb), 0.6));
      border-radius: var(--bng-corners-1);
    }
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
  position: relative;
  background: rgba(var(--bng-orange-500-rgb), 0.25);

  &::before {
    content: '';
    position: absolute;
    top: 0; bottom: 0; left: 0; right: 0;
    background-image: linear-gradient(90deg,
      rgba(255, 255, 255, 0.10) 0%,
      rgba(255, 255, 255, 0.10) 50%,
      rgba(255, 255, 255, 0.25) 74%,
      rgba(255, 255, 255, 0.10) 74.2%,
      rgba(255, 255, 255, 0.00) 100%);
    background-size: 400% 100%;
    background-position: 0% 50%;
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    padding: 0.125rem;
  }
}


.animation-complete {
  position: relative;
  &.task-item {
    background-image: linear-gradient(90deg,
      rgba(var(--bng-orange-500-rgb), 0.50) 0%,
      rgba(var(--bng-orange-500-rgb), 0.25) 5rem,
      rgba(var(--bng-orange-500-rgb), 0.25) 50%,
      rgba(255, 255, 255, 0.15) 74%,
      rgba(255, 255, 255, 0.00) 74.2%,
      rgba(255, 255, 255, 0.00) 100%);
    background-position: 0% 50%;
    background-size: 400% 100%;
    position: relative;
  }
  &::before {
      content: '';
      position: absolute;
      top: 0; bottom: 0; left: 0; right: 0;
      border-radius: var(--bng-corners-2);
      background-image: linear-gradient(90deg,
        rgba(255, 255, 255, 0.10) 0%,
        rgba(255, 255, 255, 0.10) 50%,
        rgba(255, 255, 255, 0.25) 74%,
        rgba(255, 255, 255, 0.10) 74.2%,
        rgba(255, 255, 255, 0.00) 100%);
      background-size: 400% 100%;
      background-position: 0% 50%;
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      padding: 0.125rem;
    }
}

</style>
