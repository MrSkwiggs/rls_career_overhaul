<template>
  <div class="main-container drift-app">
    <div class="cached-score-wrapper">
      <div class="fail-overlay" :class="{ active: isFailActive }"></div>
      <div class="performance-background" :class="performanceBgClass" :style="performanceTransformStyle"></div>
      <template v-if="centerFailMessage">
        <div class="center" :class="{ 'fade-out': isCenterMessageFading }">
          {{centerFailMessage}}
        </div>
      </template>
      <template v-else-if="centerMessage">
        <div class="center" :class="{ 'fade-out': isCenterMessageFading }">
          {{centerMessage}}
          <template v-if="centerMessage && scoreToAdd >= 0">{{scoreToAdd}}</template>
        </div>
      </template>
      <template v-else>
        <div class="added-score">
          <div v-for="(item, index) in bonusDisplay" :key="index" class="score-item">
            +{{ ~~item.score }}
          </div>
        </div>
        <div class="cached-score">
          <div class="score-container">
            <div class="score-modifier"
                 :key="currentModifier"
                 :class="{ 'fade-out': isModifierFading }"
                 @transitionend="onModifierTransitionEnd">
              {{ currentModifier }}
            </div>
            <div class="score">{{ realtimeScorePoints }}</div>
          </div>
          <div class="combo-wrapper">
            <svg :id="`svg_${bgId}`" class="combo" viewBox="0 0 100 30" style="width: 100%; height: 3rem;" :style="comboVarsStyle" preserveAspectRatio="xMinYMid meet">
              <defs>
                <linearGradient :id="`grad_${bgId}`" :x1="'0%'" :y1="'0%'" :x2="'0%'" :y2="'100%'">
                  <stop offset="50%" stop-color="var(--bng-ter-yellow-100)" />
                  <stop offset="51%" :stop-color="realtimeScoreCombo >= 25 ? '#ff8400' : '#fff'" />
                  <stop offset="75%" :stop-color="realtimeScoreCombo >= 25 ? '#ff8400' : '#fff'" />
                </linearGradient>
                <mask :id="`mask_${bgId}`">
                  <text class="multiplier" x="0" y="15.5" fill="#fff" dominant-baseline="hanging" text-anchor="start"
                        :style="{ fontSize: '1.9rem' }">
                    ×{{ formattedCombo }}
                  </text>
                </mask>
              </defs>
              <g :mask="`url(#mask_${bgId})`">
                <rect width="100%" height="4.2rem" x="0" y="15.5" :fill="`url(#grad_${bgId})`" class="animated-rect" />
              </g>
            </svg>
          </div>
        </div>
      </template>
    </div>
    <div class="remaining-time">
      <div class="wrapper">
        <div class="bar" :class="barClass" :style="barVarsStyle"></div>
      </div>
    </div>

    <div class="drift-bar">
      <div class="drift-scale">
        <div class="drift-progress-bar">
          <div class="progress-fill" :style="driftProgressStyle"></div>
        </div>
        <div class="value-marks" :key="layoutVersion">
          <div v-for="(threshold, index) in thresholds" class="line" :key="threshold" :style="{
            position: 'absolute',
            left: tickLefts[index],
            width: '0.125rem',
            height: '0.24rem',
            transform: threshold === 0 ? 'translateX(-50%)' : threshold > 0 ? 'translateX(-100%)' : 'translateX(0%)',
            backgroundColor: 'white'
          }"></div>
        </div>
      </div>
      <div class="drift-labels" :key="layoutVersion">
        <span v-for="(threshold, index) in thresholds" :key="threshold" :style="{
          position: 'absolute',
          left: tickLefts[index],
          transform: 'translateX(-50%)',
          textAlign: 'center'
        }">
          {{ threshold === 0 ? `${formattedRealtimeAngle}°` : `${Math.abs(threshold)}°` }}
        </span>
      </div>
      <BngFlashMessage v-if="props.showFlash" message-source="DriftFlashMessage"/>
    </div>
  </div>

</template>

<script setup>
import { useEvents, useStreams } from '@/services/events'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { icons } from "@/common/components/base"
import { uniqueId } from "@/services/uniqueId"
import { BngFlashMessage } from '@/common/components/appsUtilities'
import { useBridge } from "@/bridge"

// Props
const props = defineProps({
  showFlash: {
    type: Boolean,
    default: true
  }
})

const { lua } = useBridge()

const bgId = uniqueId("", "_")

const events = useEvents()

