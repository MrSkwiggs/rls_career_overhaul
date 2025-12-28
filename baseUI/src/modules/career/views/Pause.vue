<!-- Career Pause -->
<template>
  <LayoutSingle class="career-pause-layout"
    bng-ui-scope="pause"
    v-bng-on-ui-nav:menu,back="exit"
    v-bng-blur="true"
  >
    <div class="pause-body-wrapper">
          <div class="heading-container">
            <BngCardHeading class="pause-heading" :type="'ribbon'">Career: Paused</BngCardHeading>
          </div>
          <div class="buttons-and-status">
            <BngCard class="system-buttons">
              <BngButton class="button" tabindex="1" :accent="ACCENTS.text" @click="exit">Resume</BngButton>
              <template v-if="contextButtons.length > 0">
                  <BngButton v-for="btn in contextButtons"
                  class="button"
                  tabindex="1"
                  :accent="ACCENTS.text"
                  @click="onContextButtonClicked(btn)">
                  {{ $ctx_t(btn.label) }}
                  <div v-if="btn.showIndicator" class="indicator"></div>
                </BngButton>
              </template>
              <div class="save-load-row">
                <BngButton class="button" tabindex="1" :accent="ACCENTS.text" @click="onSaveButtonClicked">Save</BngButton>
                <BngButton class="button" tabindex="1" :accent="ACCENTS.text" @click="onLoadButtonClicked">Load</BngButton>
              </div>
            </BngCard>
            <div class="status-container">
              <BngCardHeading v-if="saveSlotData" class="profile-name" :type="'ribbon'">
                {{ saveSlotData.id }}
              </BngCardHeading>
              <ProfileStatus
                v-if="saveSlotData"
                class="pause-profile-status"
                :expanded="true"
                :beamXP="saveSlotData.beamXP"
                :vouchers="saveSlotData.vouchers"
                :money="saveSlotData.money"
                :insuranceScore="saveSlotData.insuranceScore"
                :branches="saveSlotData.branches"
              />
              <div v-if="saveSlotData" class="vehicle-name">
                <BngIcon :type="icons.car" />
                {{ currentVehicleName }}
              </div>
            </div>
          </div>
    </div>
  </LayoutSingle>
</template>

<script setup>
import { BngButton, ACCENTS, BngCard, BngCardHeading, BngSlider, BngPillFiltersContainer, BngInput, icons, BngIcon } from "@/common/components/base"
import { AspectRatio } from "@/common/components/utility"
import { vBngBlur, vBngSoundClass, vBngOnUiNav } from "@/common/directives"
import { openConfirmation } from "@/services/popup"

import { lua } from "@/bridge"
import { ref, onMounted, onUnmounted, onBeforeMount } from "vue"

import { useUINavScope } from "@/services/uiNav"
import { LayoutSingle } from "@/common/layouts"
import { CareerStatus, CareerSimpleStats } from "@/modules/career/components"
import  ProfileStatus  from "@/modules/career/components/profiles/ProfileStatus.vue"

import PauseMapPreview from "../components/pause/PauseMapPreview.vue"
import PauseMilestonesPreview from "../components/pause/PauseMilestonesPreview.vue"

useUINavScope("pause") // UI Nav events to fire from (or from focused element inside) element with attribute: bng-ui-scope="pause"

//BngImageTile default ratio for the icon
const ICON_RATIO = "2.25:1"

//middle section pills
const MIDDLE_PILL_OPTIONS = [
  { value: 0, label: "Map", type: "Map" },
  { value: 1, label: "Milestones", type: "Milestones" },
  { value: 2, label: "Engine" },
  { value: 3, label: "Transmission" },
  { value: 4, label: "Suspension" },
  { value: 5, label: "Electrics" },
  { value: 6, label: "Electrics1" },
  { value: 7, label: "Electrics2" },
  { value: 8, label: "Electrics3" },
]

const currentPillTypeSelected = ref(MIDDLE_PILL_OPTIONS[0].type)
const middlePillsContainerRef = ref(null)

function onSelectCurrent() {
  middlePillsContainerRef.value.selectCurrent()
}

function onMiddlePillsSelectPrevious() {
  middlePillsContainerRef.value.selectPrevious()
}

function onMiddlePillsSelectNext() {
  middlePillsContainerRef.value.selectNext()
}

function middlePillsValueChanged(selectedValues) {
  let pillId = selectedValues[0]
  let selectedPill = MIDDLE_PILL_OPTIONS.find(pill => pill.value === pillId)
  currentPillTypeSelected.value = selectedPill.type
}

//TOD Slider
const todSliderValue = ref(0.5)
// on load: get correct todSlider value from env
const onTODChanged = v => {
  //call lua...
  console.log(v)
}

