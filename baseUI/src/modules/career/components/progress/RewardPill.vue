<!-- rewardsPills for displaying a list of rewards -->
<template>
  <div class="rewards-pills-container">
    <div class="pill" :style="{backgroundColor: backgroundColor, filter: highlight ? 'brightness(350%)' : ''}">
      <BngUnit
        v-bind="{ [icon ? 'beamXP' : attributeKey]: rewardAmount }"
        :options="hideNumbers ? { formatter: x => null } : null"
        :iconType="icon ? icons[icon] : null"
        :formatter="attributeKey" />
    </div>
  </div>
</template>

<script setup>

import { BngUnit, icons } from "@/common/components/base"

const props = defineProps({
  icon: String,
  attributeKey: String,
  rewardAmount: Number,
  highlight: Boolean,
  hideNumbers: Boolean,
  backgroundColor: {
    type: String,
    default: "rgba(var(--bng-cool-gray-900-rgb), 0.5)",
  },
})

</script>

<style scoped lang="scss">
.rewards-pills-container {
  display: flex;
  align-items: baseline;
  flex-flow: row wrap;
  margin: -0.125rem;
  .pill {
    display: flex;
    border-radius: var(--bng-corners-2);
    margin: 0.125rem;
    padding: 0rem 0.4rem 0.1rem 0.2rem;
    .reward-icon {
      padding-top: 0.15rem;
      padding-right: 0.2rem;
      font-weight: 400;
    }
  }
}
</style>
