<template>
  <LayoutSingle
    class="mission-control-layout"
    :class="{ 'main-sequence': props.mode === 'endScreen' || props.mode === 'test' }"
    bng-ui-scope="mission-control"

    v-bng-on-ui-nav:menu,back="exit"
    v-bng-on-ui-nav:tab_l="focusPreviousPage"
    v-bng-on-ui-nav:tab_r="focusNextPage">
    <div class="top" v-if="header" ref="headerRef">
      <InfoCard class="full-width">
        <template #header>
          <BngAdvCardHeading class="header">
              {{$ctx_t(header.header)}}
          </BngAdvCardHeading>
        </template>
      <!-- </InfoCard>
      <InfoCard class="full-width"> -->
        <template #content>
          <div class="page-navigation" v-if="showPageNavigation">
            <div class="nav-arrow-container nav-left">
              <BngButton
                bng-no-nav="true"
                :accent="ACCENTS.text"
                class="page-nav"
                @click="focusPreviousPage"
                v-if="availablePages.length > 1"
              >
                <BngIcon :type="leftBinding?.displayed ? icons.arrowSmallLeft : icons.arrowLargeLeft" :class="leftIconClass" />
                <BngBinding ref="leftBinding" ui-event="tab_l" controller />
              </BngButton>
            </div>
            <div class="page-buttons" v-if="!simpleStartScreen">
              <div
                v-for="page in availablePages"
                :key="page"
                class="page-icon-wrapper"
              >
                <BngIcon
                  :type="getPageIcon(page)"
                  @click="showPage(page)"
                  class="page-icon-button"
                  :class="{ 'current-page': currentPage === page }"
                />
                <div
                  v-if="shouldShowMandatoryDot(page)"
                  class="mandatory-dot"
                ></div>
              </div>
            </div>
            <div class="nav-arrow-container nav-right">
              <BngButton
                bng-no-nav="true"
                :accent="ACCENTS.text"
                class="page-nav"
                @click="focusNextPage"
                v-if="availablePages.length > 1"
              >
                <BngBinding ref="rightBinding" ui-event="tab_r" controller />
                <BngIcon :type="rightBinding?.displayed ? icons.arrowSmallRight : icons.arrowLargeRight" :class="rightIconClass" />
              </BngButton>
            </div>
          </div>
        </template>
      </InfoCard>
    </div>
    <div v-if="layout" class="columns" ref="wideColumnRef" v-bng-blur="true">
      <SlotSwitcher
        v-for="panel in currentPanels"
        :key="panel.type"
        :slotId="panel.type"
        >
        <template #textPanel>
          <MissionTextPanel
          :ref="(el) => panelRefs[panel.type] = el"
          :panel="panel"
          :no-blur="true"
          :key="panel.key"
          :style="{ 'animation-delay': panel.slideAnimDelay || '0s' }"
          />
        </template>
        <template #crashTestStepDetails>
          <MissionCrashTestStepDetails
          :ref="(el) => panelRefs[panel.type] = el"
          :no-blur="true"
          :key="panel.key"
          :panel="panel"
          />
        </template>
        <template #replayPanel>
          <MissionReplayPanel
          :ref="(el) => panelRefs[panel.type] = el"
          :no-blur="true"
          :key="panel.key"
          :panel="panel"
          @update:panel="updatePanel"
          :style="{ 'animation-delay': panel.slideAnimDelay || '0s' }"
          />
        </template>
        <template #objectives >
          <MissionObjectives
            v-if="panel.formattedProgress"
            :ref="(el) => panelRefs[panel.type] = el"
            :stars="panel.formattedProgress.stars"
            :no-blur="true"

            :key="panel.key"
            :style="{ 'animation-delay': panel.slideAnimDelay || '0s' }"
          />
        </template>
        <!--
        <template #objectiveRewards >
          <MissionObjectives
            v-if="panel.formattedProgress"
            :ref="(el) => panelRefs[panel.type] = el"
            :stars="panel.formattedProgress.stars"
            :key="panel.key"
            :no-blur="true"
            :style="{ 'animation-delay': panel.slideAnimDelay || '0s' }"
          />
        </template>
      -->
        <template #ratings >
          <MissionRatings
            :ratings="panel.progress.formattedProgress"
            :style="{ 'animation-delay': panel.slideAnimDelay || '0s' }"
            :no-blur="true"
            :key="panel.key"
            />
        </template>
        <template #rewards>
          <!-- for some reason the animation delay is not working here and needs to be passed into the component instead of setting the :style -->
          <MissionRewards
            :change="panel.change"
            :no-blur="true"
            :animation-delay="panel.slideAnimDelay || '0s'"
            :key="panel.key"
            />
        </template>

        <template #dragDial>
          <MissionDialPanel
            :panel="panel"
            :style="{ 'animation-delay': panel.slideAnimDelay || '0s' }"
            :no-blur="true"
            :key="panel.key"
          />
        </template>
        <template #dragTimeSlip>
          <MissionTimeSlipPanel
            :panel="panel"
            :style="{ 'animation-delay': panel.slideAnimDelay || '0s' }"
            :no-blur="true"
            :key="panel.key"
          />
        </template>

        <template #unlocks>
          <MissionUnlocks
            :ref="(el) => panelRefs[panel.type] = el"
            :change="panel.change"
            :style="{ 'animation-delay': panel.slideAnimDelay || '0s' }"
            :key="panel.key"
          />
        </template>

      </SlotSwitcher>
    </div>
    <!--

  -->
    <div class="bottom" ref="buttonsRef">
      <InfoCard class="full-width">
        <template #content>
          <!-- Content section was empty -->
        </template>
        <template #button>

          <div class="button-row">
            <div v-if="supportsReplay && props.mode === 'startScreen'" class="replay-div">
              <div v-if="replayRecording" class="replay-warning">
                <BngIcon :type="'danger'" />
                {{ $translate.instant("missions.general.replay.increaseFps") }}
              </div>
              <BngSwitch
                :label="$t('missions.general.replay.enableMissionRecording')"
                v-model="replayRecording"
                @valueChanged="startScreenReplaySwitchClicked"
              />
            </div>

            <template v-if="showContinueButton">
              <BngButton
                class="large"
                @click="showContinueButton === 'skip' ? skipAnimations() : continueToNextPage()"
                accent="main"
                :disabled="isInputBlocked"
              >
                <div>{{ $t(showContinueButton === 'skip' ? 'ui.common.skip' : 'ui.common.next') }}</div>
              </BngButton>
            </template>
            <template v-else v-for="button in buttons">
              <BngButton
                class="large"
                v-bng-focus-if="button.focus"
                @click="buttonClicked(button)"
                :accent="button.main ? 'main' :'secondary'"
                :disabled="isInputBlocked"
              >
                <div>
                  {{$t(button.label)}}
                </div>
                <div class="fee" v-if="button.fee">
                  (Pay
                    <RewardsPills class="tiny-rewards" :rewards="button.fee" />
                  )
                </div>
              </BngButton>
            </template>
          </div>
        </template>
      </InfoCard>
    </div>

  </LayoutSingle>
