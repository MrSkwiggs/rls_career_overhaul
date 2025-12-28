<template>
  <InfoCard :header="translatedHeader" headerType="ribbon" class="dynamic" :class="{'experimental':panel.experimental, 'full-height': panel.fullHeight}" :no-blur="noBlur">
    <template #content>
      <div class="ratings" v-if="panel.attempt">
        <div class="prop-container" v-if="panel.attempt.list" >
          <div v-for="(result, index) in mainResults" :key="index"
          class="main-result"
          :class="{
            'unlock-attempt': result.animDelay && !panel.animationFinished,
            'animation-complete': panel.animationFinished
          }">
            <div class="fill unlock-change-background"
            v-if="result.animDelay && !panel.animationFinished"
            :style="{'--animation-delay': result.animDelay}"></div>
            <span class="main-label">{{ $t(result.label) }}</span>
            <span class="main-value"
            v-if="result.value.text !== 'true' && result.value.text !== 'false'"
            :class="{
              'thump': result.animDelayThump && !panel.animationFinished,
              'animation-complete': panel.animationFinished
            }"
              :style="{'--animation-delay': result.animDelayThump}">
              {{ valueOf(result.value) }}
            </span>
            <BngIcon
              class="main-value"
              :class="{
                'thump': result.animDelayThump && !panel.animationFinished,
                'animation-complete': panel.animationFinished
              }"
              :style="{'--animation-delay': result.animDelayThump}"
              v-if="result.value.text === 'true'"
              :type="icons.checkmark"
            />
            <BngIcon
              class="main-value"
              :class="{
                'thump': result.animDelayThump && !panel.animationFinished,
                'animation-complete': panel.animationFinished
              }"
              :style="{'--animation-delay': result.animDelayThump}"
              v-if="result.value.text === 'false'"
              :type="icons.mathMultiply"
            />
          </div>
          <BngPropVal class="prop"
          v-for="(attr, index) in nonMainResults"
          :key="index"
          :key-label="$t(attr.label)"
          :value-label="valueOf(attr.value)">
        </BngPropVal>
      </div>
      <template v-if="panel.attempt.grids">
        <Grid v-for="grid in panel.attempt.grids" :grid="grid" />
      </template>
    </div>
    <div class="text-container">
      <DynamicComponent  :template="content" v-if="content && content !== ''"/>
    </div>
  </template>
  </InfoCard>
</template>



<script setup>
import { ref, computed } from "vue"
import { onMounted, onBeforeUnmount } from 'vue';
import { $translate } from "@/services"
import { lua, useBridge } from "@/bridge"
import InfoCard from "../components/InfoCard.vue"
import Grid from "../components/Grid.vue"
import { DynamicComponent } from "@/common/components/utility"
import { BngPropVal, BngIcon, icons } from "@/common/components/base"
import { $content } from "@/services"
const { units } = useBridge()

const props = defineProps({
  panel: {
    type: Object,
    required: true,
  },
  noBlur: {
    type: Boolean,
    default: false
  }
})

let wooshDelays = []
let thumpDelays = []

onMounted(() => {
  console.log('Playing sound TextPanel: onMounted', props.panel.animationFinished)
  if (!props.panel.animationFinished) {
    if (props.panel.attempt && props.panel.attempt.list) {
      // Handle sounds for each main result
      const mainResults = props.panel.attempt.list.filter(item => item.mainResult)
      mainResults.forEach(result => {
        if (result.soundDelay && result.soundDelay > 0) {
          const delay = setTimeout(() => {
            lua.Engine.Audio.playOnce("AudioGui", "event:>UI>Career>EndScreen_Whoosh_Main")
          }, result.soundDelay)
          wooshDelays.push(delay)
        }

        if (result.soundDelayThump && result.soundDelayThump > 0) {
          const delay = setTimeout(() => {
            lua.Engine.Audio.playOnce("AudioGui", "event:>UI>Career>EndScreen_Star_Main")
          }, result.soundDelayThump)
          thumpDelays.push(delay)
        }
      })
    }
  }
});

onBeforeUnmount(() => {
  // Clear all timeouts
  wooshDelays.forEach(delay => clearTimeout(delay))
  thumpDelays.forEach(delay => clearTimeout(delay))
});

function valueOf(x) {
  if(x.format == "distance") {
    return units.buildString('distance', x.distance, 1)
  }

  return x.text
}

