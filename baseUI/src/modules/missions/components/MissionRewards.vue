<template>
   <InfoCard :header="'Rewards'" headerType="ribbon" class="dynamic" :no-blur="noBlur" :style="{ 'animation-delay': animationDelay }">
    <template #content>
      <div v-for="(info, index) in (change?.formattedRewards?.list || [])" :key="index"
          class="rewardInfo"
          :class="{
            'show-reward': animatedRewards.get(index),
            'has-color': info.attributeColor,
            'unlock-attempt': info.animDelay && !change.animationFinished,
            'animation-complete': change.animationFinished
          }"
          :style="[
            info.attributeColor ? {
              '--attribute-color': info.attributeColor
            } : undefined
          ]">
        <div class="background-icon" v-if="info.icon">
          <BngIcon :type="info.icon" />
        </div>

        <div class="reward-top">
          <div class="breakdown">
            <div class="breakdown-grid">
              <template v-for="(bd, bdIndex) in info.breakdown" :key="bdIndex" class="reward-row">
                <div class="breakdown-label" :class="{
                    'show-breakdown-item': animatedBreakdownItems.get(`${index}-${bdIndex}`),
                    'large': bd.large,
                    'show-animation': bd.animDelayShow && !change.animationFinished && !change.skipAnimations,
                    'lerp-animation': bd.animDelayStartLerp && !change.animationFinished && !change.skipAnimations
                  }"
                  :style="{
                    '--show-delay': bd.animDelayShow + 'ms',
                    '--lerp-delay': bd.animDelayStartLerp + 'ms'
                  }">
                  {{ $ctx_t(bd.label) }}
                </div>
                <div class="breakdown-pill" :class="{
                        'show-breakdown-item': animatedBreakdownItems.get(`${index}-${bdIndex}`),
                        'large': bd.large
                      }">
                  <RewardPill
                    :icon="info.icon"
                    :attributeKey="info.attributeKey"
                    :rewardAmount="animatedBreakdownValues.get(`${index}-${bdIndex}`)?.value ?? bd.before"
                    :class="{'highlight-pulse': animatedBreakdownValues.get(`${index}-${bdIndex}`)?.shouldPulse && bd.large}"
                  />
                </div>
              </template>
              <template v-if="info.progressBar">
                <div></div>
                <div class="level-label" :class="{
                  'show-breakdown-item': animatedBreakdownItems.get(`${index}-${info.breakdown.length - 1}`)
                }">
                  Level {{ Math.floor(animatedProgressBars.get(index)?.level ?? info.progressBar.animations[0].level) }}
                </div>
              </template>
            </div>
          </div>
        </div>

        <template v-if="info.progressBar">
          <div class="progress-level-container" :class="{
            'show-breakdown-item': animatedBreakdownItems.get(`${index}-${info.breakdown.length - 1}`)
          }">
            <div class="progress-bar-wrapper">
              <BngProgressBar
                class="slim"
                :class="{ 'animate-progress': showBarAnimations.get(index) }"
                :value="animatedProgressBars.get(index)?.animValue ?? info.progressBar.animations[0].from"
                :max="animatedProgressBars.get(index)?.max ?? info.progressBar.animations[0].max"
                :min="animatedProgressBars.get(index)?.min ?? info.progressBar.animations[0].min"
                :oldValue="animatedProgressBars.get(index)?.from ?? info.progressBar.animations[0].from"
                :showValueLabel="false"
              >
              </BngProgressBar>
            </div>
          </div>
          {{ info.progressBar.skill }}
        </template>



      </div>
    </template>
  </InfoCard>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from "vue"
import { $translate } from "@/services"
import { BngProgressBar, BngIcon, BngUnit, icons, BngCardHeading } from "@/common/components/base"
import RewardPill from "@/modules/career/components/progress/RewardPill.vue"
import { lua, useBridge } from "@/bridge"
import { formatTime } from "@/utils/datetime"
import InfoCard from "../components/InfoCard.vue"
import LeagueRow from "../../career/components/progress/LeagueRow.vue"
import MissionCard from "../../career/components/progress/MissionCard.vue"
import RewardsPills from '../../career/components/progress/RewardsPills.vue'
import BranchSkillProgressBar from "@/modules/career/components/progress/BranchSkillProgressBar.vue"
const { units } = useBridge()

const props = defineProps({
  change: {
    type: Object,
    required: false,
  },
  simple: {
    type: Boolean,
    default: false
  },
  noBlur: {
    type: Boolean,
    default: false
  },
  animationDelay: {
    type: String,
    default: '0s'
  }
})