const realtimeScorePoints = ref(0)
const realtimeScoreCombo = ref(0)
const creep = ref(0)
const remainingComboTime = ref(0)

const centerIcon = ref(null)

const centerMessage = ref(null)
const centerFailMessage = ref(null)

// unused refs removed

const scoreToAdd = ref(0)
let countdownTimer = null
let countdownStartTime = null
let delayTimer = null // to track the 1-second delay after countdown
let startTimer = null
let centerMessageTimer = null
// unused timer removed

let bonusDisplayAdd = null
let bonusDisplayDispose = null
// unused flag removed

const bonusQueue = ref([])
const bonusDisplay = ref([])

const realtimeAngle = ref(0)

const steppedPerformanceFactor = ref(1)
const isCenterMessageFading = ref(false)
const isFailActive = ref(false)
const isFailAnimating = ref(false)

let failAnimationStartTime = null
let failAnimationTimer = null
// removed unused failAnimationProgress

const FAIL_ANIMATION_DURATION = 900 // milliseconds

const currentModifier = ref(null)
const isModifierFading = ref(false)
let modifierTimer = null

onMounted(() => {
  // Throttle high-frequency updates to 60fps
  let rafScheduled = false
  const buffered = { points: 0, combo: 0, remaining: 0, creep: 0, angle: 0 }
  const flushBuffered = () => {
    realtimeScorePoints.value = buffered.points
    realtimeScoreCombo.value = buffered.combo
    remainingComboTime.value = buffered.remaining
    creep.value = buffered.creep
    realtimeAngle.value = buffered.angle
    rafScheduled = false
  }
  const scheduleFlush = () => {
    if (!rafScheduled) {
      rafScheduled = true
      requestAnimationFrame(flushBuffered)
    }
  }
  const streamsList = ['drift']
  useStreams(streamsList, (streams) => {
    for (const stream of streamsList) { if (!streams[stream]) { return } }
    //setDriftRealtimeScore
    buffered.points = streams.drift.realtimeCachedScoreFloored
    buffered.combo = streams.drift.realtimeCombo
    if (buffered.points > 0)
      centerMessage.value = null

    //setDriftRemainingComboTime
    buffered.remaining = streams.drift.realtimeRemainingComboTime

    //setDriftRealtimeCreep
    buffered.creep = streams.drift.realtimeCreep

    //setDriftRealtimeAngle
    buffered.angle = -streams.drift.realtimeAngle

    //setDriftPerformanceFactor
    steppedPerformanceFactor.value = streams.drift.realtimePerformanceFactor

    scheduleFlush()
  })
  // These hooks have been merged into streams
  //setDriftRealtimeScore
  //setDriftRemainingComboTime
  //setDriftRealtimeCreep
  //setDriftRealtimeAngle
  //setDriftPerformanceFactor

  //these hooks are still one-time events
  //setDriftRealtimeFail
  //setDriftPersistentDriftScored
  //displayDriftScoreModifier


/**
  events.on('setDriftRealtimeScore', (points, combo) => {
    buffered.points = points
    buffered.combo = combo
    centerMessage.value = null
    scheduleFlush()
  })
  events.on('setDriftRemainingComboTime', (val) => {
    buffered.remaining = val
    scheduleFlush()
  })
  events.on('setDriftRealtimeCreep', (val) => {
    buffered.creep = val
    scheduleFlush()
  })
  events.on('setDriftRealtimeAngle', (angle) => {
    buffered.angle = -angle
    scheduleFlush()
    })
  events.on('setDriftPerformanceFactor', (factor) => {
    steppedPerformanceFactor.value = factor
  })
  */
  events.on('setDriftRealtimeFail', (reason, icon) => {
    cancelTimers()
    isFailActive.value = true
    isFailAnimating.value = true
    isCenterMessageFading.value = false
    centerFailMessage.value = reason
    centerIcon.value = icon ? icon : ''
    bonusDisplay.value = []
    creep.value = 0

    // Store the current combo time
    const initialComboTime = remainingComboTime.value

    // Animate the timer bar
    failAnimationStartTime = performance.now()
    const animateFailBar = (timestamp) => {
      const elapsed = timestamp - failAnimationStartTime
      const progress = Math.max(0, 1 - (elapsed / FAIL_ANIMATION_DURATION))
      remainingComboTime.value = initialComboTime * progress

      if (progress > 0) {
        failAnimationTimer = requestAnimationFrame(animateFailBar)
      }
    }
    failAnimationTimer = requestAnimationFrame(animateFailBar)

    // Clear any existing timeout
    if (centerMessageTimer) clearTimeout(centerMessageTimer)
    // Reset fail overlay and animation state after animation
    setTimeout(() => {
      isFailActive.value = false
      isFailAnimating.value = false
      remainingComboTime.value = 0
      if (failAnimationTimer) {
        cancelAnimationFrame(failAnimationTimer)
        failAnimationTimer = null
      }
    }, FAIL_ANIMATION_DURATION)
    // First set the fading class
    centerMessageTimer = setTimeout(() => {
      isCenterMessageFading.value = true
    }, 1000)
    // Then clear the message after animation completes
    setTimeout(() => {
      centerFailMessage.value = null
      centerIcon.value = null
      isCenterMessageFading.value = false
    }, 1500)
  })
  events.on('setDriftPersistentDriftScored', (final, score, combo) => {
    centerMessage.value = "+ "
    scoreToAdd.value = final
    bonusDisplay.value = []
    startCountdown()
  })
  // Simplify fade-out with single transitionend
  events.on('displayDriftScoreModifier', (msg) => {
    if (modifierTimer) clearTimeout(modifierTimer)
    isModifierFading.value = false
    currentModifier.value = msg
    modifierTimer = setTimeout(() => {
      isModifierFading.value = true
    }, 1500)
  })

})



