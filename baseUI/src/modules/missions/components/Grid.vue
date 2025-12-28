<template>
  <div class="grid" :style="{ '--columns': grid.labels.length }">
    <template v-for="(heading, colIndex) in grid.labels">
      <div v-if="heading !== ''"
        class="col-heading"
        :class="{ 'first-column': colIndex === 0 }"
        :style="{ '--column': colIndex+1 }">{{ $t(heading) }}
      </div>
    </template>
    <div v-if="grid.labels" class="heading-highlight"></div>
    <template v-for="(row, rowIndex) in grid.rows">
      <div v-for="(td, colIndex) in row"
        class="property"
        :class="{
          'monospace': isMonospace(td),
          'first-column': colIndex === 0,
          'total-td': td.styling?.totalRow
        }"
        :style="{ '--row': rowIndex+2, '--column': colIndex+1 }">
        <template v-if="td.text === 'true'">
          <BngIcon class="checkmark" :type="icons.checkmark" />
        </template>
        <template v-else-if="td.text === 'false'">
          <BngIcon class="checkmark" :type="icons.abandon" />
        </template>
        <template v-else-if="!td.format || td.format == 'detailledTime' || td.format == 'rallyTimeFormatter' || td.format == 'rallyPenaltyFormatter'">
          {{td.text}}
        </template>
        <template v-else-if="td.format=='timespan'">
          {{formatTime(now - td.timestamp, 1, true)}}
        </template>
        <template v-else-if="td.format=='distance'">
          {{units.buildString('distance', td.distance, 1)}}
        </template>
        <template v-else-if="td.format=='simpleStars'">
          <div class="stars-container">
            <BngMainStars v-if="td.defaults.length > 0" :individualStars="td.defaults" class="stars main-stars" :scale="0.5"/>
            <BngMainStars v-if="td.bonus.length > 0" :individualStars="td.bonus" class="stars bonus-stars" :scale="0.5"/>
          </div>
        </template>
        <template v-else-if="td.format=='replay'">
          <div v-if="td.text=='yes'">
            <BngIcon :type="icons.clapperboard" />
          </div>
        </template>
        <template v-else>
          {{td}}
        </template>
      </div>
      <div v-if="grid.leaderboardIndex" class="row-highlight"
           :class="{ 'outline-swoop': (grid.leaderboardIndex == rowIndex+1), 'row-even': (rowIndex % 2 !== 0) }"
           :style="{ '--row': rowIndex+2 }"></div>

      <div v-else class="row-highlight"
           :class="{ 'row-even': (rowIndex % 2 !== 0) }"
           :style="{ '--row': rowIndex+2 }"></div>

    </template>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { BngIcon, icons, BngMainStars } from "@/common/components/base";
import { formatTime } from "@/utils/datetime";
import { lua, useBridge } from "@/bridge";

const { units } = useBridge();

const props = defineProps({
  grid: Object,
});

const isMonospace = (td) => td.format === 'detailledTime' || td.format === 'distance' || td.format === 'rallyTimeFormatter' || td.format === 'rallyPenaltyFormatter' || td.mono;

let now = Date.now() / 1000;

const wooshDelays = [];
const WOOSH = "event:>UI>Career>EndScreen_Whoosh_Ratings";

onMounted(() => {
  wooshDelays.length = 0;
  if (props.grid.leaderaboardSoundDelay) {
    const id = setTimeout(() => {
      lua.Engine.Audio.playOnce("AudioGui", WOOSH);
    }, props.grid.leaderaboardSoundDelay);
    wooshDelays.push(id);
  }
});

onBeforeUnmount(() => {
  // Clear all timeouts when the component unmounts
  for (const id of wooshDelays) {
    clearTimeout(id);
  }
});
</script>
<style scoped lang="scss">
.grid {
  --columns: 2;
  $ratings-z-index: 1;
  $z-index-step: 2;

  @function z-index-offset($offset-level) {
    @return $ratings-z-index + ($z-index-step * $offset-level);
  }

  display: grid;
  grid-template-columns: repeat(var(--columns), minmax(min-content, auto));
  border-radius: var(--bng-corners-1);
  overflow: hidden auto;

  .col-heading {
    --column: auto;
    grid-row: 1 / span 1;
    grid-column: var(--column) / span 1;
    z-index: z-index-offset(3);

    font-family: 'Overpass', var(--fnt-defs);
    font-weight: 800;
    font-style: italic;

    padding: 0.125rem 0.25rem;

    &.first-column {
      font-weight: 900;
      justify-self: center;
    }
  }

  .heading-highlight {
    grid-row: 1 / span 1;
    grid-column: 1 / -1;
    background-color: rgba(var(--bng-cool-gray-900-rgb), 0.5);
    z-index: z-index-offset(2);
  }

  .property {
    --row: auto;
    grid-row: var(--row) / span 1;
    grid-column: var(--column) / span 1;
    z-index: z-index-offset(3);

    padding: 0.25rem 0.25rem;
    min-height: 3.3em;
    display: flex;
    align-items: center;

    font-size: 0.9rem;
    &.monospace {
      font-family: var(--fnt-mono);
    }
    &.first-column {
      font-weight: 900;
      justify-self: center;
      justify-content: center;
    }
    &.total-td {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--bng-ter-yellow-50);
    }
  }

  .row-highlight {
    grid-row: var(--row) / span 1;
    grid-column: 1/-1;
    position: relative;
    background-color: rgba(var(--bng-cool-gray-750-rgb), 0.5);

    &.row-even {
      background-color: rgba(var(--bng-cool-gray-800-rgb), 0.5);
    }

    &.outline-swoop {
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
}

.outline-swoop {

  //Outline
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
  }

   //Background
   background-image: none;
  background: rgba(var(--bng-orange-500-rgb), 0.0);


}

</style>
