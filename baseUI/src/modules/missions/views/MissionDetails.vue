<template>
  <LayoutSingle
    v-bng-blur
    class="mission-details-layout"
    v-bng-scoped-nav="{ activated: scopedNavStates.rootScope }"
    v-bng-on-ui-nav:tab_l="focusPreviousPage"
    v-bng-on-ui-nav:tab_r="focusNextPage"
    v-bng-on-ui-nav:menu="onMenuClicked"
    @deactivate="exit">
    <div class="content-wrapper">
      <div class="available-missions-wrapper" v-if="missionCards && showMissionCards && missionCards.groupKeys">
        <div class="selected-gradient to-left" :class="{ active: uiState.missionCardsNavActive }" tabindex="-1"></div>
        <InfoCard class="available-missions">
          <template #header>
            <BngCardHeading type="ribbon" class="header bonus-header"> Available Challenges </BngCardHeading>
          </template>
          <template #button>
            <BngButton class="exitButton" @click="onMenuClicked" :accent="ACCENTS.attention" v-bng-sound-class="'bng_back_generic'" tabindex="-1"
              ><BngBinding deviceMask="xinput" />Back</BngButton
            >
          </template>
          <template #content>
            <!-- flip around scope nav active flag like in demo to switch scope-->
            <div class="mission-cards-container">
              <template v-for="groupKey in missionCards.groupKeys">
                <div v-bng-on-ui-nav:focus_r="() => (scopedNavStates.missionDetails = true)" class="mission-group">
                  <div class="group-header" v-if="missionCards.groupsByKey[groupKey].label">
                    <div class="label">
                      {{ $ctx_t(missionCards.groupsByKey[groupKey].label) }}
                    </div>
                    <BngMainStars
                      v-if="missionCards.groupsByKey[groupKey].meta.formattedLeague"
                      :unlocked-stars="missionCards.groupsByKey[groupKey].meta.formattedLeague.totalStarsObtained"
                      :total-stars="missionCards.groupsByKey[groupKey].meta.formattedLeague.totalStarsAvailable"
                      class="league-stars"
                      :scale="0.6"
                      reverse
                      numerical />
                  </div>
                  <div class="mission-card-list">
                    <template v-for="id in missionCards.groupsByKey[groupKey].tileIdsUnsorted" :key="id">
                      <MissionCard
                        v-bng-on-ui-nav:ok="() => (scopedNavStates.missionDetails = true)"
                        :class="{ highlighted: selectedMission.id === id }"
                        :data-mission-id="id"
                        :bng-scoped-nav-autofocus="
                          selectedMission.id === id || (!selectedMission.id && id === missionCards.groupsByKey[groupKey].tileIdsUnsorted[0])
                        "
                        :mission="missionCards.tilesById[id]"
                        class="clickable-card"
                        tabindex="0"
                        @clicked="selectMission"
                        @focus="selectMission(missionCards.tilesById[id])" />
                    </template>
                  </div>
                </div>
              </template>
            </div>
          </template>
        </InfoCard>
      </div>
      <div class="available-missions-wrapper" v-if="context === 'ongoingMission'">
        <InfoCard class="available-missions">
          <template #header>
            <BngCardHeading type="ribbon" class="header bonus-header"> Ongoing Challenge </BngCardHeading>
          </template>
          <template #content>
            <TaskList class="tasklist" :header="tasksStore.header" :tasks="tasksStore.tasks" />
          </template>
          <template #button>
            <div class="button-rows">
              <template v-if="missionStartableDetails">
                <BngButton
                  v-if="missionStartableDetails.continueVisible"
                  class="large start"
                  accent="secondary"
                  :icon-right="icons.catalog02"
                  @click="gotoMenu"
                  v-bng-on-ui-nav:ok.asMouse.focusRequired
                  label="Main Menu" />
                <BngButton
                  v-if="missionStartableDetails.restartVisible"
                  class="large start"
                  :icon-right="sameUserSettingsAsLast ? icons.restart : icons.reconfigure"
                  v-bng-on-ui-nav:ok.asMouse.focusRequired
                  @click="store.reconfigureMission"
                  accent="secondary"
                  :label="sameUserSettingsAsLast ? 'Restart' : 'Reconfigure'" />
                <BngButton
                  v-if="missionStartableDetails.abandonVisible"
                  class="large start"
                  :icon-right="icons.abandon"
                  @click="store.abandonMission"
                  v-bng-on-ui-nav:ok.asMouse.focusRequired
                  accent="attention"
                  label="Abandon" />
                <BngButton
                  v-if="missionStartableDetails.continueVisible"
                  label="Continue"
                  class="large start continue-button"
                  :icon-right="icons.fastTravel"
                  v-bng-on-ui-nav:ok.asMouse.focusRequired
                  :bng-scoped-nav-autofocus="true"
                  @click="onMenuClicked" />
                <BngButton
                  v-if="!missionStartableDetails.startableVisible && !missionStartableDetails.continueVisible"
                  label="Locked"
                  class="large start"
                  :icon-right="icons.lockClosed"
                  v-bng-on-ui-nav:ok.asMouse.focusRequired
                  disabled />
              </template>
            </div>
          </template>
        </InfoCard>
      </div>

      <div v-if="selectedMission" class="mission-details">
        <InfoCard class="mission-page-navigation">
          <template #content>
            <div class="page-navigation">
              <div class="nav-arrow-container nav-left">
                <BngBinding
                  class="page-nav-arrow page-nav-left clickable"
                  ui-event="tab_l"
                  deviceMask="xinput"
                  :style="{ '--page-nav-icon': `'${icons.arrowSmallLeft.glyph}'` }"
                  @click="focusPreviousPage"
                  v-if="availablePages.length > 1" />
              </div>
              <div class="page-buttons">
                <div v-for="page in availablePages" :key="page" class="page-icon-wrapper">
                  <BngIcon :type="page.icon" @click="showPage(page)" class="page-icon-button" :class="{ 'current-page': currentPage === page.value }" />
                </div>
              </div>
              <div class="nav-arrow-container nav-right">
                <BngBinding
                  class="page-nav-arrow page-nav-right clickable"
                  ui-event="tab_r"
                  deviceMask="xinput"
                  :style="{ '--page-nav-icon': `'${icons.arrowSmallRight.glyph}'` }"
                  @click="focusNextPage"
                  v-if="availablePages.length > 1" />
              </div>
            </div>
          </template>
        </InfoCard>
        <div class="mission-details-wrapper">
          <div class="selected-gradient to-right" :class="{ active: uiState.missionDetailsNavActive }" tabindex="-1"></div>
          <InfoCard
            class="mission-details-card"
            v-bng-scoped-nav="{ activated: scopedNavStates.missionDetails }"
            :bng-no-nav="true"
            tabindex="-1"
            v-bng-on-ui-nav:tab_l="focusPreviousPage"
            v-bng-on-ui-nav:tab_r="focusNextPage"
            @deactivate="focusLeftSide">
            <template #header>
              <BngAdvCardHeading class="mission-details-header" mute divider :preheadings="preheadings" :icon="missionBasicInfo.icon">
                {{ $ctx_t(missionBasicInfo.name) }}
              </BngAdvCardHeading>
            </template>
            <template #content>
              <div class="mission-details-content">
                <div class="mission-details-top">
                  <template v-if="currentPage === 'info' || currentPage === 'settings'">
                    <div class="mission-details-left">
                      <template v-if="currentPage === 'info'">
                        <div class="mission-preview">
                          <AspectRatio v-if="missionBasicInfo.images" class="previews">
                            <BngImageCarousel :images="missionBasicInfo.images" transition class="images" external />
                          </AspectRatio>
                        </div>
                        <div class="mission-description">
                          {{ $ctx_t(missionBasicInfo.description) }}
                        </div>
                        <!--
                          {{ missionStartableDetails }}
                          <MissionBasicInfo       bng-on-ui-nav:ok="foo" v-if="missionBasicInfo" @continue="exit" />
                        -->
                      </template>
                      <template v-if="currentPage === 'settings'">
                        <!-- todo: fix pressing "left" doesnt get back to the list-->
                        <MissionSettings
                          v-if="missionSettings && !showTasks"
                          no-blur
                          @activate="missionSettingsNavActivated"
                          @deactivate="missionSettingsNavDeactivated" />
                      </template>
                    </div>
                    <div class="mission-details-right">
                      <MissionObjectives
                        v-if="missionProgress"
                        :stars="missionProgress.stars"
                        :message="missionProgress.message"
                        :showMessage="true"
                        :noDisabledObjectives="true"
                        no-blur
                        card-heading-type="line" />
                    </div>
                  </template>
                  <template v-if="currentPage === 'leaderboards'">
                    <div class="mission-leaderboards">
                      <MissionLeaderboards v-if="selectedMission && !showTasks" no-blur />
                    </div>
                  </template>
                </div>
                <div class="mission-details-fill"></div>
                <div class="mission-details-bottom" v-if="currentPage === 'info' && context === 'availableMissions'">
                  <MissionSettingsSimple
                    :mission-settings="missionSettings"
                    :noInput="true"
                    @clicked="selectSettings"
                    v-bng-on-ui-nav:ok.asMouse.focusRequired />
                </div>
              </div>
            </template>
            <template #button v-if="missionBasicInfo && context === 'availableMissions'">
              <div class="button-rows">
                <div class="entry-fee" v-if="missionBasicInfo && missionBasicInfo.entryFee">
                  <div class="label">Entry Fee:</div>
                  <div>
                    <RewardsPills class="tiny-rewards" :rewards="missionBasicInfo.entryFee" />
                  </div>
                </div>
                <div class="repair-item" v-if="missionStartableDetails.needsRepair">
                  <BngSelect
                    class="repair-item-control"
                    :options="missionStartableDetails.repairOptions"
                    :value="missionStartableDetails.selectedRepairType"
                    :config="{
                      label: x => x.optionsLabel,
                      value: x => x.type,
                    }"
                    :loop="true"
                    @valueChanged="store.changeRepairType" />
                </div>
                <template v-if="missionStartableDetails.needsRepair && missionStartableDetails.startableVisible">
                  <BngButton
                    v-bng-on-ui-nav:ok.asMouse.focusRequired
                    v-bng-on-ui-nav:focus_l.focusRequired="focusLeftSide"
                    :bng-scoped-nav-autofocus="true"
                    :icon-left="icons.wrench"
                    :disabled="!missionStartableDetails.startableEnabled"
                    :label="missionStartableDetails.selectedRepairTypeLabel"
                    class="large"
                    @click="startMission" />
                </template>
                <template v-else>
                  <BngButton
                    v-bng-on-ui-nav:ok.asMouse.focusRequired
                    v-bng-on-ui-nav:focus_l.focusRequired="focusLeftSide"
                    :bng-scoped-nav-autofocus="true"
                    class="large"
                    v-bng-sound-class="'bng_back_generic'"
                    ref="startChallengeButton"
                    @click="startMission">
                    <BngBinding deviceMask="xinput" />Start Challenge
                  </BngButton>
                </template>
              </div>
            </template>
            <template #button v-if="context === 'ongoingMission'">
              <div class="centered-currently-in-progress">Challenge currently in progress</div>
            </template>
          </InfoCard>
        </div>
      </div>
    </div>
  </LayoutSingle>