</template>


<script setup>
import { computed, onBeforeMount, onUnmounted, onMounted, onBeforeUnmount, reactive, watch, ref, nextTick } from "vue"
import { storeToRefs } from "pinia"
import { $translate } from "@/services"
import { useUINavScope } from "@/services/uiNav"
import {
  BngButton,
  ACCENTS,
  BngCardHeading,
  BngBinding,
  BngSwitch,
  icons,
  BngIcon,
} from "@/common/components/base"
import { LayoutSingle } from "@/common/layouts"
import { vBngBlur, vBngOnUiNav, vBngFocusIf } from "@/common/directives"
import InfoCard from "../components/InfoCard.vue"
import MissionRewards from "../components/MissionRewards.vue"
import MissionTextPanel from "../components/MissionTextPanel.vue"
import MissionDialPanel from "../components/MissionDialPanel.vue"
import MissionReplayPanel from "../components/MissionReplayPanel.vue"
import MissionCrashTestStepDetails from "../components/MissionCrashTestStepDetails.vue"
import MissionTimeSlipPanel from "../components/MissionTimeSlipPanel.vue"
import MissionRatings from "../components/MissionRatings.vue"
import MissionObjectives from "../components/MissionObjectives.vue"
import MissionSettings from "../components/MissionSettings.vue"
import MissionBasicInfo from "../components/MissionBasicInfo.vue"
import MissionLeaguesPanel from "../components/MissionLeaguesPanel.vue"
import BngAdvCardHeading from "../components/bngAdvCardHeading.vue"
import RewardsPills from "../../career/components/progress/RewardsPills.vue"
import { SlotSwitcher } from "@/common/components/utility"
import router from "@/router"
import { useMissionDetailsStore } from "@/modules/missions/stores/missionDetailsStore"
import { lua, useBridge } from "@/bridge"
import logger from "@/services/logger"
import MissionUnlocks from '../components/MissionUnlocks.vue'

const { events } = useBridge()
const uiNavScope = useUINavScope("mission-control")
const exit = () => {
   //window.bngVue.gotoGameState("play")
  logger.debug("exit")
  // if(props.mode !== 'endScreenTest')
  //   router.push({ name: "mission-details" })
  // else
  //   window.bngVue.gotoGameState("play")
  window.bngVue.gotoGameState("mission-details")
}