const contextButtons = ref({})

function setupContextButtons(data) {
  contextButtons.value = data.buttons
}
lua.career_modules_uiUtils.getCareerPauseContextButtons().then(setupContextButtons)
function onContextButtonClicked(btn) {
  lua.career_modules_uiUtils.callCareerPauseContextButtons(btn.functionId)
}

function onExitCareerButtonClicked() {
  console.log("onExitCareerButtonClicked")
  //TODO
}
function onSaveButtonClicked() {
  lua.career_saveSystem.saveCurrent()
  exit()
}
async function onLoadButtonClicked() {
  const confirmed = await openConfirmation(
    "Load Profile",
    "Are you sure you want to load a different profile? Any unsaved progress will be lost."
  )

  if (confirmed) {
    window.bngVue.gotoGameState("profiles")
  }
}
function onSettingsButtonClicked() {
  console.log("onSettingsButtonClicked")
  //TODO
}

const exit = () => window.bngVue.gotoGameState("play")

const saveSlotData = ref(null)
const currentVehicleName = ref('')

function makeVehicleName(data) {
  if (!data) return 'Walking'
  if (data.key === 'unicycle') {
    return 'Walking' // Using hardcoded string since we don't have translation service
  }
  return data.niceName
}

onMounted(async () => {
  const data = await lua.career_career.sendCurrentSaveSlotData()
  saveSlotData.value = data

  // Get current vehicle data and set name
  currentVehicleName.value = makeVehicleName(data.currentVehicle)
})

onBeforeMount(() => {
  lua.simTimeAuthority.pushPauseRequest('careerPause')
})

onUnmounted(() => {
  lua.simTimeAuthority.popPauseRequest('careerPause')
})
</script>

<style lang="scss" scoped>
$textcolor: #fff;
$fontsize: 1.0rem;

hr {
  margin: 0.5em;
  border: none;
  border-top: 1px solid var(--bng-cool-gray-600);
}

.career-pause-layout {
  --safezone-top: var(--safezone-topbar);
  --safezone-bottom: var(--safezone-new-info-bar);
  --content-flow: row nowrap;



  pointer-events: none;
  > * {
    pointer-events: all;
    justify-content: center;
  }
}



.pause-body-wrapper {
  align-self: center;
  justify-self: center;
    color: $textcolor;
    font-size: $fontsize;
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .heading-container {
      background-color: rgba(0, 0, 0, 0.66);
      border-radius: var(--bng-corners-2);
      padding: 0.75rem;
    }

    .pause-heading {
      color: white;
      font-size: 2.8rem;
      font-weight: 700;
      margin: 0;
      margin-left: -0.75rem;
    }

    .buttons-and-status {
      display: flex;
      gap: 1.5rem;
      align-items: flex-start;
    }

    .system-buttons {
      width: 25rem;

      .button {
        outline: 2px solid rgba(var(--bng-orange-500-rgb), 0.5);
        height: 2.5rem;
        display: flex;
        font-size: 1.1rem;
        font-weight: 500;
        align-items: center !important;
      }

      :deep(.card-cnt) {
        display: flex;
        flex-direction: column;
        background-color: rgba(0, 0, 0, 0.66);
        gap: 0.5rem;
        > * {
          max-width: 100%;

        }
        padding: 1rem;

        .save-load-row {
          max-width: 100%;
          width: 100%;
          display: flex;
          gap: 0.5rem;
          > * {
            flex: 1;

          }
        }
      }
    }

  }

  .career-pause-container {
    display: flex;
    flex: 1 0 auto;
    flex-direction: row;
    //justify-content: flex-start;
    //align-items: stretch;
    height: 100%;
  }


  .buttons-and-status {
    .status-container {
      display: flex;
      flex-direction: column;
      background-color: rgba(0, 0, 0, 0.66);
      border-radius: var(--bng-corners-2);

      .profile-name {
        color: white;
        font-size: 1.9rem;
        font-weight: 700;
        margin-bottom: 0;
        margin-top: 0.5rem;
      }
      .pause-profile-status {
        color: white;
        background: none;
        padding-bottom: 0;
        width: 22rem;
        :deep(.profile-status-levels) {
          background: none;
        }
      }
      .vehicle-name {
        color: white;
        font-size: 1.25rem;
        padding: 0.5rem;
        font-weight: 500;
        text-align: center;
      }
    }
  }

.pause-profile-status {
  color: white;
  :deep(.status-progress-item) {
    background-color: none;
  }
}

.indicator {
  width: 0.75rem;
  height: 0.75rem;
  background-color: yellow;
  border-radius: 50%;
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
}
</style>