</template>

<script>
const noop = () => {}
</script>

<script setup>
import { computed, onBeforeMount, onUnmounted, onMounted, reactive, watch, ref, provide, setBlockTracking, watchEffect } from "vue"
import { storeToRefs } from "pinia"
import { $translate } from "@/services"
import { useUINavScope } from "@/services/uiNav"
import {
  BngImageCarousel,
  BngButton,
  ACCENTS,
  BngSelect,
  BngSwitch,
  BngSlider,
  BngInput,
  BngPropVal,
  BngIcon,
  BngImageTile,
  BngCardHeading,
  BngMainStars,
  BngBinding,
  icons,
  BngCard,
} from "@/common/components/base"
import { SlotSwitcher, AspectRatio } from "@/common/components/utility"
import { LayoutSingle } from "@/common/layouts"
import { vBngBlur, vBngOnUiNav, vBngScopedNav, vBngSoundClass, vBngFocusIf } from "@/common/directives"
import { useMissionDetailsStore } from "@/modules/missions/stores/missionDetailsStore"
import InfoCard from "../components/InfoCard.vue"
import MissionLeaderboards from "../components/MissionLeaderboards.vue"
import MissionObjectives from "../components/MissionObjectives.vue"
import MissionSettings from "../components/MissionSettings.vue"
import BngAdvCardHeading from "../components/bngAdvCardHeading.vue"
import RewardsPills from "../../career/components/progress/RewardsPills.vue"
import { lua } from "@/bridge"
import router from "@/router"
import MissionCard from "@/modules/career/components/progress/MissionCard.vue"
import { nextTick } from "vue"
import { TaskList } from "@/modules/tasks"
import { useTasksStore } from "@/modules/tasks"
import { useLibStore } from "@/services"
import { setFocus } from "@/services/uiNavFocus"
import MissionSettingsSimple from "../components/MissionSettingsSimple.vue"