const store = useMissionDetailsStore()
const layout = ref([])
const supportsReplay = ref(false)
const simpleStartScreen = ref(false)
const buttons = ref([])
const header = ref()

const props = defineProps({
  mode: {
    type: String,
    required: false,
    default: "endScreenTest"
  }
})

// Update these timing constants
const DURATION_SWOOSH = 0.15
const DURATION_STAR_THUMP = 0.15
const DURATION_HIGHSCORE_HIGHLIGHT = 0.15
const DURATION_PANEL_SLIDE = 0.2
const DURATION_BREAKDOWN_ITEM = 0.15 // New constant for breakdown items
const ANIM_START_DELAY = 0.25
const ANIM_GAP = 0.33
const ANIM_GAP_BREAKDOWN = 0.5 // New constant for breakdown item gaps

// Add ref for animation end time
const animationsEndTime = ref(null)

// Add ref for the timeout
const animEndTimeout = ref(null)

// Replay recording default value
const replayRecording = ref(false)

function calculateAnimationTimes(panels) {
  if (!['endScreen', 'test'].includes(props.mode)) {
    logger.debug("calculateAnimationTimes: Skipping - mode is not endScreen or test")
    return
  }

  // Clear existing timeout if any
  if (animEndTimeout.value) {
    clearTimeout(animEndTimeout.value)
    animEndTimeout.value = null
  }

  let animDelay = ANIM_START_DELAY

  // Filter panels to only include those for current page
  const currentPagePanels = panels.filter(panel => {
    if (!panel.pages) return currentPage.value === 'main'
    return panel.pages[currentPage.value]
  })
  let anyAnimations = false
  for (let panel of currentPagePanels) {
    if (panel.skipAnimations) {
      logger.debug(`calculateAnimationTimes: Skipping animations for panel ${panel.type}`)
      continue
    }
    anyAnimations = true

    panel.slideAnimDelay = animDelay + "s"
    logger.debug(`calculateAnimationTimes: Set slideAnimDelay for panel ${panel.type} to ${panel.slideAnimDelay}`)
    panel.slideInSound = setTimeout(() => {
      lua.Engine.Audio.playOnce("AudioGui", "event:>UI>Career>EndScreen_SlideIn")
      logger.debug("Playing slide in sound")
      panel.slideInSound = null
    }, animDelay * 1000)
    animDelay += DURATION_PANEL_SLIDE
    if (!['main', 'rewards'].includes(currentPage.value)) continue
    animDelay += ANIM_GAP

    // Handle rewards panel
    if (panel.type === 'rewards' && panel.change && panel.change.formattedRewards) {
      const rewardsData = panel.change?.formattedRewards?.list || {}
      const rewardsList = Array.isArray(rewardsData) ? rewardsData : Object.values(rewardsData)
      animDelay += ANIM_GAP
      rewardsList.forEach((reward, index) => {
        logger.debug(reward)
        // Base animation delay for the reward info
        reward.animDelay = animDelay * 1000
        animDelay += ANIM_GAP

        // Handle breakdown items individually
        if (reward.breakdown) {
          reward.breakdown.forEach((bd, bdIndex) => {
            // Set show delay
            bd.animDelayShow = animDelay * 1000
            animDelay += ANIM_GAP
            if (bd.duration > 0) {
              animDelay += ANIM_GAP_BREAKDOWN
              // Set lerp start delay
              bd.animDelayStartLerp = animDelay * 1000
              animDelay += bd.duration
            }
          })
        }

        // Progress bar animations
        if (reward.progressBar && reward.progressBar.animations) {
          reward.progressBar.animations.forEach((anim) => {
            anim.animDelay = animDelay * 1000
            animDelay += anim.duration + ANIM_GAP
          })
        }

        animDelay += ANIM_GAP
      })
    }

    // Handle text panel with attempt data
    if (panel.type === 'textPanel' && panel.attempt) {
      const list = panel.attempt.list
      if (list && list.length) {
        // Find all main results
        const mainResults = list.filter(item => item.mainResult)

        // Handle each main result separately
        for (let mainResult of mainResults) {
          // Set animation delays directly on the mainResult object
          mainResult.animDelay = animDelay + "s"
          mainResult.soundDelay = animDelay * 1000
          animDelay += DURATION_SWOOSH

          mainResult.animDelayThump = animDelay + "s"
          mainResult.soundDelayThump = animDelay * 1000
          animDelay += DURATION_SWOOSH + DURATION_STAR_THUMP + ANIM_GAP
        }
      }
    }

    // Handle objectives panel
    if (panel.type === 'objectives' && panel.formattedProgress) {
      const stars = panel.formattedProgress.stars
      if (stars) {
        for (let star of stars) {
          if (star.unlockChange) {
            star.animDelay = animDelay + "s"
            star.soundDelay = animDelay * 1000
            animDelay += DURATION_SWOOSH

            star.animDelayThump = animDelay + "s"
            star.soundDelayThump = animDelay * 1000
            animDelay += DURATION_SWOOSH + DURATION_STAR_THUMP + ANIM_GAP
          } else if (star.unlockAttempt) {
            star.animDelay = animDelay + "s"
            star.soundDelay = animDelay * 1000
            animDelay += DURATION_SWOOSH + (DURATION_SWOOSH + DURATION_STAR_THUMP)/2 + ANIM_GAP
          }
        }
      }
    }

    // Handle ratings panel
    if (panel.type === 'ratings' && panel.progress) {
      const formattedProgress = panel.progress.formattedProgress
      if (formattedProgress) {
        if (formattedProgress.ownAggregate) {
          for (let agg of formattedProgress.ownAggregate) {
            if (agg.newBest) {
              agg.animDelay = animDelay + "s"
              agg.soundDelay = animDelay * 1000
              animDelay += DURATION_HIGHSCORE_HIGHLIGHT + ANIM_GAP
            }
          }
        }

        if (formattedProgress.attempts) {
          formattedProgress.attempts.leaderboardAnimDelay = animDelay + "s"
          formattedProgress.attempts.leaderaboardSoundDelay = animDelay * 1000
          animDelay += DURATION_SWOOSH + ANIM_GAP
        }
      }
    }

    animDelay += ANIM_GAP + ANIM_GAP
  }
  animationsEndTime.value = null
  logger.debug("animDelay", animDelay)
  let totalDuration = animDelay * 1000 // Convert to milliseconds
  let pageInfo = pagesInfo.value[currentPage.value]
  if (!anyAnimations || !pageInfo.mandatory) {
    totalDuration = 0
  }

  animationsEndTime.value = Date.now() + totalDuration

  // Store timeout reference so we can clear it later
  animEndTimeout.value = setTimeout(() => {
    animationsEndTime.value = null
    animEndTimeout.value = null
  }, totalDuration)
}

