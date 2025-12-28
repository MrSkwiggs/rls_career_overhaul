<!-- Landing Page -->
<template>
  <ProgressView
    :skill-info="landingData.skillInfo"
    :heading-text="$t(pageHeading)"
    :breadcrumb-items="screenHeaderPath"
    :branch-style="branchStyle"
    :show-back-button="true"
    @breadcrumb-click="gotoHeaderItem"
    @breadcrumb-back="onBreadBack"
    @exit="exit"
  >
    <template #description>
      <div class="description-text">{{ $t(pageDescription) }}</div>
    </template>

    <template #default>

      <div class="cards-container grid-view" v-if="BRANCHES.length > 0">
        <!--<BranchSkillCard
          tabindex="1"
          v-for="branch in BRANCHES.filter(b => !b.isSkill)"
          v-bng-sound-class="'bng_click_hover_generic'"
          :branchKey="branch.id"
          @openBranchPage="openBranchPage"
          @mouseenter="onBranchFocus(branch)"
          @mouseleave="onBranchBlur"
          @focus="onBranchFocus(branch)"
          @blur="onBranchBlur"
          bng-nav-item />
      -->
        <BranchSkillCard
          tabindex="1"
          v-for="branch in BRANCHES"
          v-bng-sound-class="'bng_click_hover_generic'"
          :branchKey="branch.id"
          @openBranchPage="openBranchPage"
          @mouseenter="onBranchFocus(branch)"
          @mouseleave="onBranchBlur"
          @focus="onBranchFocus(branch)"
          @blur="onBranchBlur"
          bng-nav-item
          display-mode="row"
          :class="{ 'full-width': !isHalfBranch(branch) }" />
      </div>
      <div v-if="currentSkillToShow && currentSkillToShow.hasLevels && currentSkillToShow.unlockInfo && currentSkillToShow.unlockInfo.length" class="page-progress">
        <UnlockRows v-if="currentSkillToShow.hasUnlocks"
          class="stat-progress-bar bng-progress-bar progress-bar"
          :headerLeft="$ctx_t(currentSkillToShow.name)"
          :headerRight="$ctx_t(currentSkillToShow.levelLabel)"
          :value="currentSkillToShow.value"
          :max="currentSkillToShow.max"
          :min="currentSkillToShow.min"
          :maxRequiredValue="currentSkillToShow.maxRequiredValue"
          :tiers="currentSkillToShow.unlockInfo"
          :currentTier="currentSkillToShow.unlocked ? currentSkillToShow.level : -1"
          :unlocked="currentSkillToShow.unlocked"
          :progressFillColor="currentSkillToShow.accentColor"
        />
      </div>
      <div v-if="leagues && leagues.length > 0" class="facility-rows">
        <template v-for="league in leagues" :key="league.id">
          <LeagueRow
            :league="league"
            :leagueMissionClicked="leagueMissionClicked"
          />
        </template>
      </div>
      <div class="buttons-container" v-if="landingData.showMilestones">
        <BngCard
          bng-nav-item
          class="button milestone-button"
          v-bng-sound-class="'bng_click_hover_generic'"
          @click="openMilestonesScreen">
          <div class="content">
            <BngIcon class="icon" :type="icons.checkboxOn" />
            <div class="label">
              Milestones
            </div>
            <div v-if="hasUnclaimedMilestones > 0" class="indicator">

            </div>
          </div>
        </BngCard>
      </div>
    </template>
  </ProgressView>
</template>

<script setup>
import { BngCard, BngIcon, icons } from "@/common/components/base"
import { vBngSoundClass } from "@/common/directives"
import BranchSkillCard from "../components/progress/BranchSkillCard.vue"
import LeagueRow from "../components/progress/LeagueRow.vue"
import UnlockRows from "../components/progress/UnlockRows.vue"
import ProgressView from "../components/ProgressView.vue"
import { ref, onBeforeMount, onMounted, computed, onUnmounted, watch } from "vue"
import { lua } from "@/bridge"
import router from "@/router"
import { getBranchColorStyle } from "@/utils/colorUtils"

const props = defineProps({
  pathId: String,
  comesFromBigMap: {
    type: Boolean,
    default: false
  }
})

const landingData = ref({
  heading: "ui.career.landingPage.name",
  description: "ui.career.landingPage.description",
  branches: [],
  showMilestones: true,
  showOrganizations: true
})

const leagues = ref([])

const fetchLandingData = async () => {
  landingData.value = {
    heading: "ui.career.landingPage.name",
    description: "ui.career.landingPage.description",
    branches: [],
    showMilestones: true,
    showOrganizations: true
  }
  const data = await lua.career_modules_branches_landing.getLandingPageData(props.pathId)
  landingData.value = data
  leagues.value = data.leagues || []
  console.log("data", data)
  if(data.breadcrumbs) {
    screenHeaderPath.value = data.breadcrumbs
    console.log("screenHeaderPath", screenHeaderPath.value)
  }
}


const hasUnclaimedMilestones = ref(false)
onMounted(async () => {
  await fetchLandingData()
  lua.career_modules_milestones_milestones.unclaimedMilestonesCount().then((c) => hasUnclaimedMilestones.value = c)
  //console.log("progressLanding", props.pathId, props.comesFromBigMap)
})

onBeforeMount(() => {
  lua.simTimeAuthority.pushPauseRequest('progressLanding')
})

