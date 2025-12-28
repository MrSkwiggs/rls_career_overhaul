<template>
  <InfoCard class="full-height" v-bng-on-ui-nav:ok="missionStartableDetails && missionStartableDetails.startable ? store.startMission : noop">
    <!--
    @focusin="() => (uiState.currentScope = 'basic-info')"
    @focusout="deactivateCard"-->
    <template #header>
      <BngAdvCardHeading mute divider :preheadings="preheadings">
        {{ $ctx_t(missionBasicInfo.name) }}
      </BngAdvCardHeading>
    </template>

    <template #content>
      <AspectRatio v-if="missionBasicInfo.images" class="previews">
        <BngImageCarousel :images="missionBasicInfo.images" transition class="images" external />
      </AspectRatio>
      <div class="description">{{ $ctx_t(missionBasicInfo.description) }}</div>

      <!-- optional: attribute pills - ->
      <div class="pills" v-if="missionBasicInfo.additionalAttributes">
        <template v-for="(label, index) in missionBasicInfo.additionalAttributes" :key="index">
          <BngPropVal
            class="pill"
            :iconType="icons[label.icon]"
            :keyLabel="label.labelKey"
            :valueLabel="label.valueKey"
          />
        </template>
      </div>
        Info: {{missionBasicInfo}}
        Details: {{missionStartableDetails}}
        Last: {{sameUserSettingsAsLast}}
      -->
    </template>

    <template #button>
      <div class="button-rows">
        <div class="entry-fee" v-if="missionBasicInfo.entryFee">
          <div class="label">
            Entry Fee:
          </div>
          <div>
            <RewardsPills class="tiny-rewards" :rewards="missionBasicInfo.entryFee" />
          </div>
        </div>
        <template v-if="missionStartableDetails">
          <BngButton
              v-if="selectedMission.hasRules"
              class="large start"
              accent="secondary"
              :icon-right="icons.help"
              @click="showRules"
              v-bng-on-ui-nav:ok.asMouse.focusRequired
              label="Rules" />

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
              class="large"
              :icon-left="icons.wrench"
              :disabled="!missionStartableDetails.startableEnabled"
              v-bng-on-ui-nav:ok.asMouse.focusRequired
              @click="store.startMission"
              @blur="preventAutoFocus"
              v-bng-focus-if="focusStartButton"
              :label="missionStartableDetails.selectedRepairTypeLabel" />
          </template>
          <template v-else>
            <BngButton
              v-if="missionStartableDetails.startableVisible"
              class="large start"
              :icon-right="icons.fastTravel"
              :disabled="!missionStartableDetails.startableEnabled"
              v-bng-on-ui-nav:ok.asMouse.focusRequired
              @click="store.startMission"
              @blur="preventAutoFocus"
              v-bng-focus-if="focusStartButton"
              label="Start the Challenge" />
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
              class="large start"
              :icon-right="icons.fastTravel"
              v-bng-on-ui-nav:ok.asMouse.focusRequired
              @blur="preventAutoFocus"
              v-bng-focus-if="focusStartButton"
              @click="cont" />
            <BngButton
              v-if="!missionStartableDetails.startableVisible && !missionStartableDetails.continueVisible"
              label="Locked"
              class="large start"
              :icon-right="icons.lockClosed"
              v-bng-on-ui-nav:ok.asMouse.focusRequired
              @blur="preventAutoFocus"
              v-bng-focus-if="false"
              disabled />
          </template>
        </template>
      </div>
    </template>
  </InfoCard>
</template>

<script setup>
import { $translate } from "@/services"
import { storeToRefs } from "pinia"
import { BngImageCarousel, BngButton, BngSelect, BngPropVal, icons } from "@/common/components/base"
import { vBngOnUiNav, vBngFocusIf } from "@/common/directives"
import { AspectRatio } from "@/common/components/utility"
import BngAdvCardHeading from "../components/bngAdvCardHeading.vue"
import RewardsPills from "../../career/components/progress/RewardsPills.vue"
import ActivitySelector from "@/modules/activitystart/components/ActivitySelector.vue"
import InfoCard from "../components/InfoCard.vue"
import { computed, ref } from "vue"
import { useMissionDetailsStore } from "@/modules/missions/stores/missionDetailsStore"
import { lua } from "@/bridge"

const emit = defineEmits(["continue"])

const store = useMissionDetailsStore()
const { selectedMission, missionBasicInfo, missionStartableDetails, sameUserSettingsAsLast } = storeToRefs(store)
const focusStartButton = ref(true)
const uiState = ref({})

const preheadings = computed(() =>
  missionBasicInfo.value.missionTypeLabels ? missionBasicInfo.value.missionTypeLabels.map(x => $translate.contextTranslate(x)) : []
)

const noop = () => {}
const exit = () => window.bngVue.gotoGameState("play")

function cont() {
  emit("continue")
}

function gotoMenu() {
  window.bngVue.gotoAngularState("menu.mainmenu")
}

function showRules() {
  lua.extensions.gameplay_missions_missionScreen.showMissionRules(selectedMission.value.id)
}

function preventAutoFocus() {
  focusStartButton.value = false
}
</script>

<style scoped lang="scss">
.pills {
  display: flex;
  flex-flow: row wrap;
  align-items: flex-start;
  padding-bottom: 0.5rem;
  > * {
    flex: 0 1 auto;
    padding: 0.25rem 1rem 0.5rem 0.5rem;
    background-color: var(--bng-cool-gray-600);
    border-radius: 10rem;
  }
  :deep(.value-label) {
    font-weight: 400;
  }
}

.mission-selector {
  position: absolute;
  right: 0;
  left: 0;

  :deep(.selector-control) {
    .selector-display {
      opacity: 0;
    }
  }
  :deep(.activities-container) {
    opacity: 0;
    height: 0;
  }
}
.button-rows {
  display: flex;
  flex-direction: column;
  .entry-fee {
    padding: 0.2rem;
    align-self: center;
    display: flex;
    flex-direction: row;
    align-items:center;
    .label {
      padding-right: 1em;
    }
    /**
    .tiny-rewards {
      :deep(.pill) {
        font-size: 0.7rem;
        opacity: 0.9;
      }

      :deep(.value-label) {
        font-weight: 400;
      }
    }
    */
  }
}

.full-height {
  height: 100%;
}
:deep(.card) {
  .card-cnt {
    flex: 1 1 auto;
  }
}
.bng-image-carousel.images {
  width: 100%;
  height: 100%;
}
:deep(.info-content) {
  padding: 0;
}

.description {
  padding-left: 1rem;
  padding-right: 1.5rem;
  padding-top: 0.5rem;
  font-size: 1.25rem;
}
</style>
