<template>
  <div :class="{
    inactive: !star.enabled,
    unlocked: star.unlocked && !star.unlockAttempt,
    'unlock-attempt': star.unlockAttempt && !star.animationFinished,
    'animation-complete': star.animationFinished && star.unlockAttempt
  }" class="task-item">
    <!--
    {{star.unlocked}}
    {{star.unlockAttempt}}
     {{star.key}}
  -->
    <!-- powerfull animation when the objective is achieved for the first time -->
    <div class="fill unlock-change-background"
     v-if="star.unlockAttempt && !star.animationFinished"
     :style="{ '--animation-delay': star.animDelay  }"></div>
    <div class="icons-wrapper">
      <BngIcon
        v-if="star.unlockChange && !star.animationFinished"
        class="task-icon fill"
        :type="icons.starSecondary"
        :color="starColorLocked"
      />
      <BngIcon
        class="task-icon"
        :type="starIconType"
        :color="starColor"
        :style="{ '--animation-delay': star.animDelayThump, '--star-color': starColor }"
        :class="{
          'thump': star.unlockChange && !star.animationFinished,
          'unlock-change-star': star.unlockChange && !star.animationFinished,
          'animation-complete': star.animationFinished && star.unlockChange
        }"
      />
      <!-- powerfull animation when the objective is achieved for the first time -->
      <!--
      <BngIcon
        class="task-icon fill unlock-change-star"
        :type="icons.star"
        v-if="star.unlockChange"
      />-->
    </div>
    <div>
      <span class="task-description">
        {{ $ctx_t(star.label) }}
        <!--
        <BngIcon
          class="task-icon checkmark"
          v-if="star.unlocked"
          :type="icons.checkmark"
        />-->
      </span>
      <div v-if="star.message" class="task-description-message">
        <BngIcon class="task-description-message-icon " :type="icons.info" />
        <div>
          {{ star.message }}
        </div>
      </div>
      <div v-if="hasRewards && !noRewards && !simple" class="task-description-message">
        <RewardsPills class="tiny-rewards" :rewards="star.rewards" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { BngIcon, icons } from "@/common/components/base"
import RewardsPills from "../../career/components/progress/RewardsPills.vue"
import { computed } from "vue"
import { onMounted, onBeforeUnmount } from 'vue';
import { lua } from "@/bridge"

const LOCKED_STAR_COLOR = "rgba(255, 255, 255, 0.2)"
const DEFAULT_STAR_LOCKED_COLOR = "rgba(var(--bng-ter-yellow-50-rgb), 0.5)"
const DEFAULT_STAR_UNLOCKED_COLOR = "var(--bng-ter-yellow-50)"
const BONUS_STAR_LOCKED_COLOR = "rgba(var(--bng-add-blue-400-rgb), 0.5)"
const BONUS_STAR_UNLOCKED_COLOR = "var(--bng-add-blue-400)"

const props = defineProps({
  star: {
    type: Object,
    required: true
  },
  noRewards: {
    type: Boolean,
    default: false
  },
  simple: Boolean
})

const starColor = computed(() => {
  if (props.star.isDefaultStar) {
    return props.star.unlocked ? DEFAULT_STAR_UNLOCKED_COLOR : DEFAULT_STAR_LOCKED_COLOR
  } else {
    return props.star.unlocked ? BONUS_STAR_UNLOCKED_COLOR : BONUS_STAR_LOCKED_COLOR
  }
})

const starColorLocked = computed(() => {
  if (props.star.isDefaultStar) {
    return DEFAULT_STAR_LOCKED_COLOR
  } else {
    return  BONUS_STAR_LOCKED_COLOR
  }
})

const hasRewards = computed(() => {
  return props.star.rewards && props.star.rewards.length && props.star.rewards.length > 0
})

const starIconType = computed(() => props.star.unlocked ? icons.star : icons.starSecondary)

let wooshDelay;
let thumpDelay;

const DEFAULT_STAR_WOOSH = "event:>UI>Career>EndScreen_Whoosh_Main"
const DEFAULT_STAR_THUMP = 'event:>UI>Career>EndScreen_Star_Main'
const BONUS_STAR_WOOSH = "event:>UI>Career>EndScreen_Whoosh_Bonus"
const BONUS_STAR_THUMP = 'event:>UI>Career>EndScreen_Star_Bonus'

onMounted(() => {
  if (!props.star.animationFinished) {
    if(props.star.soundDelay && props.star.soundDelay > 0)
      wooshDelay = setTimeout(() => {
        lua.Engine.Audio.playOnce("AudioGui", props.star.isDefaultStar ? DEFAULT_STAR_WOOSH : BONUS_STAR_WOOSH);
        //console.log('Objective: Playing sound delay', props.star.soundDelay, props.star.isDefaultStar ? DEFAULT_STAR_WOOSH : BONUS_STAR_WOOSH)
      }, props.star.soundDelay);

    if(props.star.soundDelayThump && props.star.soundDelayThump > 0)
      thumpDelay = setTimeout(() => {
        lua.Engine.Audio.playOnce("AudioGui", props.star.isDefaultStar ? DEFAULT_STAR_THUMP : BONUS_STAR_THUMP);
        //console.log('Objective: Playing sound delay', props.star.soundDelayThump, props.star.isDefaultStar ? DEFAULT_STAR_THUMP : BONUS_STAR_THUMP)
      }, props.star.soundDelayThump);
  }
});

onBeforeUnmount(() => {
  clearTimeout(wooshDelay);
  clearTimeout(thumpDelay);
});