function resetAndCalculateAnimationTimes() {
  logger.debug(props.mode)
  if (!['endScreen', 'test'].includes(props.mode) || !layout.value) return

  // Create a new array with initialized panels
  const initializedPanels = layout.value.map(panel => ({
    ...panel,
    slideAnimDelay: "0s",
    skipAnimations: visitedPages.value.has(currentPage.value) ? true : false
  }))

  // Reset animation states
  initializedPanels.forEach(panel => {
    if (panel.type === 'textPanel' && panel.attempt && panel.attempt.list) {
      panel.attempt.list.forEach(item => {
        if (item.mainResult) {
          item.animDelay = "-1s"
          item.soundDelay = -1
          item.animDelayThump = "-1s"
          item.soundDelayThump = -1
        }
      })
    }
    if (panel.formattedProgress && panel.formattedProgress.stars) {
      panel.formattedProgress.stars.forEach(star => {
        star.animDelay = "-1s"
        star.soundDelay = -1
        star.animDelayThump = "-1s"
        star.soundDelayThump = -1
      })
    }
    if (panel.progress && panel.progress.formattedProgress) {
      panel.progress.formattedProgress.ownAggregate.forEach(agg => {
        agg.animDelay = "-1s"
        agg.soundDelay = -1
      })
      panel.progress.formattedProgress.attempts.leaderboardAnimDelay = "-1s"
      panel.progress.formattedProgress.attempts.leaderaboardSoundDelay = -1
    }

    if (panel.type === 'textPanel' && panel.attempt) {
      panel.attempt.animDelay = "-1s"
      panel.attempt.soundDelay = -1
      panel.attempt.animDelayThump = "-1s"
      panel.attempt.soundDelayThump = -1
    }

    // Add reset for rewards panel
    if (panel.type === 'rewards' && panel.change?.formattedRewards?.list) {
      panel.change.skipAnimations = panel.skipAnimations
      const rewardsData = panel.change?.formattedRewards?.list || {}
      const rewardsList = Array.isArray(rewardsData) ? rewardsData : Object.values(rewardsData)
      let animDelay = 0
      rewardsList.forEach((reward, index) => {
        // Base animation delay for the reward info
        reward.animDelay = -1
        animDelay += ANIM_GAP

        // Handle breakdown items individually
        if (reward.breakdown) {
          reward.breakdown.forEach((bd, bdIndex) => {
            // Set show delay
            bd.animDelayShow = -1
            bd.animDelayStartLerp = -1
          })
        }

        animDelay += ANIM_GAP
      })
    }
  })
  calculateAnimationTimes(initializedPanels)
  layout.value = initializedPanels
}

