<template>
  <div
    :class="{
      innerTuningCard: true,
      'with-background': withBackground,
    }"
    v-bng-blur="withBackground"
  >
    <div v-if="tuningStore.buckets" class="tuning-form">
      <div v-if="extraFeatures.length > 0" class="extra-features">
        <BngButton v-bng-disabled="!extraFeatures.find(f => f.mirrorsEnabled)" @click="toMirrors" accent="secondary">{{ $t("ui.mirrors.name") }}</BngButton>
      </div>
      <div class="tuning-category" v-for="category in tuningStore.buckets" :key="category.name">
        <h2 class="category-heading"><span class="category-name">{{ category.name }}</span></h2>
        <div class="tuning-subcategory" v-for="subCategory in category.items" :key="subCategory.name">
          <h3 class="subcategory-heading" v-if="subCategory.name !== 'Other'"><span class="subcategory-name">{{ subCategory.name }}</span></h3>
          <div
            v-for="varData in subCategory.items"
            :key="category.name + subCategory.name + varData.name"
            :class="{ 'input-container': true, 'variable-box': varData.type === 'slider' }"
            v-bng-tooltip:top="varData.description"
          >
            <div class="variable-title">{{ varData.title }}</div>
            <div class="variable-box">
              <BngSlider
                ref="inputs"
                :min="varData.minDis"
                :max="varData.maxDis"
                :step="varData.stepDis"
                :unit="varData.unit"
                :class="{ 'property-slider': true }"
                with-input
                with-reset
                :orig-value="tuningStore.tuningVariables[varData.name].default"
                v-model="tuningStore.tuningVariables[varData.name].valDis"
                @valueChanged="onChange(varData.name)" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="tuning-static">
      <advancedWheelsDebug :class="{ 'awd-app': awdApp }" ref="awdApp" v-show="awdShow" />
      <!-- <Teleport :disabled="!buttonTarget" :to="buttonTarget"> -->
      <BngSwitch v-if="awdApp && awdApp.hasData" v-model="awdShow">{{ $t("ui.garage.tune.advWheel") }}</BngSwitch>
      <BngSwitch v-model="autoApply" @valueChanged="applySettingChanged">{{ $t("ui.garage.liveUpdates") }}</BngSwitch>
      <div class="buttons">
        <BngButton
          show-hold
          :icon="icons.undo"
          :accent="ACCENTS.custom"
          class="reset-button"
          v-bng-on-ui-nav:ok.asMouse.focusRequired
          v-bng-click="{ holdCallback: resetVarsToLoadedConfig, holdDelay: 1000, repeatInterval: 0 }"
          v-bng-tooltip="'Reset to original config'" />
      <BngButton :disabled="autoApply || !isChanged" @click="apply">{{ $t("ui.common.apply") }}</BngButton>
      <BngButton v-if="closeButton" @click="close" :accent="ACCENTS.attention"
        ><BngBinding ui-event="back" deviceMask="xinput" />{{ $t("ui.common.close") }}</BngButton
      >
      </div>
      <!-- </Teleport> -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeMount, onUnmounted, nextTick } from "vue"
import { BngButton, ACCENTS, BngSwitch, BngSlider, BngBinding, BngIcon, icons, BngCardHeading } from "@/common/components/base"
import { vBngBlur, vBngTooltip, vBngDisabled, vBngPopover, vBngScopedNav, vBngClick, vBngOnUiNav } from "@/common/directives"
import { advancedWheelsDebug } from "@/modules/apps"
import { useTuningStore } from "../stores/tuningStore"
// import { default as UINavEvents, UI_EVENT_GROUPS } from "@/bridge/libs/UINavEvents"
import { getUINavServiceInstance, UI_EVENT_GROUPS } from "@/services/uiNav"
import { debounce } from "@/utils/rateLimit"
import { useBridge } from "@/bridge"
import { useUINavBlocker } from "@/services/uiNavTracker"

const navBlocker = useUINavBlocker()
navBlocker.blockOnly(["context"])

const { lua } = useBridge()

const tuningStore = useTuningStore()

defineProps({
  withBackground: Boolean,
  buttonTarget: {
    type: Object,
  },
  closeButton: Boolean, // used in career mode
})

const awdApp = ref()
const awdShow = ref(false)

const apply = () => {
  tuningStore.apply()
  // for (let ipt of inputs.value) ipt.markClean()
}
const close = () => {
  // if (isChanged.value) {
  //   // TODO: confirmation
  // }
  tuningStore.close()
}

import { useSettingsAsync } from "@/services/settings.js"
const mirrorsShown = ref(true)
const mirrorsEnabled = ref(false)

let mirrorsRoute = "menu.vehicleconfig.tuning.mirrors"

const toMirrors = () => {
  // emit("mirrors:click")
  window.bngVue.gotoGameState(mirrorsRoute)
  // window.bngVue.gotoGameState(mirrorsRoute)
}

const inputs = ref([])

const isChanged = computed(() => inputs.value.some(ipt => ipt.dirty))

defineExpose({
  apply,
  close,
})

const autoApply = ref(false)
const applyDebounce = debounce(apply, 1000)