const showBarAnimations = ref(new Map())
const animatedProgressBars = ref(new Map())
const animatedRewards = ref(new Map())
const animatedBreakdowns = ref(new Map())
const animatedProgressValues = ref(new Map())
const animatedBreakdownItems = ref(new Map())
const animatedBreakdownValues = ref(new Map())
const showProgressBars = ref(new Map())

// Add refs to track timeouts and animation frames
const activeTimeouts = ref([])
const activeAnimationFrames = ref([])

function startAnimations() {
  if (!props.change || !props.change.formattedRewards || !props.change.formattedRewards.list) {
    return
  }

  const skipAnimations = props.change.skipAnimations === true

  const rewardsData = props.change?.formattedRewards?.list || {}
  const rewardsList = Array.isArray(rewardsData) ? rewardsData : Object.values(rewardsData)
  rewardsList.forEach((info, index) => {
    if (skipAnimations) {
      animatedRewards.value.set(index, true)

      if (info.breakdown) {
        info.breakdown.forEach((bd, bdIndex) => {
          animatedBreakdownItems.value.set(`${index}-${bdIndex}`, true)
          animatedBreakdownValues.value.set(`${index}-${bdIndex}`, {
            value: bd.after || 0,
            shouldPulse: false
          })
        })
      }

      if (info.progressBar) {
        showProgressBars.value.set(index, true)
        showBarAnimations.value.set(index, false) // Prevent animation
        const finalAnimation = info.progressBar.animations[info.progressBar.animations.length - 1]
        animatedProgressBars.value.set(index, {
          level: finalAnimation.level,
          animValue: Math.floor(finalAnimation.to),
          min: finalAnimation.min,
          max: finalAnimation.max
        })
      }
      lua.extensions.gameplay_missions_missionScreen.activateSound('money', false, 1)
      return
    }

    // Store timeout references
    const rewardTimeout = setTimeout(() => {
      animatedRewards.value.set(index, true)
    }, info.animDelay || 1000)
    activeTimeouts.value.push(rewardTimeout)

    if (info.breakdown) {
      info.breakdown.forEach((bd, bdIndex) => {
        const breakdownTimeout = setTimeout(() => {
          animatedBreakdownItems.value.set(`${index}-${bdIndex}`, true)
        }, bd.animDelayShow || 1000)
        activeTimeouts.value.push(breakdownTimeout)

        if (bd.animDelayStartLerp === -1) {
          animatedBreakdownValues.value.set(`${index}-${bdIndex}`, {
            value: bd.after || 0,
            shouldPulse: false
          })
        } else {
          const lerpTimeout = setTimeout(() => {
            console.log("index", index, info)
            // Start the sound when lerping begins
            if (bd.soundClass) {
              lua.extensions.gameplay_missions_missionScreen.activateSound(bd.soundClass, true, bd.pitch)
            }

            const startTime = performance.now()
            const startValue = bd.before || 0
            const endValue = bd.after || 0
            const duration = (bd.duration || 1) * 1000

            // For vouchers, schedule individual sounds for each increment
            if (bd.tickingOneShots) {
              console.log("bd.tickingOneShots", bd.tickingOneShots)
              const valueDiff = endValue - startValue
              const timePerIncrement = duration / valueDiff
              for (let i = 0; i < valueDiff; i++) {
                const soundTime = startTime + (i * timePerIncrement)
                console.log("soundTime", soundTime)
                const soundTimeout = setTimeout(() => {
                  lua.Engine.Audio.playOnce('AudioGui', bd.tickingOneShots)
                }, soundTime - performance.now())
                activeTimeouts.value.push(soundTimeout)
              }
            }

            const animate = (currentTime) => {
              const elapsed = currentTime - startTime
              const progress = Math.min(elapsed / duration, 1)
              const currentValue = Math.round(startValue + (endValue - startValue) * progress)

              animatedBreakdownValues.value.set(`${index}-${bdIndex}`, {
                value: currentValue,
                shouldPulse: progress === 1
              })

              if (progress < 1) {
                const animFrame = requestAnimationFrame(animate)
                activeAnimationFrames.value.push(animFrame)
              } else {
                // Stop the sound when lerping is complete
                if (bd.soundClass) {
                  lua.extensions.gameplay_missions_missionScreen.activateSound(bd.soundClass, false, 1)
                }
                if (bd.endSound) {
                  lua.Engine.Audio.playOnce('AudioGui', bd.endSound)
                }
              }
            }

            const initialFrame = requestAnimationFrame(animate)
            activeAnimationFrames.value.push(initialFrame)
          }, bd.animDelayStartLerp || 1000)
          activeTimeouts.value.push(lerpTimeout)
        }
      })
    }

    if (info.progressBar) {
      const lastBreakdownLerpDelay = info.breakdown[info.breakdown.length - 1]?.animDelayStartLerp || 1000

      const progressTimeout = setTimeout(() => {
        showProgressBars.value.set(index, true)
      }, lastBreakdownLerpDelay)
      activeTimeouts.value.push(progressTimeout)

      if (lastBreakdownLerpDelay === -1) {
        const finalAnimation = info.progressBar.animations[info.progressBar.animations.length - 1]
        animatedProgressBars.value.set(index, {
          level: finalAnimation.level,
          animValue: Math.floor(finalAnimation.to),
          min: finalAnimation.min,
          max: finalAnimation.max
        })
      } else {
        const barTimeout = setTimeout(() => {
          showBarAnimations.value.set(index, true)

          // Add this animation logic
          let currentAnimationIndex = 0
          const animate = () => {
            const animation = info.progressBar.animations[currentAnimationIndex]
            if (!animation) return

            // Handle special case where to/max is -1
            if (animation.to === -1 || animation.max === -1) {
              animatedProgressBars.value.set(index, {
                level: animation.level,
                animValue: 100,
                min: 0,
                max: 100,
                from: 0
              })
              return
            }

            const startTime = performance.now()
            const startValue = animation.from
            const endValue = animation.to
            const duration = animation.duration*1000

            const animateFrame = (currentTime) => {
              const elapsed = currentTime - startTime
              const progress = Math.min(elapsed / duration, 1)
              const currentValue = startValue + (endValue - startValue) * progress

              animatedProgressBars.value.set(index, {
                level: animation.level,
                animValue: Math.floor(currentValue),
                min: animation.min,
                max: animation.max,
                from: startValue
              })

              if (progress < 1) {
                const frame = requestAnimationFrame(animateFrame)
                activeAnimationFrames.value.push(frame)
              } else {
                // Play sound if this is not the last animation
                if (currentAnimationIndex < info.progressBar.animations.length - 1) {
                  lua.Engine.Audio.playOnce('AudioGui', 'event:>UI>Career>EndScreen_LevelUp')
                  currentAnimationIndex++
                  animate()
                }
              }
            }

            const frame = requestAnimationFrame(animateFrame)
            activeAnimationFrames.value.push(frame)
          }

          animate()
        }, lastBreakdownLerpDelay)
        activeTimeouts.value.push(barTimeout)
      }
    }
  })
}