const { $game } = useLibStore()

// useUINavScope("mission-details")
const store = useMissionDetailsStore()
const foo = function () {
  console.log("foo")
}

const missionDetailsCard = ref(null)

const currentPage = ref("info")
const availablePages = ref([
  {
    value: "info",
    label: "Info",
    icon: "medal",
  },
  {
    value: "settings",
    label: "Settings",
    icon: "adjust",
  },
  {
    value: "leaderboards",
    label: "Leaderboards",
    icon: "chartBars",
  },
])

const showPage = page => {
  currentPage.value = page.value
}

const focusNextPage = () => {
  const currentIndex = availablePages.value.findIndex(p => p.value === currentPage.value)
  if (currentIndex !== -1) {
    const nextIndex = (currentIndex + 1) % availablePages.value.length
    currentPage.value = availablePages.value[nextIndex].value
  }
}

const focusPreviousPage = () => {
  const currentIndex = availablePages.value.findIndex(p => p.value === currentPage.value)
  if (currentIndex !== -1) {
    const prevIndex = (currentIndex - 1 + availablePages.value.length) % availablePages.value.length
    currentPage.value = availablePages.value[prevIndex].value
  }
}

const activitySelector = ref(null)
const goNext = () => {
  //store.selectPreviousMission()
  activitySelector.value && activitySelector.value.goNext()
}
const goPrev = () => {
  //store.selectNextMission()
  activitySelector.value && activitySelector.value.goPrev()
}
let ignoreExit = false
const exit = async () => {
  console.trace("mission details exit")

  if (ignoreExit) {
    console.log("Ignoring Exit")
    ignoreExit = false
    return
  }
  // flag to keep track if menu was clicked so that when triggering ui-nav:menu,
  // watchEffect keeping rootScope active will ignore forcing rootScope to be active
  uiState.menuClicked = false

  const taskDataType = await lua.extensions.gameplay_missions_missionManager.getCurrentTaskdataTypeOrNil()
  console.log("taskDataType", taskDataType)
  // if taskDataType is not nil, it means that a mission is ongoing and navigation is handled by lua
  if (taskDataType) return

  // TODO: specify which route to navigate to instead of calling router.back()

  if (showMissionCards.value) {
    console.log("showMissionCards.value", showMissionCards.value)
    if (!uiState.missionStarted) {
      console.log("Exit already triggered, ignoring for next one...")
      ignoreExit = true
      console.log("backing out")
      router.back()
    }
    return
  }

  // window.bngVue.gotoGameState("play")
  const isMissionActive = await lua.extensions.gameplay_missions_missionScreen.isAnyMissionActive()
  if (isMissionActive) {
    const isMissionStartOrEndScreen = await lua.extensions.gameplay_missions_missionScreen.isMissionStartOrEndScreenActive()
    if (isMissionStartOrEndScreen) {
      //console.log(isMissionStartOrEndScreen)
      ignoreExit = true
      window.bngVue.gotoGameState("mission-control", { params: { mode: isMissionStartOrEndScreen } })
      return
    }
  }
  console.log("going to play")
  ignoreExit = true
  window.bngVue.gotoGameState("play")
}

