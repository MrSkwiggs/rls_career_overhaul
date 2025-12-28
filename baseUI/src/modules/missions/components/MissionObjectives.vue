<template>
  <InfoCard class="mission-progress" :no-blur="noBlur">
    <template #content>
      <!-- Main Objectives Header -->
      <BngCardHeading v-if="visibleMainStars.length" :type="cardHeadingType" class="header bonus-header">
        Main Objectives
      </BngCardHeading>
      <div v-if="visibleMainStars.length" class="tasks">
        <template v-for="star in visibleMainStars" :key="star.key">
          <Objective :star="star" :no-rewards="noRewards" ref="objectiveRefs" />
        </template>
      </div>

      <!-- Bonus Objectives Header -->
      <BngCardHeading v-if="visibleBonusStars.length" :type="cardHeadingType" class="bonus-header">
        Bonus Objectives
      </BngCardHeading>
      <div v-if="visibleBonusStars.length" class="tasks">
        <template v-for="star in visibleBonusStars" :key="star.key">
          <Objective :star="star" :no-rewards="noRewards" ref="objectiveRefs" />
        </template>
      </div>

      <!-- Message -->
      <div v-if="message && showMessage" class="progress-message">
        Main Objectives are only available with default settings.
      </div>
    </template>
  </InfoCard>
</template>

<script setup>
import { computed, ref } from "vue"
import InfoCard from "../components/InfoCard.vue"
import { BngCardHeading } from "@/common/components/base"
import Objective from './Objective.vue'

const props = defineProps({
  stars: Array,
  message: String,
  showMessage: Boolean,
  noBlur: Boolean,
  noRewards: Boolean,
  noDisabledObjectives: Boolean,
  cardHeadingType: {String, default: 'ribbon'}
})

const objectiveRefs = ref([])

// Filter active stars in simple mode
const visibleMainStars = computed(() => {
  if (!props.stars || !Array.isArray(props.stars)) return []
  const stars = props.stars.filter(star => star.isDefaultStar)
  return !props.noDisabledObjectives ? stars.filter(star => star.enabled) : stars
})

const visibleBonusStars = computed(() => {
  if (!props.stars || !Array.isArray(props.stars)) return []
  const stars = props.stars.filter(star => !star.isDefaultStar)
  return !props.noDisabledObjectives ? stars.filter(star => star.enabled) : stars
})

// Method to cancel all sound delays in child Objective components

// Expose the method to parent components
defineExpose({
  cancelSoundDelays() {
    console.log('MissionObjectives: Cancelling all sound delays')
  if (objectiveRefs.value && objectiveRefs.value.length) {
    objectiveRefs.value.forEach(ref => {
      if (ref && ref.cancelSoundDelays) {
        ref.cancelSoundDelays()
      }
    })
  }
}
})
</script>


<style scoped lang="scss">
.tasks {
  display: grid;
  gap: 0.25rem;
  padding: 0 0.5rem 0.5rem 0.5rem;
}

.progress-message {
  padding-top: 1rem;
}

.bonus-header {
  padding: 0 1.6em !important;
  margin: 0.25rem 0;
}
.header {
  margin-top: 1rem;
}

.mission-progress {
  :deep(.info-content) {
    padding: 0 !important;
  }
  :deep(h2:first-of-type) {
    margin-top: 0;
  }
}
</style>