onUnmounted(() => {
  cancelTimers()
  if (centerMessageTimer) clearTimeout(centerMessageTimer)
  clearInterval(bonusDisplayAdd)
  clearInterval(bonusDisplayDispose)


  if (failAnimationTimer) {
    cancelAnimationFrame(failAnimationTimer)
  }

  if (modifierTimer) clearTimeout(modifierTimer)
  window.removeEventListener('resize', onResize)
})


// COMBO TIME: move to CSS vars and class
const barClass = computed(() => ({
  'bar-good': !isFailAnimating.value && steppedPerformanceFactor.value >= 3,
  'bar-warn': !isFailAnimating.value && steppedPerformanceFactor.value < 3,
  'bar-fail': isFailAnimating.value
}))
const barVarsStyle = computed(() => ({
  '--bar-scale': String(Math.max(0, Math.min(1, remainingComboTime.value))),
  '--bar-visible': remainingComboTime.value <= 0.01 ? 'hidden' : 'visible' // item 14: disabled
}))

// Drift progress style via single transform update, negative scale for negative angles
const driftProgressStyle = computed(() => {
  const pos = Math.abs(calculatePosition(realtimeAngle.value, thresholds, positions)) / 100
  const dir = realtimeAngle.value > 0 ? 1 : -1
  return {
    left: '50%',
    width: '50%',
    transform: `scaleX(${(dir > 0 ? 1 : -1) * (pos / 2)})`,
    opacity: Math.abs(realtimeAngle.value) < 7 ? '0.65' : '1'
  }
})

// Computed formatting
const formattedCombo = computed(() => parseFloat(realtimeScoreCombo.value).toFixed(1))
const formattedRealtimeAngle = computed(() => Math.abs(Math.round(realtimeAngle.value)))

// Precompute tick lefts, update on resize
const layoutVersion = ref(0)
const tickLefts = computed(() => positions.map((p) => `${(p + 100) / 2}%`))
const onResize = () => { layoutVersion.value++ }
  window.addEventListener('resize', onResize)


function cancelTimers() {
  if (countdownTimer) {
    cancelAnimationFrame(countdownTimer)
    countdownTimer = null
  }
  if (delayTimer) {
    clearTimeout(delayTimer)
    delayTimer = null
  }
  if (startTimer) {
    clearTimeout(startTimer)
    startTimer = null
  }
  if (failAnimationTimer) {
    cancelAnimationFrame(failAnimationTimer)
    failAnimationTimer = null
  }
}

function startCountdown() {
  // Cancel any existing timers before starting a new countdown
  cancelTimers()

  startTimer = setTimeout(() => {
    const initialScore = scoreToAdd.value
    const scoreDwindleAnimDuration = 1000

    function countdown(timestamp) {
      if (!countdownStartTime) countdownStartTime = timestamp
      const elapsedTime = timestamp - countdownStartTime

      if (elapsedTime >= scoreDwindleAnimDuration) {
        scoreToAdd.value = 0
        countdownStartTime = null

        delayTimer = setTimeout(() => {
          scoreToAdd.value = -1
          centerMessage.value = null
          realtimeScorePoints.value = 0
          realtimeScoreCombo.value = 0
          creep.value = 0
          delayTimer = null
        }, 1000)
      } else {
        scoreToAdd.value = Math.floor(initialScore * (1 - elapsedTime / scoreDwindleAnimDuration))
        countdownTimer = requestAnimationFrame(countdown)
      }
    }

    countdownTimer = requestAnimationFrame(countdown)
  }, 1250) // delay by 1.25s
}