onUnmounted(() => {
  lua.simTimeAuthority.popPauseRequest('progressLanding')
})

// Watch for pathId changes and refetch data when navigating between landing pages
watch(() => props.pathId, async (newPathId, oldPathId) => {
  if (newPathId !== oldPathId) {
    await fetchLandingData()
    lua.career_modules_milestones_milestones.unclaimedMilestonesCount().then((c) => hasUnclaimedMilestones.value = c)
  }
})

const leagueMissionClicked = mission => {
  if (mission.canStartFromProgressScreen) {
    lua.extensions.gameplay_missions_missionScreen.setPreselectedMissionId(mission.id)
    lua.extensions.gameplay_missions_missionScreen.openAPMChallenges(props.pathId, mission.skill[0])
  } else {
    lua.extensions.gameplay_missions_missionScreen.navigateToMission(mission.id)
  }
}

const branchStyle = computed(() => {
  if (!landingData.value.skillInfo) {
    return {
      '--branch-accent-color': 'var(--bng-cool-gray-500-rgb)',
      '--branch-color': 'var(--bng-cool-gray-500-rgb)'
    }
  }

  return getBranchColorStyle({
    color: landingData.value.skillInfo.color,
    accentColor: landingData.value.skillInfo.accentColor
  })
})

const pageHeading = computed(() => landingData.value.branchHeading || landingData.value.heading)
const currentDescription = ref(null)
const pageDescription = computed(() =>
  currentDescription.value || landingData.value.description
)
const BRANCHES = computed(() => landingData.value.branches)

const openBranchPage = branchKey => {
  let target = landingData.value.branches.find(b => b.id === branchKey).target
  if (target === 'skillPage') {
    //window.bngVue.gotoGameState("branchPage", { params: { branchKey } })
  } else if (target === 'landing') {
  }
  console.log("openBranchPage", branchKey)
  window.bngVue.gotoGameState("progressLanding", { params: { pathId: branchKey } })
}
const exit = () => {
  //console.log("exit", props.pathId, props.comesFromBigMap)
  if(props.pathId && !props.comesFromBigMap) {
    router.back()
  } else {
    window.bngVue.gotoAngularState("menu.careerPause")
  }
}

const openReputationScreen = () => window.bngVue.gotoGameState("organizations")
const openMilestonesScreen = () => window.bngVue.gotoGameState("milestones")


const onBranchFocus = (branch) => {
  currentDescription.value = branch.description
}

const onBranchBlur = () => {
  currentDescription.value = null
}

const isHalfBranch = (branch) => {
  const hasSkills = branch.skills && branch.skills.length > 0
  const hasDescription = branch.shortDescription
  return !hasSkills && !hasDescription
}

const currentSkillToShow = computed(() => {
  return landingData.value.skillInfo || null
})

//breadcrumbs
const screenHeaderPath = ref([
  { label: "Career", path: "/career" },
  { label: landingData.value.heading, path: `/career/${landingData.value.id}` }
])
const gotoHeaderItem = (item) => {
  if(item.gotoPath) {
    window.bngVue.gotoGameState(item.gotoPath.path, { params: item.gotoPath.props })
    console.log("gotoPath", item.gotoPath)
  }
  if(item.gotoAngularState) {
    window.bngVue.gotoAngularState(item.gotoAngularState)
  }
}
const onBreadBack = () => {
  gotoHeaderItem(screenHeaderPath.value[screenHeaderPath.value.length - 2])
}

</script>

<style lang="scss" scoped>
.description-text {
  font-size: 1.2rem;
  line-height: 1.2;
  height: 3rem;
  align-content: center;
  text-align: center;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
}

.page-progress {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  justify-items: center;
  gap: 1rem;
  padding: 0.5rem;
  padding-bottom: 0;
}

.cards-container {
  flex: 0 auto;
  padding: 0 0.5rem ;
  justify-content: center;
  :deep(.stat-progress-bar) {
    font-size: 1.25rem;
  }

  &.grid-view {
    display: grid;
    grid-template-columns: 1fr 1fr ;
    gap: 0.5rem;
    align-items: stretch;
    grid-auto-flow: row dense;
    grid-auto-rows: min-content;

    > * {
        grid-column: span 2;
    }
  }
}

.facility-rows {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  padding: 0.25rem;
  background-color: rgba(black, 0.6);
  border-radius: var(--bng-corners-2);
  gap: 0.25rem;
  margin: 0.5rem;
}

.buttons-container {
  display: flex;
  justify-content: center;
  padding: 0.5rem;
  padding-top: 0rem;
  cursor: pointer;

  > * {
    flex: 1 1 auto;
    padding: 0.5rem;
    padding-top: 0rem;
    max-width: 32rem;
  }

  > .milestone-button {
    padding: 0;
  }

  .indicator {
    width: 0.75rem;
    height: 0.75rem;
    background-color: yellow;
    border-radius: 50%;
    position: absolute;
    top: 0.35rem;
    right: 1rem;
  }

  :deep(.content) {
    &:focus,
    &:hover {
      background-color: rgba(var(--bng-cool-gray-800-rgb), 0.9) !important;
    }
    display: flex;
    flex-flow: row;
    justify-content: center;
    align-items: center;

    .icon {
      font-size: 3rem;
      padding-right: 1rem;
    }
    .label {
      font-size: 1.5rem;
    }
  }
}
</style>