const content = computed(() => {
  let txt = props.panel.text
  if (!txt) return ""

  if (typeof txt === 'string') {
    return $content.bbcode.parse($translate.instant(txt))
  }

  if (Array.isArray(txt) && txt.length > 0) {
    let translatedText = txt.map((x) => $translate.contextTranslate(x))
    let ret = translatedText.join('')
    return $content.bbcode.parse(ret)
  }

  return $content.bbcode.parse($translate.contextTranslate(txt))

})

const mainResults = computed(() => {
  if (!props.panel.attempt || !props.panel.attempt.list) return []

  return props.panel.attempt.list.filter(item => item.mainResult)
})

const nonMainResults = computed(() => {
  if (!props.panel.attempt || !props.panel.attempt.list) return []

  return props.panel.attempt.list.filter(item => !item.mainResult)
})

const translatedHeader = computed(() => {
  if (!props.panel.header) return null
  return $translate.instant(props.panel.header)
})

// Add this method to expose cleanup
defineExpose({
  cancelSoundDelays() {
    console.log('MissionTextPanel: Cancelling sound delays', {
      hadWooshDelays: wooshDelays.length,
      hadThumpDelays: thumpDelays.length
    })
    wooshDelays.forEach(delay => clearTimeout(delay))
    thumpDelays.forEach(delay => clearTimeout(delay))
    wooshDelays.length = 0
    thumpDelays.length = 0
  }
})

</script>

<style scoped lang="scss">
.dynamic {
  :deep(.info-content) {
    padding: 0 1rem;
    :first-child {
      margin-top: 0;
    }
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .text-container {
    text-align: justify;
  }

}

.full-height {
  height: 100%;
}

.ratings {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  .prop-container {
    display: flex;
    flex-wrap: wrap;
    flex: 1 1 auto;
  }
  .main-result {
    position: relative;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    font-size: 1.5rem;
    font-weight: bold;
    background-color: rgba(var(--bng-cool-gray-900-rgb), 0.6);
    border-radius: var(--bng-corners-2);
    overflow: hidden;

    &.unlock-attempt {
      .main-value {
        font-size: 2.5rem;
        align-self: flex-end;
        //animation: value-highlight 2.5s infinite;
      }
    }
  }
  .main-label {
    color: var(--bng-text-primary);
  }
  .main-value {
    color: var(--bng-text-accent);
    opacity: 1;

    &.thump {
      animation: thump-animation 0.55s ease-in forwards, value-highlight 2.5s infinite;
      animation-delay: var(--animation-delay);
      opacity: 0;
    }
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

  .fill {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: var(--bng-corners-2);
  }

  .unlock-change-background {
    &::before {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      border-radius: var(--bng-corners-2);
      background-image: linear-gradient(90deg,
        rgba(255, 255, 255, 0.10) 0%,
        rgba(255, 255, 255, 0.10) 50%,
        rgba(255, 255, 255, 0.25) 74%,
        rgba(255, 255, 255, 0.10) 74.2%,
        rgba(255, 255, 255, 0.00) 100%);
      background-size: 400% 100%;
      background-position: 100% 50%;
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      padding: 0.125rem;
      animation: unlocked-animation 2s cubic-bezier(0.45, 0.01, 0.1, 1) forwards;
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
    background-size: 400% 100%;
    background-position: 100% 50%;
    animation: unlocked-animation 1s cubic-bezier(0.45, 0.01, 0.1, 1) forwards;
    animation-delay: var(--animation-delay);
  }
}

@keyframes unlocked-animation {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes thump-animation {
  0% {
    transform: scale(2);
    opacity: 0;
  }

  70% {
    transform: scale(1.2);
    opacity: 0.7;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes value-highlight {
  0% {
    opacity: 1;
    color: var(--bng-text-accent);
  }
  35% {
    opacity: 1;
    color: var(--bng-orange-400);
  }
  70% {
    opacity: 1;
    color: var(--bng-text-accent);
  }
}

.experimental {
  :deep(.card-cnt) {
    border: 2px solid rgba(220,0,0, 0.8);
    background-color: rgba(22,0,0, 0.6);
  }
  :deep(.card-heading) {
    &.heading-style-ribbon::before {
      background: rgba(220,0,0, 0.8);
    }
  }
}

.animation-complete {
  &.main-result {
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
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
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

  .main-value {
    opacity: 1;
    transform: scale(1);
  }
}

</style>
