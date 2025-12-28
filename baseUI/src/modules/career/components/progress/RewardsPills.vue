<!-- rewardsPills for displaying a list of rewards -->
<template>
  <div class="rewards-pills-container">
    <RewardPill v-for="reward in rewards"
      :icon="reward.icon"
      :hideNumbers="hideNumbers"
      :attributeKey="reward.attributeKey"
      :rewardAmount="reward.rewardAmount"
      :highlight="reward.highlight"
      :backgroundColor="negativeBackground && reward.rewardAmount < 0 ? 'rgba(var(--bng-add-red-700-rgb), 0.5)': undefined">
    </RewardPill>
  </div>
</template>

<script setup>

import RewardPill from "../../components/progress/RewardPill.vue"

const props = defineProps({
  rewards: Object,
  hideNumbers: Boolean,
  negativeBackground: {
    type: Boolean,
    default: true,
  },
})
</script>

<style scoped lang="scss">
.rewards-pills-container {
  display: flex;
  align-items: baseline;
  flex-flow: row wrap;
  margin: -0.125rem;
  > * {
    margin-left: 0.125rem;
    &:first-child {
      margin-left: 0;
    }
  }
}
</style>