function onChange(varName) {
  //TODO is there a way to check here if the input is dirty or not?
  tuningStore.tuningVarChanged(varName)
  autoApply.value && applyDebounce()
}

const applySettingChanged = val => localStorage.setItem("applyTuningChangesAutomatically", JSON.stringify(val))

watch(
  () => tuningStore.buckets,
  () => nextTick(() => {
    for (let ipt of inputs.value) ipt.markClean()
  })
)

async function resetVarsToLoadedConfig() {
  tuningStore.resetTuningData()
  await tuningStore.requestInitialData()
  await nextTick()
  for (let ipt of inputs.value) ipt.markClean()
}

onBeforeMount(async () => {
  const optAutoApply = localStorage.getItem("applyTuningChangesAutomatically")
  if (optAutoApply) {
    try {
      autoApply.value = !!JSON.parse(optAutoApply)
    } catch (err) { }
  }

  if (await lua.extensions.gameplay_garageMode.isActive()) {
    mirrorsRoute = "menu.vehicleconfig.tuning.mirrors.in-garage"
  }
  // else if (await lua.career_career.isActive()) {
  //   mirrorsRoute = "career.tuning.mirrors"
  // }

  if (await lua.career_career.isActive()) {
    mirrorsShown.value = false
  } else {
    mirrorsEnabled.value = (await useSettingsAsync()).values.GraphicDynMirrorsEnabled
  }

  await tuningStore.init()
  await tuningStore.requestInitialData()
  // UINavEvents.setFilteredEvents(UI_EVENT_GROUPS.focusMoveScalar)
  getUINavServiceInstance().setFilteredEvents(UI_EVENT_GROUPS.focusMoveScalar)
})

const extraFeatures = computed(() => {
  const features = []
  if (mirrorsEnabled.value) {
    features.push({ mirrorsEnabled: true })
  }
  return features
})

onUnmounted(async () => {
  await tuningStore.notifyOnMenuClosed()
  tuningStore.close()
  tuningStore.$dispose()
  // UINavEvents.clearFilteredEvents()
  getUINavServiceInstance().clearFilteredEvents()
})
</script>

<style scoped lang="scss">
.innerTuningCard {
  display: flex;
  width: 100%;
  height: 100%;
  flex-flow: column;
  > * {
    flex: 1 1 auto;
    width: 100%;
  }
  > .tuning-static {
    flex: 0 0 auto;
    padding: 0.5em 1em;
    border-top: solid 2px var(--bng-orange);

    display: flex;
    flex-flow: row wrap;
    align-items: center;

    gap: 0.25em;

    .awd-app {
      flex: 1 0.15 100%;
      padding: 0;
    }

    .buttons {
      text-align: right;
      display: flex;
      justify-content: flex-end;
      gap: 0.125rem;
      height: 2.8em;

      flex: 1 0 auto;

      .reset-button {
        --bng-button-custom-hold-offset: 0px;
      }
    }
  }

  &.with-background {
    background-color: rgba(0, 0, 0, 0.6);
  }

  color: white;

  .tuning-form {
    padding: 0.5rem 0 1rem;
    text-align: center;
    overflow-y: scroll;
    will-change: scroll-position;

    .extra-features {
      display: flex;
      flex-flow: row wrap;
      justify-content: center;
      gap: 0.5rem;
    }

    .tuning-category {
      display: flex;
      flex-flow: column nowrap;
      padding: 0.5em 0 0.75em 0;
      // border-bottom: 1px solid var(--bng-orange-750);
      .category-heading {
        margin: 0 0 0 0;
        font-size: 1.25em;
        font-weight: 600;
        font-style: italic;
        text-align: left;
        margin: 0;
        padding: 0.5em 0.5em 0.5em 1rem;
        display: inline-flex;
        align-items: center;
        justify-content: flex-start;
        gap: 0.5em;
        color: var(--bng-orange-100);
        // transform: translateX(-1.5rem);
        &::after {
          content: "";
          display: inline-block;
          transform: translateY(0.125em);
          height: 1px;
          background: var(--bng-orange-750);
          flex: 1 1 auto;
        }
      }
      .tuning-subcategory {
        display: flex;
        flex-flow: column nowrap;
        padding: 0 0.5rem 0 1rem;

        .subcategory-heading {
          font-size: 1em;
          font-weight: 600;
          font-style: italic;
          text-align: left;
          margin: 0;
          padding: 0.5em 0 0.5em 0;
          display: inline-flex;
          align-items: center;
          justify-content: flex-start;
          gap: 0.5em;
          &::after {
            content: "";
            display: inline-block;
            transform: translateY(0.125em);
            height: 0.0625em;
            background: repeating-linear-gradient(to right, var(--bng-cool-gray-750), var(--bng-cool-gray-750) 0.25em, transparent 0.251em, transparent 0.45em);
            flex: 1 1 auto;
          }
        }
      }
      .input-container {
        display: flex;
        flex-flow: column nowrap;
      }
    }
  }

  .variable-title {
    text-align: left;
    font-size: 0.875em;
  }

  .variable-box {
    float: left;
    // width: 100%;
    --input-width: 7em;
    --bng-slider-margin: 0.25em;

    .property-slider {
      --input-height: 2em;
      align-items: center;
    }
  }
}
</style>
