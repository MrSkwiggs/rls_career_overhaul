<template>
  <div
    v-if="selectedActivity"
    class="activity-start"
    bng-ui-scope="activityStart"
    v-bng-on-ui-nav:tab_l.up="goPrev"
    v-bng-on-ui-nav:tab_r.up="goNext"
    v-bng-on-ui-nav:menu="openPauseMenu"
  >
    <ActivitySelector
      ref="activitySelector"
      v-if="activityOptions && activityOptions.length > 1"
      :activities="activityOptions"
      :value="selectedActivityIndex"
      @valueChanged="onActivitySelected"
      navLeftEvent="tab_l"
      navRightEvent="tab_r"
    />
    <BngScreenHeading
      v-if="selectedActivity.heading"
      mute divider
      :preheadings="preheadings"
      :blur-delay="400"
    >
      {{ $ctx_t(selectedActivity.heading) }}<template v-if="selectedActivity.description">: {{ $ctx_t(selectedActivity.description) }}</template>
    </BngScreenHeading>
    <div class="activity-props">
      <BngMainStars
        v-if="selectedActivity.stars && selectedActivity.stars.defaultStarCount"
        :unlocked-stars="selectedActivity.stars.defaultUnlockedStarCount"
        :total-stars="selectedActivity.stars.defaultStarCount"
        class="main-stars" />
      <BngMainStars
        v-if="selectedActivity.stars && selectedActivity.stars.bonusStarCount"
        :unlocked-stars="selectedActivity.stars.bonusStarsUnlockedCount"
        :total-stars="selectedActivity.stars.bonusStarCount"
        class="bonus-stars" />
      <BngPropVal
        v-for="(label, index) of selectedActivity.labels"
        :key="index"
        :iconType="label.icon"
        :keyLabel="label.keyLabel"
        :valueLabel="label.valueLabel" />
    </div>
    <div>
      <BngButton
        :accent="ACCENTS.main"
        v-bng-on-ui-nav:gameplay_interact.asMouse
        @click="invokeActivityAction"
      >
      <span class="binding-spacer">
        <BngBinding action="gameplay_interact"/>
      </span>
       <template v-if="selectedActivity.startable"> {{ $ctx_t(selectedActivity.buttonLabel) }} </template>
       <template v-else>
         {{ $tt("ui.mission.action.locked") }}
       </template>
      </BngButton>
      <BngButton
        :accent="ACCENTS.secondary"
        v-bng-on-ui-nav:back.asMouse @click="onCancel"
      >
        <BngBinding ui-event="back" controller />
        {{ $tt("ui.common.close") }}
      </BngButton>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeMount, ref, onUnmounted, onMounted, watch } from "vue"
import { storeToRefs } from "pinia"
import { BngButton, ACCENTS, BngScreenHeading, BngPropVal, BngMainStars, BngBinding, icons } from "@/common/components/base"
import { $translate, useGameContextStore } from "@/services"
// import { useUINavScope } from "@/services/uiNav"
// import { default as UINavEvents, UI_EVENT_GROUPS, UI_EVENTS } from "@/bridge/libs/UINavEvents"
import { getUINavServiceInstance, useUINavScope, UI_EVENTS } from "@/services/uiNav"
import { vBngOnUiNav, vBngOcclusionWatcher } from "@/common/directives"
import { lua } from "@/bridge"
import ActivitySelector from "../components/ActivitySelector.vue"

useUINavScope("activityStart")

const activitySelector = ref(null)
const goNext = () => activitySelector.value && activitySelector.value.goNext()
const goPrev = () => activitySelector.value && activitySelector.value.goPrev()

const gameContextStore = useGameContextStore()

const { activities } = storeToRefs(gameContextStore)
const { closeActivitiesPrompt } = gameContextStore

const selectedActivityIndex = ref(0)
const availableActivities = ref([])
const activityOptions = computed(() => {
  const result = availableActivities.value ? availableActivities.value.map((x, index) => ({ id: index, value: index, icon: x.icon })) : []
  doFiltering && filterEvents(result.length > 1)
  return result
})

const BNG_MAIN_STARS_TYPE = "BngMainStars"