const {
  missions,
  context,
  selectedMission,
  missionBasicInfo,
  missionProgress,
  missionSettings,
  missionStartableDetails,
  sameUserSettingsAsLast,
  formattedProgress,
  currentProgressKey,
  missionCards,
  showMissionCards,
  isTutorialEnabled,
  availableVehicles,
} = storeToRefs(store)

const allSettings = computed(() => {
  return [...(availableVehicles.value || []), ...(missionSettings.value || [])]
})

const uiState = reactive({
  currentScope: "mission-details",
  focusedCard: "",
  missionCardsNavActive: false,
  missionDetailsNavActive: false,
  missionSettingsNavActive: false,
  missionStarted: false,
  menuClicked: false,
})

const scopedNavStates = reactive({
  rootScope: false,
  missionDetails: false,
})

const onMenuClicked = () => {
  uiState.menuClicked = true
  console.log("onMenuClicked", scopedNavStates.rootScope)
  scopedNavStates.rootScope = false
  console.log("onMenuClicked", scopedNavStates.rootScope)
}
const exitByDeactivateRootScope = () => {
  console.log("exitByDeactivateRootScope")
  scopedNavStates.rootScope = false
}

watchEffect(() => {
  if ((missionCards.value && showMissionCards.value && !scopedNavStates.rootScope && !uiState.menuClicked) || context.value === "ongoingMission") {
    scopedNavStates.rootScope = true
  }
})

