<template>
  <div class="info-container">
    <div class="header" v-if="meta.type !== 'hidden'">
      <div class="label" v-if="label">
        <BngIcon class="icon" v-if="meta.type == 'task'" :type="icons.checkboxOff"/>
        <template v-if="label">{{$tt(label)}}</template>
      </div>
      <div class="props">
        <template v-if="meta.type == 'container' || meta.type == 'totalStorage'">
          <BngPropVal
            :iconType="icons[meta.icon]"
            :valueLabel="meta.usedCargoSlots + ' / ' + meta.totalCargoSlots" />
        </template>
        <template v-if="meta.type == 'location'">
          <BngPropVal
            :iconType="icons.mapPoint"
            :valueLabel="units.buildString('distance', meta.distance, 1)" :style="{ '--icon-size': '1.25em' }" />
        </template>
        <template v-if="meta.type == 'trash' ">
          <BngIcon class="icon" :type="icons.trashBin1"/>
        </template>

        <template v-if="props && props.length">
          <BngPropVal v-for="prop in props"
            :iconType="icons[prop.icon]"
            :valueLabel="prop.label" />
        </template>
        <div class="prop pill" v-if="fillInfo" >
          <BngPropVal
            :iconType="icons[fillInfo.icon]"
            :valueLabel="fillInfo.usedSlots + ' / ' + fillInfo.availableSlots" />
        </div>
      </div>

      <div class="progress-bar" :class="{'trash':meta.type == 'trash'}" v-if="meta.fillPercent || meta.fillPercent == 0" >
        <div class="progress-bar-fill highlight" v-if="meta.fillPercentHighlight > 0" :style="{ width: `${meta.fillPercentHighlight * 100}%` }"></div>
        <div class="progress-bar-fill" :style="{ width: `${meta.fillPercent * 100}%` }"></div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { BngIcon, BngPropVal, icons } from "@/common/components/base"
import { useBridge } from "@/bridge"
const { units } = useBridge()

const props = defineProps({
  label: String,
  fillInfo: Object,
  meta: Object,
})
</script>

<style lang="scss" scoped>
.info-container {
  display: inline-block;
  min-width: 10em;
}

.header {
  position: relative;
  display: flex;
  grid-column-start: span 2;
  padding-top: 0.4rem;
  .label {
    z-index: 1;
    padding-top: 0.2rem;
    flex: 1 1 auto;
    font-weight: 500;
    font-size:1.2rem;
    padding-left: 0.75rem;
  }
  .props {
    z-index: 1;
    display: flex;
    flex-flow:row;
    .prop {
      flex: 0 1 auto;
    }
    .pill {
      border-radius:1rem;
      background-color:#000000ff;
      padding:0.1rem 0.25rem 0.25rem 0.25rem;
    }
    padding-right: 0.75rem;
  }
}

:deep(.value-label) {
  white-space: nowrap;
}

@keyframes pulsingBrightness {
  0% {
    filter: brightness(1.2);
  }
  50% {
    filter: brightness(1.4);
  }
  100% {
    filter: brightness(1.2);
  }
}
.progress-bar {
  position:absolute;
  grid-column: 1 / -1;

  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 0;
  opacity: 0.5;

  .progress-bar-fill {
    position:absolute;
    top: 0;
    bottom: 0;
    left: 0;
    background-color:var(--bng-orange-500);
    width: 33%;
  }
  .highlight {
    background-color:var(--bng-orange-400);
    animation: pulsingBrightness 1s ease-in-out infinite;
  }
}

.trash {
  .progress-bar-fill {
    background-color:var(--bng-add-red-500);
  }
}
</style>
