<!-- Career Cards -->
<template>
  <div class="career-cards-container" bng-ui-scope="careerCardsUI" v-bng-on-ui-nav:menu,back="exit">
    <div class="cards-heading">
      <BngScreenHeading :preheadings="preHeadingText"> {{headingText}} </BngScreenHeading>
    </div>
    <div class="cards-content">
      <!--Existing profile cards-->
      <div v-for="item in profiles">
        <div v-if="item.incompatibleVersion">
          This profile was saved with an old version of the game. It can no longer be loaded.
        </div>
        <!--Title-->
        {{ item.id }}
        <!--Content-->
        <!--Manage-->
        <!--Naming-->
      </div>
      <!--New profile card-->
      <div> </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted, onUnmounted } from "vue"
import { useBridge } from "@/bridge"
import { $translate } from "@/services"
import { vBngOnUiNav } from "@/common/directives"
import { useUINavScope } from "@/services/uiNav"
import { BngScreenHeading } from "@/common/components/base"
import router from "@/router"

const $game = inject("$game")
const bngVue = window.bngVue || { gotoGameState() { } }
const { lua, events } = useBridge()
useUINavScope('careerCardsUI')
const preHeadingText = [$translate.instant("ui.career.savedProgress")]
const headingText = $translate.instant("ui.career.profiles")


const profiles = ref()

const updateProfiles = () => {
  $game.api.engineLua("career_career.sendAllCareerSaveSlotsData()", (data) => {
    profiles.value = Array.isArray(data) ? data : []
  })
}

const renameProfile = (profileId, profileName) => {
  $game.api.engineLua(`career_saveSystem.renameSaveSlot("${profileId}", "${profileName}")`, () => {
    updateProfiles()
  })
}

const deleteProfile = (profileId) => {
  $game.api.engineLua(`career_saveSystem.removeSaveSlot("${profileId}")`, () => {
    updateProfiles()
  })
}

////On enter / exit////
const start = () => {
  updateProfiles()
}

const exit = () => {
  //
}

onMounted(start)
onUnmounted(exit)
</script>

<style lang="scss" scoped>
//constants

//module css
.career-cards-container {
  position: relative;
  margin: 0 auto;
  padding: 0 2%;
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: column;
  .cards-heading {
    display: flex;
    flex: 0 0 auto;
    margin: 0em 0em 1em 4.5em;
    font-family: 'Overpass', var(--fnt-defs) !important;
    font-style: italic;
    font-size: 1rem !important;
    font-weight: 800;
    color: white;
    flex-direction: column;
    align-items: flex-start;
    line-height: 1.25em;
  }
  .cards-heading::before {
    content: "";
    position: absolute;
    top: 0;
    background-color: var(--bng-orange);
    transform-origin: bottom left;
    transform: skewX(-20deg);
    left: -4.5em;
    width: 2em;
    height: 4.75em;
    z-index: 1;
  }
  .cards-content {
    display: flex;
    flex-wrap: nowrap;
    margin: -0.5em;
    overflow-x: auto;
    overflow-y: hidden;
    max-width: calc(100% - 2em);
  }
  .cards-content::after {
    flex: 1 1 auto;
    content: "";
  }
}
</style>