// Add new ref for pages info and data ready state
const pagesInfo = ref({})
const dataReady = ref(false)

onBeforeMount(() => {
  // Reset visited pages when mounting
  visitedPages.value = new Set([])
  logger.debug(props.mode)
  events.on("onRequestMissionScreenDataReady", (data) => {
    //logger.debug("onRequestMissionScreenDataReady")
    //logger.debug(data)
    header.value = data.header
    // Store pages info separately
    if (data.pages) {
      pagesInfo.value = data.pages
    }

    // Set data ready flag
    dataReady.value = true

    // Calculate animation times before updating layout
    if (['endScreen', 'test'].includes(props.mode)) {
      layout.value = data.layout
      currentPage.value = null
      showPage('main')
    } else {
      layout.value = data.layout
    }
    supportsReplay.value = data.supportsReplay
    simpleStartScreen.value = data.simpleStartScreen

    buttons.value = data.buttons
  })
  lua.extensions.hook("onRequestMissionScreenData", props.mode)
  if(props.mode !== 'startScreen')
    lua.extensions.gameplay_missions_missionScreen.activateSoundBlur(true)
})

onMounted(() => {
  events.on("onReplayRecordingValueRequested", (value) => {
    replayRecording.value = value
  })
  lua.extensions.hook("onReplayRecordingValueRequested")
})

onUnmounted(() => {
  events.off("onRequestMissionScreenDataReady")
  events.off("onReplayRecordingValueRequested")
  lua.extensions.gameplay_missions_missionScreen.activateSoundBlur(false)
})

const startScreenReplaySwitchClicked = newValue => {
  lua.extensions.hook("onMissionAutoReplayRecordingSettingChanged", newValue)
}

const buttonClicked = (button) => {
  logger.debug(button)
  lua.extensions.hook("onMissionScreenButtonClicked", button)
}


// Move these refs to the top with other refs
const currentPage = ref('main')
const visitedPages = ref(new Set(['main'])) // Initialize with 'main' page visited
const panelRefs = ref({})
const isInputBlocked = ref(false)
const columnAdjustmentInterval = ref(null)
const headerRef = ref(null)
const wideColumnRef = ref(null)
const buttonsRef = ref(null)

// Now computed properties can safely reference currentPage
const availablePages = computed(() => {
  if (!layout.value || layout.value.length === 0) return []

  // If we have pages info, use that
  if (pagesInfo.value && Object.keys(pagesInfo.value).length > 0) {
    return Object.entries(pagesInfo.value)
      .map(([pageName, pageInfo]) => ({
        name: pageName,
        order: pageInfo.order,
        label: pageInfo.label,
        icon: pageInfo.icon
      }))
      .sort((a, b) => a.order - b.order)
      .map(page => page.name)
  }

  // Fallback to old behavior if no pages info
  const pages = new Set()
  layout.value.forEach(panel => {
    if (panel.pages) {
      Object.keys(panel.pages).forEach(page => {
        pages.add(page)
      })
    }
  })

  // Define the preferred order
  const orderedPages = []
  const pageOrder = ['main', 'rewards', 'details', 'empty']

  // Add pages in preferred order first
  pageOrder.forEach(page => {
    if (pages.has(page)) {
      orderedPages.push(page)
      pages.delete(page)
    }
  })

  // Add any remaining pages
  pages.forEach(page => {
    orderedPages.push(page)
  })

  return orderedPages
})

const filteredLayout = computed(() => {
  if (!layout.value) return []

  return layout.value.filter(panel => {
    if (!panel.pages) return currentPage.value === 'main' // Changed to main
    return panel.pages[currentPage.value]
  })
})

const pageRandomKey = ref(Math.random())

const currentPanels = computed(() => {
  if (!layout.value) return []

  if (currentPage.value === 'empty') {
    return []
  }
  if (!layout.value.length || !layout.value[0]) {
    return []
  }
  logger.debug("Layout:")
  logger.debug(layout)
  // Initialize slideAnimDelay if not present and add visited class
  return layout.value
    .filter(panel => {
      if (!panel.pages) return currentPage.value === 'main'
      return panel.pages[currentPage.value]
    })
    .map(panel => ({
      ...panel,
      slideAnimDelay: panel.slideAnimDelay || '0s',
      visited: visitedPages.value.has(currentPage.value),
      key: pageRandomKey.value // Add consistent random key
    }))
})

