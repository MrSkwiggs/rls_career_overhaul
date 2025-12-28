<!-- Milestones -->
<template>
  <LayoutSingle  v-bng-on-ui-nav:back,menu="exit" class="milestones-layout" v-bng-blur>
    <div class="milestones-wrapper">
      <BngScreenHeading>Milestones</BngScreenHeading>
      <div
        bng-ui-scope="milestones"
        class="career-milestones-card"
        v-bng-on-ui-nav:back,menu="exit"
        v-bng-on-ui-nav:tab_l="selectOneFilters && selectOneFilters.focusPrevious"
        v-bng-on-ui-nav:tab_r="selectOneFilters && selectOneFilters.focusNext">
        <div class="career-milestones-container">
          <div class="actions">
            <BngButton class="exitButton" @click="exit" :accent="ACCENTS.attention"
              ><BngBinding tabindex="1" ui-event="back" deviceMask="xinput" />Back</BngButton
            >
            <CareerStatus class="career-page-status" ref="careerStatusRef" />
          </div>
          <div class="filters">
            <BngIcon class="career-filter-icon" :type="icons.filter" />
            <BngPillFilters required ref="selectOneFilters"v-model="selectedFilters" :options="FILTER_OPTIONS" @valueChanged="filterChanged" />
          </div>
          <div class="scrollable-container" bng-nav-scroll-force>
            <div class="cards-container">
              <MilestoneCard
                tabindex="1"
                v-for="entry in entries"
                :milestone="entry"
                :isCondensed="false"
                @claim="claimMilestone"
                v-bng-sound-class="entry.claimable ? 'bng_click_hover_generic' : 'bng_hover_generic'" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </LayoutSingle>
</template>

<script setup>
import { LayoutSingle } from "@/common/layouts"
import { BngScreenHeading, BngPillFilters, BngBinding, BngButton, ACCENTS, BngIcon, icons } from "@/common/components/base"
import { vBngBlur, vBngOnUiNav, vBngSoundClass } from "@/common/directives"
import MilestoneCard from "../components/milestones/MilestoneCard.vue"
import { CareerStatus } from "@/modules/career/components"
import { lua } from "@/bridge"
import { ref, onMounted, onUnmounted, onBeforeMount } from "vue"

import { useUINavScope } from "@/services/uiNav"
useUINavScope("milestones") // UI Nav events to fire from (or from focused element inside) element with attribute: bng-ui-scope="milestones"

const props = defineProps({
  id: String,
})
const careerStatusRef = ref()
let allEntries = []
const entries = ref([])
const selectOneFilters = ref()
const selectedFilters = ref(['general'])
//const filterOnlyAll = [{ value: 0, label: "All" }]
//filteroptions should be computed in the setup function :(
const FILTER_OPTIONS = [
  { value: "general", label: "General" },
  { value: "all", label: "All" },
  { value: "mission", label: "Challenges" },
  { value: "branch", label: "Branches" },
  { value: "delivery", label: "Delivery" },
  { value: "money", label: "Money" },
  { value: "speedTrap", label: "Speed Traps" },
  { value: "insurance", label: "Insurance" },
]

function sortMilestones() {
  entries.value.sort(function (a, b) {
    if (a.claimable && !b.claimable) return -1 // a is claimable, b is not, so a should come first
    if (b.claimable && !a.claimable) return 1 // b is claimable, a is not, so b should come first
    if (!a.completed && b.completed) return -1 // a is not completed, b is completed, so a should come first
    if (a.completed && !b.completed) return 1 // b is not completed, a is completed, so b should come first
    // If both are claimable or both are completed, sort by claimId
    if (a.claimId < b.claimId) return -1 // a's claimId is smaller, so it should come first
    return 1 // b's claimId is smaller or equal, so it should come first or be equal
  })
}

let currentFilter = "general"
function filterEntries() {
  if (currentFilter == "all") {
    entries.value = allEntries.filter(e => true)
  } else {
    entries.value = allEntries.filter(e => e.filter[currentFilter])
  }
  sortMilestones()
}

function filterChanged(filterList) {
  if (filterList) {
    currentFilter = filterList[0]
  }
  filterEntries()
}

function setup(data) {
  allEntries = data.list
  let hasClaimable = false
  data.list.forEach((x) => {if(x.claimable) hasClaimable=true})
  if(hasClaimable) {
    selectedFilters.value = ['all']
    filterChanged(selectedFilters.value)
  }
  //filterOptions.value = filterOnlyAll.concat(data.filters.map((filter, index) => ({ value: index + 1, label: filter })));
  //filterOptions = computed(() => filterOnlyAll.concat(data.filters.map((filter, index) => ({ value: index + 1, label: filter }))))
  filterEntries()
}

lua.career_modules_milestones_milestones.getMilestones().then(setup)

const claimMilestone = entry => {
  lua.career_modules_milestones_milestones.claim(entry.claimId).then(replacementEntry => {
    careerStatusRef.value.updateDisplay()
    let replacementId = allEntries.findIndex(item => item.claimId === entry.claimId)

    //replace entry and exit early
    if (replacementEntry !== undefined && replacementEntry !== null && replacementId !== -1) {
      allEntries[replacementId] = replacementEntry
      filterEntries()
      return
    }

    //if no entry or no replacement id found
    allEntries[replacementId].claimable = false
    filterEntries()
  })
}

const exit = () => {
  window.bngVue.gotoGameState("progressLanding")
}

onUnmounted(() => {
  lua.simTimeAuthority.popPauseRequest('milestones')
})

onBeforeMount(() => {
  lua.simTimeAuthority.pushPauseRequest('milestones')
})

</script>

<style lang="scss" scoped>
$textcolor: #fff;
$fontsize: 1rem;

hr {
  margin: 0.5em;
  border: none;
  border-top: 1px solid var(--bng-cool-gray-600);
}

.milestones-layout {
  --safezone-top: 0;
  --safezone-bottom: var(--safezone-new-info-bar);
  --content-flow: column nowrap;

  color: $textcolor;
  font-size: $fontsize;
}

.milestones-wrapper {
  display: flex;
  max-width: 80em;
  flex-flow: column;
  overflow: hidden;
  flex: 1 1 auto;
  align-self: center;
}

.career-milestones-card {
  display: flex;
  height: 100%;
  max-width: 80em;

  overflow: hidden;
}

.career-milestones-container {
  display: flex;
  flex: 1 0 auto;
  flex-direction: column;
  //justify-content: flex-start;
  //align-items: stretch;

  background: rgba(0, 0, 0, 0.8);
  border-radius: var(--bng-corners-3);
  overflow: hidden;
}

.scrollable-container {
  overflow-y: scroll;
}

.cards-container {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fill, minmax(15em, 1fr));
  padding: 1rem;
}

.filters {
  flex: 0 0 auto;
  display: flex;
  flex-direction: row;
  width: fit-content;
}

.actions {
  flex: 0 0 auto;
  display: flex;
  flex-direction: row;
  width: 100%;
  padding: 0.5rem 1rem;
  align-items: center;
  justify-content: space-between;
  > .exitButton {
    margin-right: 1rem;
  }
}

.career-filter-icon {
  font-size: 2em;
  padding-left: 1rem;
  padding-right: 0.5rem;
}

.career-page-status {
  padding: 0.5rem 0.75rem 0.5rem 0.5rem;
  font-weight: 800;
  display: flex;
  justify-content: center;
  align-items: left;
}
</style>