const selectedActivity = computed(() => {
  if (selectedActivityIndex.value < 0 || !availableActivities.value || availableActivities.value.length === 0) return null

  const activity = availableActivities.value[selectedActivityIndex.value]
  const labels = activity.props && activity.props.length > 0 ? activity.props.filter(x => !x.type) : []

  return {
    heading: activity.heading,
    icon: activity.icon,
    preheadings: activity.preheadings,
    labels: labels.map(x => ({ keyLabel: $translate.instant(x.keyLabel), valueLabel: $translate.instant(x.valueLabel), icon: icons[x.icon] })),
    stars: activity.props && activity.props.length > 0 ? activity.props.find(x => x.type === BNG_MAIN_STARS_TYPE) : null,
    startable: true,
    buttonLabel: activity.buttonLabel,
    action: activity.action,
    missionInfoPerformActionIndex: activity.missionInfoPerformActionIndex,
  }
})

const preheadings = computed(() =>
  selectedActivity.value && selectedActivity.value.preheadings ? selectedActivity.value.preheadings.map(x => $translate.contextTranslate(x)) : []
)

const invokeActivityAction = () => {
  lua.ui_missionInfo.performActivityAction(selectedActivity.value.missionInfoPerformActionIndex)
}

watch(selectedActivity, () => {
  lua.ui_missionInfo.setActivityIndexVisible(selectedActivityIndex.value)
})

const onActivitySelected = value => {
  selectedActivityIndex.value = value
}

const onCancel = () => {
  closeActivitiesPrompt()
}

const openPauseMenu = () => {
  onCancel()
  window.globalAngularRootScope && window.globalAngularRootScope.$broadcast("MenuToggle")
}

onBeforeMount(() => {
  availableActivities.value = activities.value
})

onMounted(() => {
  // UINavEvents.activate()
  getUINavServiceInstance().activate()
})

onUnmounted(() => {
  doFiltering = false
  getUINavServiceInstance().setFilteredEventsAllExcept(UI_EVENTS.menu, UI_EVENTS.pause, UI_EVENTS.center_cam)
  // UINavEvents.setFilteredEvents.allExcept(UI_EVENTS.menu, UI_EVENTS.pause, UI_EVENTS.center_cam)
  lua.ui_missionInfo.setActivityIndexVisible(-1)
})

let doFiltering = true
const filterEvents = withTabs =>
  // UINavEvents.setFilteredEvents.allExcept(
  getUINavServiceInstance().setFilteredEventsAllExcept(
    UI_EVENTS.back,
    UI_EVENTS.menu,
    UI_EVENTS.pause,
    UI_EVENTS.center_cam,
    ...(withTabs ? [UI_EVENTS.tab_l, UI_EVENTS.tab_r] : [])
  )
</script>

<style lang="scss" scoped>
@use "@/styles/modules/density" as *;

$bgcolor: rgba(black, 0.6);

:deep(.bng-button[accent="text"]) {
  background-color: $bgcolor;
}

.activity-start {
  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
  justify-content: flex-start;
  padding-left: 5rem;
  max-width: 56em;

  > * {
    margin-bottom: 0.5rem;
  }

  > .activity-props {
    display: flex;
    flex-flow: row wrap;
    margin: -0.25rem;

    --paddings: 0.25em 0.5em;

    & > * {
      margin: 0.25rem;
      min-height: 2rem;
    }

    > :deep(.info-item) {
      border-radius: $border-rad-1;
      background-color: $bgcolor;
      color: white;
      align-items: center;
      &:not(.with-icon) {
        padding: 0.25rem 0.75rem;
      }
    }

    > .main-stars {
      --star-color: var(--bng-ter-yellow-50);
      padding: 0.25rem 0.5rem;
      display: flex;
      flex-flow: row nowrap;
      align-items: center;
      justify-content: center;
    }

    > .bonus-stars {
      --star-color: var(--bng-add-blue-400);
      padding: 0.25rem 0.5rem;
      display: flex;
      flex-flow: row nowrap;
      align-items: center;
      justify-content: center;
    }
  }

  .bng-screen-heading {
    margin-left: -5rem;
    max-width: 40rem;
  }

  > :nth-last-child(2) {
    margin-bottom: 1rem;
  }

  > .details-button {
    border: 1px solid var(--bng-orange-b400);
  }

  .binding-spacer {
    margin-left: 0.3rem;
    margin-right: 0.5rem;
    margin-top: 0.15rem;
  }
}
</style>