const preheadings = computed(() => missionBasicInfo.value.missionTypeLabels.map(x => $translate.contextTranslate(x)))

onBeforeMount(async () => {
  await store.init()
})

let unpauseOnUnmount = true
onUnmounted(() => {
  store.$dispose()
  if (unpauseOnUnmount) {
    lua.simTimeAuthority.pause(false)
  }
})
onMounted(() => {
  //adjustWideColumn();
  lua.simTimeAuthority.pause(true)
})

const startMission = () => {
  console.log("startMission")
  uiState.missionStarted = true
  window.bngVue.gotoGameState("blank", { tryAngularJS: false, blankAngularJS: true })
  store.startMission()
}

function activateCard() {
  console.log("activateCard", uiState.focusedCard)
  uiState.currentScope = uiState.focusedCard
}

function deactivateCard() {
  uiState.currentScope = "mission-details"
}

const activities = computed(() => (missions.value || []).map(itm => ({ value: itm.id, icon: itm.icon, label: itm.name })))

watch(
  () => uiState.currentScope,
  () => {
    console.log("scope changed", uiState.currentScope)
    uiNavScope.set(uiState.currentScope)
  }
)

function selectMission(m) {
  console.log("selectMission", missionCards.value.tilesById[m.id])
  store.selectMission(m.id)
}

const tasksStore = useTasksStore()

provide("animationSettings", {
  animate: true,
  animateOnMount: false,
  animateOnMountIntervalDelay: 0.2,
  animateOnEmptyIntervalDelay: 0.1,
  animateOnEmpty: true,
  animateNextTask: true,
  successCallback: playAudio,
})

function playAudio() {
  $game.lua.Engine.Audio.playOnce("AudioGui", "event:>UI>Career>Checkbox")
}

const wideColumnRef = ref(null)
function adjustWideColumn() {
  nextTick(() => {
    //console.log("Adjust column...");
    if (wideColumnRef.value) {
      const wideColumn = wideColumnRef.value // The actual DOM element
      //console.log("Wide column found:", wideColumn);

      // Get child elements and their x positions
      const childElements = Array.from(wideColumn.children)
      const childPositions = childElements.map(child => ({
        tagName: child.tagName,
        x: child.getBoundingClientRect().left, // Get x position
        width: child.offsetWidth,
        height: child.offsetHeight,
      }))

      //console.log("Child positions:", childPositions);

      // Determine the unique x positions (columns)
      const uniqueColumns = Array.from(new Set(childPositions.map(child => child.x)))

      const columnCount = uniqueColumns.length
      //console.log("Column count:", columnCount);

      // Set the wide-column width to 25rem * columnCount
      wideColumn.style.width = `${25.5 * columnCount}rem`
      //console.log(`Wide column width set to ${25 * columnCount}rem`);
    } else {
      //console.log("Wide column not found.");
    }
  })
}

