<template>
  <BngCard class="filterCard" :class="{ disabled: disabled.disabled }"
    @click.stop="cargoOverviewStore.selectFilter([filter.value])">


    <BngCardHeading class="card-heading" >
      <span class="header-text">
        {{filter.label}}
      </span>
    </BngCardHeading>
    <AspectRatio class="image"  :ratio="'8:3'" >
      <BngIcon class="glyph" :type="icons[filter.icon]" />
      <div class="step" :class="{ none: filter.facilityCards === 0 }">
        <BngPropVal class="amount-avail" :valueLabel="'× ' + filter.facilityCards" />
      </div>
    </AspectRatio>
          <!--

    <div class="content">
      <template v-if="!disabled">
        <BngPropVal
          :iconType="icons.info"
          :keyLabel="filter.shortDescription"
          />
        <BngPropVal
          :iconType="icons[filter.icon]"
          :keyLabel="'Available items: ' + filter.facilityCards"
          />
      </template>
      <template v-else>
        <BngPropVal
          :iconType="icons.info"
          :keyLabel="filter.noContent"
          />
      </template>
      -->
    <!--
    </div>
    <div class="button-wrapper">
      <TutorialButton class="howto-button" accent="text" :icon="icons.help" v-if="filter.howTo":pages="filter.howTo.pages" :text="'How does this work?'"
      >
      </TutorialButton>
    </div>
  -->

    <div v-if="disabled.reason" class="disabled-reason noOffers">
      <BngPropVal class="amount-avail" :iconType="icons.lockClosed" :valueLabel="disabled.reason" />
    </div>
  </BngCard>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { BngCard, BngCardHeading, BngPropVal, BngButton, BngIcon, icons } from "@/common/components/base"
import { getAssetURL } from "@/utils"
import { AspectRatio } from "@/common/components/utility"
import { useCargoOverviewStore } from "../../stores/cargoOverviewStore";
import TutorialButton from "@/modules/career/components/TutorialButton.vue";
import { lua } from "@/bridge";
const props = defineProps({
  filter: Object,
})
const cargoOverviewStore = useCargoOverviewStore();

const disabled = computed(() => {
  if (props.filter) {
    if (!props.filter.hasAvailableOffers) return { disabled: true, /*reason: "No Offers!"*/ }
    if (props.filter.unavailableAtThisFacility) return { disabled: true, reason: "Unavailable" }
    if (props.filter.lockedInfo) return { disabled: true, reason: props.filter.lockedInfo.shortLabel }
  }
  return { disabled: false }
})

onMounted(() => {

})

const openHowTo = () => {
  for(let key of props.filter.howTo.pages){
    lua.career_modules_linearTutorial.introPopup(key, true)
  }
}
</script>

<style scoped lang="scss">
$col-warn: #d77;

.filterCard {
  height: auto;
  width: 13em;
  background-color:var(--bng-ter-blue-gray-600);
  overflow:hidden;
  &:hover {
    background-color:var(--bng-ter-blue-gray-300);
  }
  display: flex;
  pointer-events: auto;

  .card-heading-container {
    position:absolute;
    background: linear-gradient(left, #444e, #4440);
    width: auto;

    margin-top:0.5rem;
    .card-heading {

    }

  }
  .button-wrapper {
    padding: 0.25rem;
    padding-right: 0.9rem;
  }
  .howto-button {
    width:100%;
    max-width:100%;
    pointer-events: auto;

  }

  .card-heading {
    flex: 1 1 auto;
    font-size: 1.2rem;
    font-weight: 600;
  }

  .content {
    height:100%;
    margin-bottom:1rem;
    display:flex;

    .info {
      flex: 1 1 auto;
    }
  }


}

.filterCard:not(.disabled) {
  cursor: pointer;
}

.disabled {
  :deep(.card-cnt) {
    background-color: #000a;
  }
  .card-heading {
    filter: brightness(60%) saturate(65%);
  }
  .image {
    background-color: rgba(var(--bng-ter-blue-gray-600-rgb), 0.2);
  }
  .glyph {
    opacity: 0.3;
  }
  .step {
    background-color: rgba(var(--bng-cool-gray-900-rgb), 0.6);
  }
}
.disabled-reason {
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: 0.1em 0 0.2em 0;
  text-align: center;
  font-size: 1.1em;
  text-shadow: 0 0 0.4em #000;
  background-color: #0005;
  pointer-events: none;
  &, * {
    color: $col-warn;
  }
  &.noOffers {
    //
  }
}

.image {
  background-color: rgba(var(--bng-ter-blue-gray-600-rgb), 0.4);
  :deep(.slotted) {
    overflow:none;
  }
}

.glyph {
  font-size: 4em;
}

.step {
  position: absolute;
  top: 0;
  right: 0.5em;
  padding: 0.25em 0.5em;
  background-color: rgba(var(--bng-cool-gray-900-rgb), 0.9);
  border-radius: 0 0 var(--bng-corners-2) var(--bng-corners-2);
  font-size:1.2rem;
  &.none {
    color: $col-warn;
  }
}

</style>