// Add this method to expose cleanup
defineExpose({
  cancelSoundDelays() {
    console.log('Objective: Cancelling sound delays', {
      hadWooshDelay: !!wooshDelay,
      hadThumpDelay: !!thumpDelay
    })
    clearTimeout(wooshDelay)
    clearTimeout(thumpDelay)
    wooshDelay = null
    thumpDelay = null

  }
})
</script>

<style scoped lang="scss">
.task-item {
  display: flex;
  padding: 0.25rem 0.45rem;
  align-items: center;
  position: relative;
  background-image: linear-gradient(to right,
    rgba(var(--bng-cool-gray-900-rgb), 0.3) 0%,
    rgba(var(--bng-cool-gray-900-rgb), 0.0) 75%,
    );
    border-radius: var(--bng-corners-2);
}

.icons-wrapper {
  display: inline-block;
  position: relative;
}

.task-icon {
  font-size: 2em;
  padding-right: 0.25rem;
}

.checkmark {
  font-size: 1em;
  right: 0;
  bottom: 0.15em;
}

.task-description {
  font-weight: 600;
}

.task-description-message {
  font-weight: 400;
  font-size: 0.9em;
  display: flex;
  align-items: center;
  padding-top: 0.2rem;
  padding-bottom: 0.2rem;
  height: 1.6rem;
}
.task-description-message-icon {
  font-size: 0.9rem;
  padding-right: 0.1rem;
}

.inactive .task-description {
  text-decoration: line-through;
  color: gray;
}

.inactive .task-description-message {
  color: white;
}

.inactive :deep(.value-label) {
  color: gray;
  text-decoration: line-through;
}

.inactive :deep(.pill) {
  opacity: 0.5 !important;
}

.tiny-rewards {

  :deep(.pill) {
    font-size: 0.7rem;
    opacity: 0.9;
  }

  :deep(.value-label) {
    font-weight: 400;
  }
}

.unlocked {


  background-image: linear-gradient(to right,
    rgba(var(--bng-cool-gray-800-rgb), 0.55) 0%,
    rgba(var(--bng-cool-gray-900-rgb), 0.00) 75%,
    );
}

.unlock-attempt {
  --animation-delay: 2s;
  :deep(.pill) {
    //animation: pill-blink 2.5s infinite ; /* Smooth loop */
    //animation-delay: var(--animation-delay);
  }
}
@keyframes pill-blink {
  0% {
    background-color: rgba(var(--bng-cool-gray-900-rgb), 0.5)
  }

  35% {
    background-color: rgba(var(--bng-orange-700-rgb), 0.5)
  }

  70% {
    background-color: rgba(var(--bng-cool-gray-900-rgb), 0.5)
  }
}

.fill {
  position: absolute;
  top:0; bottom:0; left:0; right:0;
  border-radius: var(--bng-corners-2);
}

.unlock-change-background {
  --animation-delay: 0s;
  &::before {
    content: '';
    position: absolute;
    top:0; bottom:0; left:0; right:0;
    border-radius: var(--bng-corners-2);
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
    animation: unlocked-animation 2s cubic-bezier(0.45, 0.01, 0.1, 1) forwards ; /* Smooth loop */
    animation-delay: var(--animation-delay);
  }

  background-image: linear-gradient(90deg,
    rgba(var(--bng-orange-500-rgb), 0.80) 0%,
    rgba(var(--bng-orange-500-rgb), 0.70) 0.25rem,
    rgba(var(--bng-orange-500-rgb), 0.25) 3rem,
    rgba(var(--bng-orange-500-rgb), 0.25) 50%,
    rgba(255, 255, 255, 0.15) 74%,
    rgba(255, 255, 255, 0.00) 74.2%,
    rgba(255, 255, 255, 0.00) 100%);

  background-size: 400% 100%; /* Makes the background larger to move */
  background-position: 100% 50%; /* Initial position */
  animation: unlocked-animation 1s cubic-bezier(0.45, 0.01, 0.1, 1) forwards ; /* Smooth loop */
  animation-delay: var(--animation-delay);
}

@keyframes unlocked-animation {
  0% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}


.unlock-change-star {
}
.thump {
  animation:
    thump-animation 0.55s ease-in  forwards,
    unlocked-change 2s ease-in-out infinite ; /* Smooth loop */
  animation-delay: var(--animation-delay);
  opacity: 0;
}

@keyframes unlocked-change {
  0% {
    color: var(--star-color);
  }

  50% {
    color: white;
  }

  100% {
    color: var(--star-color);
  }
}



@keyframes thump-animation {
  0% {
    transform: scale(4);
    opacity: 0;
  }

  25% {
    opacity: 0;
  }

  70% {
    transform: scale(3) ;
    opacity: 0.7;
  }


  100% {
    transform: scale(1) ;
    opacity: 1;
  }
}

.animation-complete {
  opacity: 1;
  transform: scale(1);

  &.task-item {
    background-image: linear-gradient(90deg,
      rgba(var(--bng-orange-500-rgb), 0.80) 0%,
      rgba(var(--bng-orange-500-rgb), 0.70) 0.25rem,
      rgba(var(--bng-orange-500-rgb), 0.25) 3rem,
      rgba(var(--bng-orange-500-rgb), 0.25) 50%,
      rgba(255, 255, 255, 0.15) 74%,
      rgba(255, 255, 255, 0.00) 74.2%,
      rgba(255, 255, 255, 0.00) 100%);
    background-position: 0% 50%;
    background-size: 400% 100%;
    position: relative;

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
}

</style>