watch(
  () => selectedMission.value,
  newMission => {
    if (newMission) {
      adjustWideColumn()
    }
  },
  { immediate: true } // Run immediately on mount
)

const groupKeys = computed(() => {
  return missionCards.value && missionCards.value.groupKeys ? missionCards.value.groupKeys : []
})

const groupsByKey = computed(() => {
  return missionCards.value && missionCards.value.groupsByKey ? missionCards.value.groupsByKey : {}
})

const tilesById = computed(() => {
  return missionCards.value && missionCards.value.tilesById ? missionCards.value.tilesById : {}
})

const showTasks = computed(() => tasksStore.tasks.length > 0 && isTutorialEnabled.value)

function cont() {}

function gotoMenu() {
  console.log("gotoMenu")
  lua.career_career.isActive().then(isActive => {
    ignoreExit = true
    unpauseOnUnmount = false
    if (isActive) {
      window.bngVue.gotoAngularState("menu.careerPause")
    } else {
      window.bngVue.gotoAngularState("menu.mainmenu")
    }
  })
}

function showRules() {
  lua.extensions.gameplay_missions_missionScreen.showMissionRules(selectedMission.value.id)
}

const startChallengeButton = ref(null)

const selectSettings = () => {
  currentPage.value = "settings"
}

function focusRightSide() {
  /**
  if (selectedMission.value) {
    const missionCard = document.querySelector(`.mission-card-list .clickable-card[data-mission-id="${selectedMission.value.id}"]`)
    if (missionCard) {
      missionCard.classList.remove('focus-visible')
    }
  }
  */
  //TODO: replace setFocus with a to-be-implemented-feature that lets me define the default focus element for a scoped nav
  nextTick(() => {
    if (startChallengeButton.value) {
      setFocus(startChallengeButton.value.$el)
    }
  })
}

function focusLeftSide() {
  scopedNavStates.missionDetails = false

  if (showMissionCards.value) {
    if (selectedMission.value) {
      const missionCard = document.querySelector(`.mission-card-list .clickable-card[data-mission-id="${selectedMission.value.id}"]`)
      if (missionCard) {
        //missionCard.classList.add('focus-visible')
        // TODO: Check why this is working instead of nextTick. scoped-nav is also using the timeout to focus to instead of nextTick
        requestAnimationFrame(() => {
          setFocus(missionCard)
        })
      }
    }
  } else {
    const continueButton = document.querySelector(".continue-button")
    if (continueButton) {
      setFocus(continueButton)
    }
  }
}

function missionCardsNavActivated(event) {
  console.log("Mission cards nav activated", event)
  uiState.missionCardsNavActive = true
}

function missionCardsNavDeactivated(event) {
  console.log("Mission cards nav deactivated", event)
  uiState.missionCardsNavActive = false
}

function missionDetailsNavActivated(event) {
  console.log("Mission details nav activated", event)
  uiState.missionDetailsNavActive = true
}

function missionDetailsNavDeactivated(event) {
  console.log("Mission details nav deactivated", event)
  uiState.missionDetailsNavActive = false
}

function missionSettingsNavActivated(event) {
  console.log("Mission settings nav activated", event)
  //uiState.missionSettingsNavActive = true
  //uiState.missionDetailsNavActive = false
}

function missionSettingsNavDeactivated(event) {
  console.log("Mission settings nav deactivated", event)
  //uiState.missionSettingsNavActive = false
}
</script>

<style scoped lang="scss">
@use "@/styles/modules/mixins" as *;

:deep(.bng-button).large {
  .label {
    text-align: left;
    padding: 0 0.25em;
    flex: 0 0 auto;
  }
}

.mission-details-layout {
  width: 10rem;
}

.content-wrapper {
  width: 100%;
  height: 100%;
  padding-top: 2rem;
  padding-bottom: 5rem;
  display: flex;
  flex-direction: row;
  max-width: 90rem;
  justify-content: center;
  max-height: calc(70rem);
}

.selected-gradient {
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  width: calc(100% - 0.5rem);
  height: calc(100% - 0.5rem);
  pointer-events: none;
  z-index: -1;
  border-radius: var(--bng-corners-2);
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  &.active {
    opacity: 1;
  }

  &.to-left {
    background: linear-gradient(to left, rgba(var(--bng-orange-400-rgb), 0.5), rgba(var(--bng-orange-300-rgb), 0));
  }
  &.to-right {
    background: linear-gradient(to right, rgba(var(--bng-orange-400-rgb), 0.5), rgba(var(--bng-orange-300-rgb), 0));
  }
}