// Threshold angles in degrees, defining key positions along the gauge
const thresholds = [-110, -60, -20, 0, 20, 60, 110];

// Corresponding positions on the gauge from -100% to 100%
const positions = [-100, -70, -35, 0, 35, 70, 100];

// Single interpolation function to map the input angle to the gauge position
const calculatePosition = (y, thresholds, positions) => {
  // Clamp input value within the bounds of the thresholds
  const clampedY = Math.max(thresholds[0], Math.min(thresholds[thresholds.length - 1], y));

  // Iterate through the threshold intervals to find the current segment
  for (let i = 0; i < thresholds.length - 1; i++) {
    if (clampedY >= thresholds[i] && clampedY <= thresholds[i + 1]) {
      // Linear interpolation within the current segment
      const t = (clampedY - thresholds[i]) / (thresholds[i + 1] - thresholds[i]);
      return positions[i] + t * (positions[i + 1] - positions[i]);
    }
  }

  // Return center position if something goes wrong (fallback)
  return 0;
}

// 10) CSS classes/vars for performance background
const performanceBgClass = computed(() => ({
  'perf-good': steppedPerformanceFactor.value >= 3,
  'perf-warn': steppedPerformanceFactor.value < 3
}))
const performanceTransformStyle = computed(() => {
  // Avoid scale(0) visual pop by clamping to a tiny epsilon and fading via opacity
  const sRaw = Math.min(steppedPerformanceFactor.value / 3, 1)
  const s = sRaw === 0 ? 0.001 : sRaw
  return { transform: `scale(${s})`, transformOrigin: 'center bottom', opacity: sRaw === 0 ? 0 : 1 }
})

// 9) transitionend handler for modifier
function onModifierTransitionEnd(e) {
  if (e.propertyName !== 'opacity') return
  if (!isModifierFading.value) return
  currentModifier.value = null
  isModifierFading.value = false
}

// 10) CSS vars for dynamic styles (combo svg and rect)
const comboVarsStyle = computed(() => ({
  '--combo-glow-color': realtimeScoreCombo.value >= 25 ? '210, 110, 0' : '255, 255, 0',
  '--combo-glow-alpha': String(creep.value),
  '--combo-rect-translate': `${-creep.value * 2}rem`
}))

// Bonus display timers on-demand
function ensureBonusTimers() {
  if (!bonusDisplayAdd && bonusQueue.value.length > 0) {
    bonusDisplayAdd = setInterval(() => {
      if (bonusQueue.value.length === 0) return
      const item = bonusQueue.value.pop()
      bonusDisplay.value.unshift(item)
    }, 500)
  }
  if (!bonusDisplayDispose && bonusDisplay.value.length > 0) {
    bonusDisplayDispose = setInterval(() => {
      if (bonusDisplay.value.length > 0) {
        bonusDisplay.value.pop()
      }
    }, 10000)
  }
  if (bonusQueue.value.length === 0 && bonusDisplay.value.length === 0) {
    if (bonusDisplayAdd) { clearInterval(bonusDisplayAdd); bonusDisplayAdd = null }
    if (bonusDisplayDispose) { clearInterval(bonusDisplayDispose); bonusDisplayDispose = null }
  }
}

// Hook ensure timers when queue changes
watch(bonusQueue, ensureBonusTimers, { deep: true })
watch(bonusDisplay, ensureBonusTimers, { deep: true })

// TODO: Review and remove unused refs/imports (zoneName, type, score, icon, remainingTimer, centerIcon, icons import)
// TODO: Consider extracting subcomponents for Score/Combo/RemainingTimeBar/BonusList/FailOverlay

onMounted(() => {
  lua.extensions.gameplay_drift_general.onDriftAppMounted()
})

onUnmounted(() => {
  lua.extensions.gameplay_drift_general.onDriftAppUnmounted()
})

</script>

<style scoped lang="scss">
@use "@/styles/modules/_mixins" as mixins;
$FAIL_ANIMATION_DURATION: 900;
$score-z-index: 2;
$z-index-step: 2;