// Add watcher for currentPage to generate new random key when page changes
watch(currentPage, () => {
  pageRandomKey.value = Math.random()
  nextTick(() => {
    adjustWideColumn()
  })
})

// Move the watch after all computed properties
watch([layout, currentPage], () => {
  if (layout.value && layout.value.length > 0) {
    adjustWideColumn()
  }
}, { immediate: true })

// Add this with the other refs near the top of the script setup
const showPageNavigation = computed(() => {
  return true
})

// Update cancelAllSoundDelays to use the new refs
function cancelAllSoundDelays() {
  logger.debug('MissionControl: Cancelling all sound delays')
  currentPanels.value.forEach(panel => {
    const ref = panelRefs.value[panel.type]
    if (panel.slideInSound) {
      clearTimeout(panel.slideInSound)
      panel.slideInSound = null
    }
    if (ref && typeof ref.cancelSoundDelays === 'function') {
      logger.debug(`MissionControl: Cancelling sounds for panel type: ${panel.type}`)
      ref.cancelSoundDelays()
    }
  })
}

function showPage(pageName) {
  if (visitedPages.value.has(pageName)) {
    lua.Engine.Audio.playOnce("AudioGui", "event:>UI>Career>EndScreen_SlideIn")
  }
  if (currentPage.value) {
    visitedPages.value.add(currentPage.value)
  }

  cancelAllSoundDelays()
  currentPage.value = pageName
  logger.debug(props.mode)
  if (['endScreen', 'test'].includes(props.mode)) {
    animationsEndTime.value = null // Reset timer
    resetAndCalculateAnimationTimes()
  }

  nextTick(() => {
    adjustWideColumn()
  })
}

function focusNextPage() {
  const currentIndex = availablePages.value.indexOf(currentPage.value)
  if (currentIndex < availablePages.value.length - 1) {
    showPage(availablePages.value[currentIndex + 1])
  } else {
    showPage(availablePages.value[0])
  }
}

function focusPreviousPage() {
  const currentIndex = availablePages.value.indexOf(currentPage.value)
  if (currentIndex > 0) {
    showPage(availablePages.value[currentIndex - 1])
  } else {
    showPage(availablePages.value[availablePages.value.length - 1])
  }
}

function adjustWideColumn() {
  if (columnAdjustmentInterval.value) return

  // Calculate total animation duration based on layout panels
  let maxDuration = 2000 // Default 2 seconds
  if (layout.value && layout.value.length > 0) {
    let lastPanel = layout.value[layout.value.length - 1]
    if (lastPanel && lastPanel.slideAnimDelay) {
      // Convert "1.5s" to 1500ms
      let animDelay = parseFloat(lastPanel.slideAnimDelay) * 1000
      // Add animation duration (500ms from slide-in) plus buffer (500ms)
      maxDuration = animDelay + 1000
    }
  }

  const CHECK_INTERVAL = 0 // Run as fast as possible
  const startTime = Date.now()

  function checkColumnWidth() {
    if (Date.now() - startTime > maxDuration) {
      clearInterval(columnAdjustmentInterval.value)
      columnAdjustmentInterval.value = null
      return
    }

    if (wideColumnRef.value) {
      const wideColumn = wideColumnRef.value;
      const columnRect = wideColumn.getBoundingClientRect();
      const columnLeft = columnRect.left;
      const viewportWidth = window.innerWidth;

      const childElements = Array.from(wideColumn.children);
      let maxRowWidth = 0;
      let lastTop = -1;
      let currentRowWidth = 0;

      // Sort children by their vertical position to identify rows
      childElements.forEach(child => {
        const style = window.getComputedStyle(child);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          const childRect = child.getBoundingClientRect();
          const childTop = Math.round(childRect.top); // Round to handle minor differences
          const childRight = childRect.right - columnLeft;

          // If this element is on a new row
          if (lastTop !== -1 && Math.abs(childTop - lastTop) > 1) {
            maxRowWidth = Math.max(maxRowWidth, currentRowWidth);
            currentRowWidth = childRight;
          } else {
            currentRowWidth = Math.max(currentRowWidth, childRight);
          }

          lastTop = childTop;
/*
          logger.debug('Child measurements:', {
            type: child.className,
            top: childTop,
            right: childRight,
            currentRowWidth,
            maxRowWidth
          });
*/
        }
      });

      // Don't forget to check the last row
      maxRowWidth = Math.max(maxRowWidth, currentRowWidth);

      // Convert to rem (assuming 1rem = 16px)
      const widthInRem = Math.max(25, (maxRowWidth / 16)) + 0.25;
/*
      logger.debug('Column calculations:', {
        maxRowWidth,
        finalWidth: `${widthInRem}rem`
      });
*/
      wideColumn.style.width = `${widthInRem}rem`;
    }
  }

  // Initial check
  checkColumnWidth()

  // Store interval ID in ref so we can clear it later
  columnAdjustmentInterval.value = setInterval(checkColumnWidth, CHECK_INTERVAL)
}