.available-missions-wrapper {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  padding: 0.25rem 0;
  position: relative;

  .available-missions {
    flex: 1 0 auto;
    height: 100%;
    position: relative;
    .exitButton {
      max-width: 100%;
    }
  }

  .mission-cards-container {
    display: flex;
    flex-direction: column;
    align-self: stretch;
    height: 100%;
    width: 100%;
  }

  .mission-card-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(20em, 1fr));
    gap: 1rem;
    grid-auto-rows: 0.1fr;
    align-items: stretch;
    flex: 1 1 auto;
    gap: 0.5rem;

    .highlighted {
      //background-color: rgba(255, 255, 255, 0.4);
      //outline: 2px orange solid;
      //      outline-offset: -1px;
      :deep(.highlight-marker) {
        width: 0.75rem;
      }
      :deep(.condensed) {
        padding-left: 1rem;
      }
    }
  }

  .mission-group {
    padding-top: 0.575rem;
  }
  .group-header {
    display: flex;
    padding: 1rem 0rem 0.5rem 0.5rem;
    .label {
      flex: 1 0 auto;
      font-size: 1.25rem;
      font-weight: 800;
    }
    .league-stars {
      align-self: center;
      flex: 0 0 auto;
      --star-color: var(--bng-ter-yellow-50);
      padding: 0.25rem 0.5rem;
    }
  }
  :deep(.info-content) {
    overflow-y: auto;
    height: 100%;
  }
}