function clearAllAnimations() {
  // Stop the sound when animations are cleared
  lua.extensions.gameplay_missions_missionScreen.activateSound('money', false, 1)

  // Clear all timeouts
  activeTimeouts.value.forEach(timeout => clearTimeout(timeout))
  activeTimeouts.value = []

  // Cancel all animation frames
  activeAnimationFrames.value.forEach(frame => cancelAnimationFrame(frame))
  activeAnimationFrames.value = []
}

onMounted(() => {
  startAnimations()
})

// Add this line to allow attributes to pass through
defineOptions({ inheritAttrs: false })

// Add sound cancellation like other components
defineExpose({
  cancelSoundDelays() {
    console.log('MissionRewards: Cancelling sound delays')
    // Add sound delay cancellation if you add sounds later
  }
})

// Watch for changes to skipAnimations
watch(
  () => props.change?.skipAnimations,
  (newValue) => {
    if (newValue === true) {
      // Clear all ongoing animations
      clearAllAnimations()

      // Reset all animation states
      animatedRewards.value = new Map()
      animatedBreakdownItems.value = new Map()
      animatedBreakdownValues.value = new Map()
      showProgressBars.value = new Map()
      animatedProgressBars.value = new Map()
      showBarAnimations.value = new Map()

      // Restart animations with skip
      startAnimations()
    }
  }
)

// Clean up on component unmount
onUnmounted(() => {
  clearAllAnimations()
  lua.extensions.gameplay_missions_missionScreen.activateSound('money', false, 1)
  lua.extensions.gameplay_missions_missionScreen.activateSound('progressBar', false, 1)
})

</script>



<style scoped lang="scss">

.league {
  margin:0.25rem 0;
}
.league-container {
  padding: 1.5rem 0rem;

}

.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20em, 1fr));
  gap: 0.5rem;
  grid-auto-rows: 0.1fr;
  align-items: stretch;
  flex: 1 1 auto;
  .milestone {
    height: 100%;
  }
}

.header {
  padding: 0 1.6em !important;
  margin: 0.25rem 0;
  margin-top: 1rem;
  color: white;
}