.main-container{
  padding-right: 1rem;
  padding-left: 1rem;
  color: white;
  font-size: 1rem;
  font-family: Overpass-mono, var(--fnt-defs);
  display: flex;
  flex-direction:column;
  height: auto;
  .cached-score-wrapper {
    position: relative;
    height: 1.5em;


    .performance-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      transform-origin: bottom;
      transition: transform 0.3s ease;
      z-index: -1;

      &::before,
      &::after {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        transition: opacity 0.35s ease;
      }

      &::before {
        background: radial-gradient(
          ellipse at center bottom,
          oklch(80.6% 0.1498 145 / 1),
          oklch(80.6% 0.1498 145 / 0.8) 20%,
          oklch(80.6% 0.1498 145 / 0.4) 50%,
          transparent 70%
        );
        opacity: var(--good-opacity, 0);
      }

      &::after {
        background: radial-gradient(
          ellipse at center bottom,
          oklch(69.58% 0.2043 43.49 / 1),
          oklch(69.58% 0.2043 43.49 / 0.8) 20%,
          oklch(69.58% 0.2043 43.49 / 0.4) 50%,
          transparent 70%
        );
        opacity: var(--warn-opacity, 0);
      }

      &.perf-good { --good-opacity: 1; --warn-opacity: 0; }
      &.perf-warn { --good-opacity: 0; --warn-opacity: 1; }
    }

    font-size: 2.5rem;
    display: grid;
    gap: 0.5rem;
    grid-template-columns: 1fr auto 1fr;
    justify-content: center;
    align-content: stretch;
    align-items: center;

    font-style: italic;
    flex: 0 0 auto;

    @include mixins.calculate-z-index($score-z-index, $z-index-step, 1);

    .center {
      font-weight: 900;
      letter-spacing: -0.05rem;
      text-shadow: rgb(255, 255, 255) 0 0 2px, rgba(0, 0, 0, 0.4) 0 0 2rem;
      grid-column: 1/-1;
      text-align: center;
      @include mixins.calculate-z-index($score-z-index, $z-index-step, 4);
      transition: transform 0.5s ease, opacity 0.5s ease;

      &.fade-out {
        transform: translateY(2rem);
        opacity: 0;
      }
    }

    .cached-score {
      grid-column: 2 / 2;
      text-align: center;
      font-weight: 800;
      text-shadow: rgb(255, 255, 255) 0 0 1px, rgba(0, 0, 0, 0.4) 0 0 2rem;
      @include mixins.calculate-z-index($score-z-index, $z-index-step, 4);
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 1rem;

      .score-container {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;

        .score-modifier {
          position: absolute;
          left: -1rem;
          transform: translateX(-100%);
          font-size: 1rem;
          font-weight: 400;
          white-space: nowrap;
          opacity: 1;
          animation: popIn 0.1s ease-out;
          transition: opacity 0.3s ease, transform 0.3s ease;

          &.fade-out {
            opacity: 0;
            transform: translateX(10%);
          }
        }
      }

      .score {
        font-size: 2.7rem;
        line-height: 2.7rem;
        margin-left: 1rem;
      }

      .combo-wrapper {
        width: 5rem;
      }
    }
    .combo {
      flex: 0 0 6.5rem;
      position:relative;
      z-index: 0;
      text-shadow: rgb(255, 255, 255) 0 0 1px, rgba(0, 0, 0, 0.4) 0 0 2rem;
      justify-self: start;

      font-size: 1.85rem;
      line-height: 2rem;
      font-weight: 700;

      @include mixins.calculate-z-index($score-z-index, $z-index-step, 4);

      max-height: 100%;

      svg text.multiplier {
        font-size: 2rem;
      }

      .text {
        z-index: 1000;
      }
    }
    /* CSS vars pass-through */
    .combo { filter: drop-shadow(0 0 1rem rgba(0, 0, 0, 0.5)) drop-shadow(0 0 0.5rem rgba(var(--combo-glow-color, 255,255,0), var(--combo-glow-alpha, 0))); }
    .animated-rect { transform: translateY(var(--combo-rect-translate, 0)); }
    .added-score {
      position: relative;
      grid-column: 1 / 1;

      .score-item {
        position: absolute;
        top: 0;
        bottom: 0;
        right: 0;
        opacity: 0;
        // opacity: 1;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        font-size: 2rem;
        font-weight: 800;
        padding-right: 0.25rem;
        transform-origin: 50% 50%;

        animation:
          500ms linear drift-opaque-delay,
          1000ms cubic-bezier(0.355, 0.060, 0.035, 1.000) 500ms drift-fade-out,
          1500ms cubic-bezier(0.355, 0.060, 0.035, 1.000) drift-move-scale;
      }
    }
    .fail-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(0deg,
        rgba(255, 0, 0, 0.5) 0%,
        rgba(255, 0, 0, 0.3) 50%,
        rgba(255, 0, 0, 0) 100%
      );
      opacity: 0;
      pointer-events: none;
      z-index: -1;
      transform-origin: bottom;
      transform: scaleY(0);

      &.active {
        animation: fail-animation #{$FAIL_ANIMATION_DURATION}ms ease-in forwards;
      }
    }
  }
  .remaining-time {
    flex: 0 0 0.25rem;
    display: flex;
    align-items:center;
    .wrapper {
      width: 100%;
      background-color: rgba(255, 255, 255, 0.5);
      position: relative;
      height: 0.25rem;

      .bar {
        background: linear-gradient(0deg, oklch(69.58% 0.2043 43.49) 0%, oklch(69.58% 0.2043 43.49) 0.25rem, oklch(69.58% 0.2043 43.49 / 0.25) 0.251rem, oklch(69.58% 0.2043 43.49 / 0) 1rem);
        position: absolute;
        width: 100%;
        left: 0;
        right: 0;
        transform-origin: center center;
        transform: scaleX(var(--bar-scale, 0));
        top: -1rem;
        bottom: 0;
        @include mixins.calculate-z-index($score-z-index, $z-index-step, 2);
        visibility: var(--bar-visible, hidden);
      }
      .bar.bar-good { background: linear-gradient(0deg, oklch(65% 0.1498 145) 0%, oklch(65% 0.1498 145) 0.25rem, oklch(65% 0.1498 145 / 0.25) 0.251rem, oklch(65% 0.1498 145 / 0) 1rem); }
      .bar.bar-warn { background: linear-gradient(0deg, oklch(69.58% 0.2043 43.49) 0%, oklch(69.58% 0.2043 43.49) 0.25rem, oklch(69.58% 0.2043 43.49 / 0.25) 0.251rem, oklch(69.58% 0.2043 43.49 / 0) 1rem); }
      .bar.bar-fail { background: linear-gradient(0deg, #F00 0%, #F00 0.25rem, rgba(255, 0, 0, 0.25) 0.251rem, rgba(255, 0, 0, 0) 1rem); }
    }
  }
  .drift-bar {
    position: relative;
    flex: 0 0 1rem;
    display: flex;
    flex-flow: column;
    margin-top: 0.25rem;
    .drift-scale {
      position: relative;
      border-top: 0.125rem solid rgba(white, 0.6);
      box-sizing: border-box;
      flex: 0 0 1.25rem;
      .value-marks {
        position: relative;
        width: 100%;
        height: 1rem;
        .line {
          position: absolute;
          width: 0.125rem;
          height: 0.24rem;
          background-color: rgba(white, 0.6);
        }
      }
    }
    .drift-labels {
      position: relative;
      flex: 0 0 1.25rem;
      color: white;
      margin-top: -1rem;

      span {
        &:nth-child(4) { // Center value (realtime angle)
          font-size: 1.4rem;
          font-weight: 800;
        }
      }
    }
  }
}


@keyframes drift-opaque-delay {
  0% {
    opacity: 0.8;
  }
  100% {
    opacity: 0.8;
  }
}

@keyframes drift-move-scale {
  0% {
    transform: translateY(0) scale(1);
  }
  100% {
    transform: translateY(20px) scale(0.6);
  }
}

@keyframes drift-fade-out {
  0% {
    opacity: 0.8;
  }
  15% {
    opacity: 0.6;
  }
  100% {
    opacity: 0;
  }
}

@keyframes fail-animation {
  0% {
    opacity: 1;
    transform: scaleY(1);
  }
  100% {
    opacity: 0;
    transform: scaleY(0);
  }
}

@keyframes popIn {
  0% {
    font-size: 1.3rem;
  }
  100% {
    font-size: 1rem;
  }
}

  .drift-progress-bar {
  position: absolute;
  top: 0rem;
  left: 0;
  width: 100%;
  height: 0.25rem;
  overflow: hidden;

    .progress-fill {
      position: absolute;
      height: 100%;
      background-color: white;
      transform-origin: left center;
      left: 50%;
      width: 50%;
    }
}

</style>