// Clean up interval when component unmounts
onBeforeUnmount(() => {
  if (columnAdjustmentInterval.value) {
    clearInterval(columnAdjustmentInterval.value);
    columnAdjustmentInterval.value = null;
  }
  if (animEndTimeout.value) {
    clearTimeout(animEndTimeout.value)
    animEndTimeout.value = null
  }
})

function getPageIcon(page) {
  if (!pagesInfo.value || !pagesInfo.value[page]) return 'questionmark'
  return pagesInfo.value[page].icon || 'questionmark'
}

// Add helper to find next unvisited mandatory page
const findNextUnvisitedMandatoryPage = () => {
  const orderedPages = availablePages.value
  for (const page of orderedPages) {
    const pageInfo = pagesInfo.value[page]
    // Skip current page and look for other unvisited mandatory pages
    if (page !== currentPage.value && pageInfo?.mandatory && !visitedPages.value.has(page)) {
      return page
    }
  }
  return null
}

// Update isPlayingAnimations to use the timer
const isPlayingAnimations = computed(() => {
  if (!currentPage.value || visitedPages.value.has(currentPage.value)) return false

  return animationsEndTime.value && Date.now() < animationsEndTime.value
})

// Update showContinueButton to handle both states
const showContinueButton = computed(() => {
  if (!dataReady.value) return false

  // If animations are playing on an unvisited page, show Skip
  if (isPlayingAnimations.value) {
    return 'skip'
  }

  // If there's another unvisited mandatory page, show Continue
  if (findNextUnvisitedMandatoryPage() !== null) {
    return 'continue'
  }

  return false
})

// Update skipAnimations to just set the end time to now
const skipAnimations = () => {
  if (currentPage.value) {
    animationsEndTime.value = Date.now()
    showPage(currentPage.value)
  }
}

const continueToNextPage = () => {
  const nextMandatoryPage = findNextUnvisitedMandatoryPage()
  if (nextMandatoryPage) {
    showPage(nextMandatoryPage)
  }
}

const shouldShowMandatoryDot = (page) => {
  if (!dataReady.value) return false
  const pageInfo = pagesInfo.value[page]

  if (page === currentPage.value) {
    // Show dot on current page if it's mandatory and animations are playing
    return pageInfo?.mandatory && isPlayingAnimations.value
  }

  // For other pages, show dot if mandatory and unvisited
  return pageInfo?.mandatory && !visitedPages.value.has(page)
}

function updatePanel(newPanel) {
  const index = layout.value.findIndex(p => p.type === newPanel.type)
  if (index !== -1) {
    layout.value[index] = newPanel
    console.log(newPanel.recordingFiles)
  }
}

const leftBinding = ref()
const rightBinding = ref()

const leftIconClass = computed(() => ({
  'with-binding': leftBinding.value?.displayed
}))

const rightIconClass = computed(() => ({
  'with-binding': rightBinding.value?.displayed
}))

</script>

<style scoped lang="scss">
.layout-content-full {
  &.main-sequence {
    height: 100%; // Force full height during main sequence
    min-height: 100%;
  }
}

.full-width {
  width: 100%;
  min-width: min-content;
  align-self: center;
  border-radius: var(--bng-corners-2);
  :deep(.info-content) {
    padding: 0 0;
  }
}