.mission-details {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  padding-right: 0.5rem;
  width: auto;
  max-width: 65rem;

  .mission-header {
    flex: 0 0 auto;
    width: auto;
  }
  .mission-page-navigation {
    flex: 0 0 auto;
    align-self: stretch;
    width: auto;
  }

  .mission-details-wrapper {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    height: 100%;
    width: auto;
    position: relative;
  }

  .mission-details-card {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    height: 100%;
    width: auto;
    :deep(.info-content) {
      height: 100%;
    }
    :deep(.decorator) {
      margin-bottom: 0rem;
    }
    .mission-details-header {
      background-color: rgba(0, 0, 0, 0.45);
      margin-bottom: 0.5rem;
    }

    .mission-details-content {
      box-sizing: border-box;
      flex: 1 0 auto;
      width: 100%;
      height: 100%;
      display: flex;
      gap: 1rem;
      flex-direction: column;
      .mission-details-top {
        flex: 0 0 auto;
        display: flex;
        flex-direction: row;
        gap: 1rem;
        width: 100%;
        justify-content: space-between;
        .mission-leaderboards {
          width: 100%;
          :deep(.bng-card) {
            width: auto;
          }
          :deep(.card-heading) {
            display: none;
          }
        }
      }
      .mission-details-fill {
        flex: 1 1 auto;
        content: "";
      }
      .mission-details-bottom {
        flex: 0 0 auto;
        display: flex;
        flex-direction: column;
        width: calc(100% + 1rem);
        align-content: flex-end;
        background: rgba(0, 0, 0, 0.45);
        margin-bottom: -0.5rem;
        margin-left: -0.5rem;
        padding: 0.5rem 0.5rem;
        overflow: auto;
      }

      .mission-details-left {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        min-width: 0;
        padding: 0.5rem;

        .mission-preview {
          flex: 0 1 auto;
          border-radius: 0.5rem;
          overflow: hidden;

          .previews {
            height: 100%;
            border-radius: 0.5rem;
            overflow: hidden;
          }
        }

        .mission-description {
          flex: 0;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          padding: 1rem;
          text-align: center;
          position: relative;
          text-align: center;
        }

        .mission-placeholder {
          flex: 0 0 auto;
          min-height: 150px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
        }
      }

      .mission-details-right {
        flex: 0 0 25rem;
        width: 25rem;
      }
    }
    .mission-settings {
      flex: 1 0 auto;
      display: flex;
      flex-direction: row;
      gap: 0.5rem;
      justify-content: flex-start;
    }
    .mission-setting-pill {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
      padding: 0.2rem 0.5rem;
      display: flex;
      flex-direction: row;
      gap: 0rem;
      align-items: center;
      min-width: 6rem;
      position: relative;
      overflow: hidden;

      &.clickable {
        cursor: pointer;
        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      }

      &:not(.clickable) {
        opacity: 0.5;
      }

      .setting-background {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        pointer-events: none;

        .setting-increment,
        .setting-decrement {
          flex: 1;
          pointer-events: auto;
        }
      }

      .image {
        width: 10rem;
        border-radius: 0.5rem 0 0 0.5rem;
        margin: -0.2rem -0.5rem;
        margin-right: 0.5rem;
      }
      .disabled-text {
        color: var(--bng-cool-gray-400);
      }
      .setting-label {
        flex: 1 0 auto;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: space-between;
        gap: 0.5rem;
        padding: 0.5rem 0.25rem;
        .setting-label-header {
          flex: 0 0 auto;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;

          .locked-icon {
            font-size: 1em;
          }
        }
        .setting-label-value {
          flex: 0 0 auto;
          font-weight: 400;
        }
      }
    }

    .mission-settings-vehicles {
      display: flex;
      flex-direction: row;
      gap: 0.5rem;
      align-items: center;
      justify-content: space-around;
    }

    .centered-currently-in-progress {
      text-align: center;
      font-size: 1.25rem;
      font-weight: 800;
      background-image: linear-gradient(
        45deg,
        rgba(255, 255, 255, 0.1) 25%,
        rgba(255, 255, 255, 0.05) 25%,
        rgba(255, 255, 255, 0.05) 50%,
        rgba(255, 255, 255, 0.1) 50%,
        rgba(255, 255, 255, 0.1) 75%,
        rgba(255, 255, 255, 0.05) 75%,
        rgba(255, 255, 255, 0.05)
      );
      background-size: 10px 10px;
      margin: -0.5rem -0.5rem;
      padding: 0.5rem 0.5rem;
    }
  }
}
.button-rows {
  width: 100%;
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  .entry-fee {
    padding: 0.2rem;
    align-self: center;
    display: flex;
    flex-direction: row;
    align-items: center;
    .label {
      padding-right: 1em;
    }
  }

  .repair-item {
    align-self: center;
    flex-direction: row;
    align-items: center;
    width: 100%;
    padding: 0.2rem;
    padding-top: 0;
    .repair-item-control {
      flex: 1 0 auto;
    }
  }

  :deep(.bng-button) {
    max-width: unset;
  }
}

.flex-grow-low {
  flex: 0.25 0 auto;
}
.flex-grow-hih {
  flex: 0.25 0 auto;
}

.tasklist {
  padding-top: 0.5rem;
  width: 100%;
  :deep(.header-wrapper) {
    margin-left: 0;
    width: 100%;
  }
  :deep(.tasks-content) {
    padding-left: 0;
    width: 100%;
  }
  :deep(.task-card) {
    background-color: rgba(0, 0, 0, 0.45);
  }
}

.page-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.nav-arrow-container {
  flex: 0 0 3rem;
  display: flex;
  justify-content: center;
}

.page-nav-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;

  &.page-nav-left::before {
    content: var(--page-nav-icon);
    font-family: bngIcons;
  }

  &.page-nav-right::after {
    content: var(--page-nav-icon);
    font-family: bngIcons;
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

.page-icon-wrapper {
  position: relative;
  display: inline-block;
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
    padding: 0.5rem 0.5rem 0.4rem 0.5rem;
    cursor: pointer;
    height: 100%;
    margin-top: 0.1rem;
    margin-bottom: 0.1rem;
    margin-left: 0.25rem;
    margin-right: 0.25rem;
    font-size: 2rem;

    &.current-page {
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: 0.5rem;
      color: var(--bng-orange-300);
    }
  }
}

.bng-image-carousel.images {
  width: 100%;
  height: 100%;
  border-radius: 0.5rem;
  overflow: hidden;

  :deep(img) {
    border-radius: 0.5rem;
  }
}
</style>