.rewardInfo {

  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: var(--bng-corners-2);
  width: 24rem;
  background-color: rgba(var(--bng-cool-gray-900-rgb), 0.5);
  overflow: hidden;

  color: white;
  font-style: normal;
  font-weight: 400;
  letter-spacing: 0.02rem;
  padding: 0.5rem;
  margin-bottom: 0.25rem;

  .background-icon {
    position: absolute;
    top: 0.2rem;
    left: 0.5rem;
    opacity: 0.25;

    pointer-events: none;
    font-size: 4rem;
    transform: rotate(-10deg);
  }

  &.has-color {
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: var(--bng-corners-2);
      background: rgb(var(--attribute-color));
      opacity: 0.15;
      pointer-events: none;
    }
  }


  .name-icon-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .breakdown {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    align-self: flex-start;
    width: 100%;
  }

  .breakdown-grid {
    display: grid;
    grid-template-columns: 2fr 2fr;
    gap: 0.5rem;
    width: 100%;
  }

  .breakdown-label,
  .breakdown-pill {
    opacity: 0;
    transform: translateX(-1rem);
    transition: opacity 0.3s ease, transform 0.3s ease;

    &.show-breakdown-item {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .breakdown-label {
    text-align: center;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    font-size: 1.3rem;
    &.large {
     font-size: 2.4rem;
    }
  }

  .breakdown-pill {
    display: flex;
    justify-content: flex-start;
    font-size: 1.2rem;
  }
  .large {
    font-size: 1.8rem;
    font-weight: 900;
  }

  .progress-value {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    font-size: 1.8rem;
  }

  .reward-top {
    display: flex;
    align-items: center;
    justify-content: center;
    padding-bottom: 0.3rem;

    :deep(.rewards-container) {
      margin: 0;
    }
  }

  .reward-bottom {
    width: 100%;

    :deep(.bng-progress-bar) {
      font-size: 12px;

      .progress-bar {
        height: 0.75em;
      }
    }
  }
}

.tiny-rewards {
  :deep(.rewardInfo) {
    font-size: 2rem;
    opacity: 0.9;
    flex: 1 1 auto;
  }
  gap: 0.25rem;

  :deep(.rewards-container) {
   width: 100%;
  }

  :deep(.value-label) {
    //font-weight: 400;
  }
}

.rewards-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 0.5rem;
}

.animate-progress :deep(.progress-fill) {

}

.slim {
  width: 100%;
  padding-bottom: 0.25rem;
  :deep(.progress-bar) {
    height: 0.75rem;
    border-radius: var(--bng-corners-2);
  }
  &.short {
  }

  &.isMainProgress {
    :deep(.header) {
      font-size: 1.8rem;
      padding-top: 0.5rem;
      padding-bottom: 0.5rem;
    }
    .progress-bar {
      height: 1rem;
    }
  }
}

.progress-level-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-top: 0.25rem;
  opacity: 0;
  transform: translateX(-1rem);
  transition: opacity 0.3s ease, transform 0.3s ease;

  &.show-breakdown-item {
    opacity: 1;
    transform: translateX(0);
  }
}

.level-label {
  font-size: 1.25rem;
  padding: 0.4rem;
  background-color: rgba(var(--bng-cool-gray-900-rgb), 0.5);
  border-radius: var(--bng-corners-2);
  z-index: 10;
  width: fit-content;
  opacity: 0;
  transform: translateX(-1rem);
  transition: opacity 0.3s ease, transform 0.3s ease;

  &.show-breakdown-item {
    opacity: 1;
    transform: translateX(0);
  }
}

.highlight-pulse {
  animation: pulse 0.3s ease-out;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.25);
    filter: brightness(1.5);
  }
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
}

.reward-value {
  .pulse {
    animation: pulse 2s ease-in-out;
  }
}

.unlock-attempt {
  opacity: 1;
}

.animation-complete {
  opacity: 1;
  transform: scale(1);
}





.breakdown-item {
  opacity: 0;
  transform: translateX(-1rem);

  &.show-animation {
    animation: slidey-in 0.5s ease-out forwards;
    animation-delay: var(--show-delay);
  }

  &.lerp-animation {
    animation: value-lerp 1s ease-in-out forwards;
    animation-delay: var(--lerp-delay);
  }
}

@keyframes slidey-in {
  0% {
    opacity: 0;
    transform: translateX(-1rem);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes value-lerp {
  0% {
    color: var(--bng-text-primary);
  }
  50% {
    color: var(--bng-orange-400);
  }
  100% {
    color: var(--bng-text-primary);
  }
}


</style>