.mission-control-layout {
  --safezone-top: unset;
  --safezone-bottom: unset;
  --content-flow: column nowrap;

  .full-width {
    align-self: start;
  }
  >* {
    gap: 0.25rem;
  }

  .main-sequence & {
    height: 100%; // Force full height during main sequence
  }

  .top {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    width: 25rem;

    .header {
      overflow-y: hidden;
    }
  }




  .columns {
    overflow: auto;
    min-width: 25rem;
    width: auto;
    max-width: 100%;
    padding: 0rem;
    padding-top: 0.5rem;
    box-sizing: border-box;
    border-radius: var(--bng-corners-2);
    background-color: rgba(black, 0.6);
    :deep(.info-card) {
      margin:0;
    };
    display: flex;
    flex: 1;
    flex-direction: column;
    flex-wrap: wrap;
    gap: 0.5rem;
    height: 100%;
    max-height: calc(100vh - 12rem);
    overflow-y: auto;
    overflow-x: hidden;
    align-content: flex-start;
    // Main panel sequence styling
    .main-sequence & {
      flex: 1 1 auto;
      height: 100%;
      max-height: none;
      flex-wrap: wrap;

      >* {
        flex: 0 0 auto;
        // Only apply animation to unvisited pages
        &:not(.visited) {
          animation: slide-in 0.5s ease-out forwards;
          opacity: 0;
          transform: translateX(-2rem);
        }
        // Visited pages should be fully visible immediately
        &.visited {
          opacity: 1;
          transform: translateX(0);
          animation-delay: 0s;
        }

        :deep(.card-cnt) {
          height: 100%;
        }
      }
    }

    // Default panel styling (non-main sequence)
    >* {
      flex: 0 0 auto;
      :deep(.card-cnt) {
        height: 100%;
      }
    }
    .no-grow {
      flex: 0 0 auto;
    }

    // Ensure children don't overflow
    > * {
      max-width: 100%;
      box-sizing: border-box;
    }
  }
  .bottom {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    align-self: flex-start;
    min-width: 25rem;

    .flex-column {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: center;

      .large {
        flex: 1 1 25rem;
        min-width: 22rem; // Ensures buttons don't get too narrow
        max-width: 25.5rem; // Matches container width
      }
    }
  }
}

.page-navigation {
  display: flex;
  align-items: center;

}

.nav-arrow-container {
  flex: 0 0 3rem;
  display: flex;
  justify-content: center;
  align-self:stretch;

  .page-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    --bng-button-min-width: 0;
    --bng-ui-event-padding-override: 0;

    .with-binding {
      width: 0.5em;
      transform: translateX(-50%);
    }
  }
}

.clickable {
  cursor: pointer;

  &:hover {
    filter: brightness(1.2);
  }
}



.page-buttons {
  flex: 1;
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.auto-progress-bar {
  position: relative;
  width: 100%;
  height: 0.2rem;
  background: rgba(255, 255, 255, 0.1);
  margin-top: -2px; // Attach to bottom of panel
  overflow: hidden;
  border-radius: var(--bng-corners-1);

  .progress-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 100%;
    background: var(--bng-orange-500);
    transform-origin: left;
    animation: progress-animation 3s linear;
  }
}

@keyframes progress-animation {
  0% {
    transform: scaleX(0);
  }
  85% {
    transform: scaleX(1);
  }
}

@keyframes slide-in {
  0% {
    opacity: 0;
    transform: translateX(-2rem);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes new-pulse {
  0% {
    box-shadow: 0 0 0.75em rgba(218, 196, 52, 0.75);
  }
  100% {
    box-shadow: 0 0 1em rgba(218, 196, 52, 1);
  }
}
.page-icon-wrapper {
  position: relative;
  display: inline-block;
  color: var(--bng-off-white);
  --bng-icon-color: var(--bng-off-white);

  .mandatory-dot {
    content: " ";
    background: var(--bng-ter-yellow-100);
    box-shadow: 0 0 1em var(--bng-ter-yellow-300);
    animation: new-pulse 0.5s cubic-bezier(0.2, 0.01, 0.12, 1) 1s infinite alternate-reverse;
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 999px;
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
  }

  .page-icon-button {
    padding: 0.3rem 0.3rem 0.3rem 0.3rem;
    cursor: pointer;
    // height: 100%;
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
    margin-left: 0.25rem;
    margin-right: 0.25rem;
    font-size: 2rem;
    --bng-icon-size: 1.8em;

    &.current-page {
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: var(--bng-corners-2);
      color: var(--bng-orange-300);
    }
  }
}

.button-row {
  display: flex;
  flex-direction:column;
  justify-content: center;
  flex-wrap: nowrap;
  width: 100%;
  :deep(.bng-button) {
    flex: 0 1 auto;
    min-width: 20rem;
  }
}

.replay-content-wrapper {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  width: 100%;
  height: 100%;
}

.replay-div {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  gap: 0.5rem;
  padding: 0.5rem;
  align-items: center;
  justify-content: center;
  color: var(--bng-off-white);
  width: 100%;
  padding-top: 0;

  :deep(.bng-switch) {
    :deep(.bng-switch-label) {
      flex: 1 1 auto;
    }
  }

  .replay-warning {
    font-size: 0.8rem;
    color: var(--bng-orange-300);
    max-width: 22rem;
    text-align: left;
    display: flex;

    :deep(.icon-base) {
      font-size: 2rem;
      padding-right: 0.5rem;
      color: var(--bng-orange-300);
    }
  }

}

</style>
