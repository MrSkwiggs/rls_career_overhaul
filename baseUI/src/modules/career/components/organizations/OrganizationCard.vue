<template>
  <div class="card-wrapper" v-if="organization.visible">
    <div class="header">
      <div class="name">
        {{ $ctx_t(organization.name) }}
      </div>
      <BngIcon class="glyph" :type="icons[organization.icon]" />

    </div>
    <div :class="{'flex-row':!detail }">
      <div v-if="detail" class="description">
        {{organization.description}}
      </div>
      <!--
        -->
        <div v-if="detail" class="pills">
          <template v-if="organization.hasUnlocks">
            <template v-for="unlock in organization.reputationLevels[organization.reputation.level+1].unlocks">
            <BngPropVal :iconType="icons[unlock.icon]" :keyLabel="'Available Loaners'" :valueLabel="unlock.label"/>
            </template>
          </template>
          <template v-if="organization.loanableVehicles">
          <BngPropVal :iconType="icons.carCoins" :keyLabel="'Loaner Cut'" :valueLabel="((organization.reputationLevels[organization.reputation.level+1].loanerCut.value) * 100).toFixed(0) + '%'" />
          </template>
          <template v-for="fac in organization.associatedFacilities">
          <BngPropVal :iconType="icons.garage01" :keyLabel="'Facility'" :valueLabel="fac.name" />
          </template>
        </div>
    </div>

    <BngProgressBar :value="organization.reputation.value +0.5" :min="organization.reputation.prevThreshold+0.5" :max="organization.reputation.nextThreshold" :valueLabelFormat="''" class="progress" :class="{'slim':detail}" :valueColor="getProgressBarColor(organization.reputation.level)"/>
  </div>
    <!-- :valueLabelFormat="organization.reputation.label +  ' (' + 'Level ' + organization.reputation.level + ')'" -->
  <div class="card-wrapper gray invisible" v-else>
    <div class="header">
      <div class="name">
        Undiscovered Organization
      </div>
      <BngIcon class="glyph" :color="' rgba(var(--bng-cool-gray-600-rgb),0.6)'" :type="icons[organization.icon]" />

    </div>
  </div>
</template>

<script setup>

import { AspectRatio } from "@/common/components/utility"
import { BngIcon, icons, BngPropVal } from "@/common/components/base"

import BngProgressBar from "@/common/components/base/bngProgressBar"

import { ref, computed } from "vue"

const props = defineProps({
  organization: Object,
  detail: Boolean,
})
const levelColors = {
  "-1": "var(--bng-add-red-500)",
  "0": "var(--bng-ter-yellow-100)",
  "1":  "var(--bng-ter-yellow-100)",
  "2": "var(--bng-add-green-100)",
  "3": "var(--bng-add-green-100)",
}
const getProgressBarColor = level => {
  return levelColors[level]
}

</script>

<style scoped lang="scss">
.invisible {
  background-color: rgba(var(--bng-cool-gray-900-rgb), 0.9) !important;
  pointer-events: none;
}
.card-wrapper {
  cursor: pointer !important;
  &[disabled] {
    pointer-events: none;
  }
  &:focus,
  &:hover {
    background-color: rgba(var(--bng-cool-gray-700-rgb), 0.9) !important;
  }
  background-color: rgba(var(--bng-cool-gray-800-rgb), 0.9);
  border-radius: var(--bng-corners-2);
  flex: 1 1 auto;
  padding: 0.5rem;
  height: 100%;
  color: white;
  display: flex;
  flex-flow:column;


  > .header {
    flex: 0 0 auto;
    align-items: auto;
    display: flex;
    flex-flow: row;
    > .name {
      font-weight: 800;
      font-size: 1.25rem;
      flex: 1 1 auto;
      padding-bottom: 0.75rem;
    }
    .glyph {
      font-size: 2rem;
      align-self: start;
    }

    .empty {
      opacity: 0.25;
      justify-content: center;
      align-items: center;
      font-weight: 50;
      color: rgba(var(--bng-cool-gray-300-rgb), 1);
    }
  }

  .description {
    flex: 1 1 auto;
    padding-bottom: 0.75rem;
  }

  > .flex-row {
    flex: 1 1 auto;
    display:flex;
    flex-flow:row;
    flex-wrap: wrap;
    > * {
      flex: 1 1 auto;
      padding-bottom:0.75rem;
    }
  }

  .pills {
    padding: 0.25rem;
    flex: 1 1 auto;
    display:flex;
    flex-flow:row;
    flex-wrap: wrap;
    > * {
      flex: 1 1 auto;
      padding-bottom:0.75rem;
    }
  }

  > .progress{
    align-items:flex-end;
    :deep(.progress-bar) {
      overflow: hidden;
      border-radius: var(--bng-corners-1);
      height: 0.5rem;
    }
  }


  .center{
    flex: 1 1 auto;
    align-items:center;
    justify-content: center;
  }

}

.gray {
  color: rgba(var(--bng-cool-gray-600-rgb),0.6) !important;
}

</style>
