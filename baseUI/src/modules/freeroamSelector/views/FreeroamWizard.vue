<template>
  <LayoutSingle class="freeroam-configurator">
    <div
      class="configurator-content"
      :class="{ 'options-step': step === 'options' }"
      v-bng-scoped-nav="{
        scopeId: WIZARD_SCOPE_ID,
        canDeactivate: () => false,
        activateOnMount: true,
        bubbleBlacklistEvents: ['back', 'menu']
      }"
      v-bng-click.controller="{ holdCallback: () => onStartButtonClick(button?.meta?.buttonId), holdDelay: 2000, repeatInterval: 0 }"
      v-bng-on-ui-nav:ok.asMouse
    >
      <div class="configurator-heading">
        <BngBreadcrumbs
          v-bng-blur
          class="configurator-breadcrumbs"
          simple
          show-back-button
          disable-last-item
          @back="goBack"
          @click="gotoHeaderItem"
          limit="15"
          :items="breadcrumbItems"/>
      </div>

      <div class="configurator-body">

        <div class="grid-section" v-if="step !== 'options' && gridSelectorProps">
          <GridSelector
            ref="gridSelectorRef"
            :key="`grid-selector-${step}`"
            :backend-name="gridSelectorProps.backendName"
            :route-path="gridSelectorProps.routePath"
            :default-path="gridSelectorProps.defaultPath"
            :default-details-mode="gridSelectorProps.defaultDetailsMode"
            :hidden-tabs="gridSelectorProps.hiddenTabs"
            no-breadcrumbs
            :select-callback="onSelectCallback"
            :double-click-override="doubleClickOverride"
            :override-back-from-grid="goBack"
            inline-header-container
            :bubble-events="['ok']"
          >
            <template #item-details="{ activeItem, activeItemDetails, executeButton, toggleFavourite, exploreFolder, goToMod }">
              <GameplayDetails
                v-if="step === 'level'"
                :activeItem="activeItem"
                :activeItemDetails="activeItemDetails"
                :toggleFavourite="toggleFavourite"
                :exploreFolder="exploreFolder"
                :goToMod="goToMod"
                :buttonOverride="{icon: 'fastTravel', label: 'Next Step', click: (...args) => overrideSelectItem('level', ...args)}"
                :showHeaderTitle="true"
              />
              <VehicleDetails
                v-if="step === 'vehicle'"
                :activeItem="activeItem"
                :activeItemDetails="activeItemDetails"
                :toggleFavourite="toggleFavourite"
                :exploreFolder="exploreFolder"
                :goToMod="goToMod"
                :buttonOverride="{icon: 'fastTravel', label: 'Next Step', click: (...args) => overrideSelectItem('vehicle', ...args)}"
                :showHeaderTitle="true"
              />
            </template>
          </GridSelector>
        </div>

        <!-- Options Panel (replaces grid when step === 'options') -->
        <div class="option-summary-panel" v-if="step === 'options' && configData">
          <!-- Left Column - Location -->
          <div class="config-section selectable-component" v-bng-blur @click="onSpawnPointTileClick">
            <BlurBackground />
            <div class="section-header">
              <BngCardHeading type="ribbon" class="section-title">
                <span class="section-title-label">Location:</span>
                <span class="section-title-value">
                  {{ configData?.currentSpawnPoint?.headerTitle || 'Select location...' }}
                </span>
              </BngCardHeading>
            </div>
            <div class="section-content">
              <!-- Spawn Point Details -->
              <div>
                <div v-if="configData?.currentSpawnPoint" class="clickable">
                  <GameplayDetails
                    :active-item="{levelName: configData.currentSpawnPoint.levelName, spawnPointObjectName: configData.currentSpawnPoint.spawnPointObjectName}"
                    :active-item-details="configData.currentSpawnPoint"
                    inline
                    :show-header-title="false"
                  />
                </div>
                <div v-else class="placeholder-content">
                  <BngIcon type="road" class="placeholder-icon" />
                  <p class="placeholder-text">Click to select location</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Middle Column - Vehicle -->
          <div class="config-section selectable-component" v-bng-blur @click="onVehicleTileClick">
            <BlurBackground />
            <div class="section-header">
              <BngCardHeading type="ribbon" class="section-title">
                <span class="section-title-label">Vehicle:</span>
                <span class="section-title-value">
                  {{ configData?.currentVehicle?.headerTitle || 'Select vehicle...' }}
                </span>
              </BngCardHeading>
            </div>
            <div class="section-content">
              <!-- Vehicle Details -->
              <div>
                <div v-if="configData?.currentVehicle" class="clickable">
                  <VehicleDetails
                    :active-item="{model: configData.currentVehicle.model, config: configData.currentVehicle.config}"
                    :active-item-details="configData.currentVehicle"
                    hide-details-and-buttons
                    inline
                    :show-header-title="false"
                  />
                </div>
                <div v-else class="placeholder-content">
                  <BngIcon type="car" class="placeholder-icon" />
                  <p class="placeholder-text">Click to select vehicle</p>
                </div>
              </div>
            </div>
          </div>

          <OptionsPanel
            v-bng-on-ui-nav:back="goBack"
            v-bng-on-ui-nav:menu="goBack"
            class="config-section"
            :options="configData?.options || []"
            :has-options="hasOptions"
            :can-configure-options="canConfigureOptions"
          >
            <!--
            <template #buttons>
            <div class="action-button-container" v-bng-blur>
              <BlurBackground />
              <BngButton
                v-if="button"
                class="action-button"
                :accent="ACCENTS.custom"
                @click="() => handleButtonClick(button.meta.buttonId)"
                bng-scoped-nav-autofocus
              >
                <div class="button-content">
                  {{ button.meta.label }}
                </div>
              </BngButton>
              <div v-else class="placeholder-content row">
                <p class="placeholder-text">Select location and vehicle to start</p>
              </div>
            </div>
            </template>
          -->
          </OptionsPanel>
        </div>
      </div>

      <div class="configurator-heading">

        <!-- Error State -->
        <div v-if="error" class="error-state">
          <BlurBackground />
          <div class="error-content">
            <BngIcon type="warning" class="error-icon" />
            <p>Failed to load configuration</p>
            <BngButton @click="initialize" :accent="ACCENTS.secondary">Retry</BngButton>
          </div>
        </div>

        <!-- Main Content - Always show layout -->
        <div v-else class="configurator-sections">
          <!-- Back Button -->
          <!-- <BngButton class="configurator-button" v-bng-blur @click="goBack" :accent="ACCENTS.custom">
            <span class="back">
              <BngIcon :type="'arrowLargeLeft'" class="back-icon" />
              <span class="back-text">
                Back
              </span>
            </span>
          </BngButton> -->
          <div class="steps-container" v-bng-blur>
            <div class="background-bar">
              <BlurBackground />
            </div>
            <!-- Location -->
            <WizardStepButton
              first
              :active="step === 'level'"
              :completed="stepCompleted.level"
              title="Location"
              :tooltip="configData?.currentSpawnPoint?.headerTitle"
              :preview="configData?.currentSpawnPoint?.preview"
              icon="road"
              @activate="onSpawnPointTileClick"
            />

            <!-- Vehicle -->
            <WizardStepButton
              :active="step === 'vehicle'"
              :completed="stepCompleted.vehicle"
              title="Vehicle"
              :tooltip="configData?.currentVehicle?.headerTitle"
              :preview="configData?.currentVehicle?.preview"
              icon="car"
              :show-paint-tile="!!vehiclePaintData"
              :paint-id="`${configData?.currentVehicle?.key || 'vehicle'}:${vehiclePaintData?.paint}`"
              :paints="vehiclePaintData?.paints || []"
              :paint-name="vehiclePaintData ? vehiclePaintData.paintNames.join(', ') : ''"
              @activate="onVehicleTileClick"
            />

            <!-- Options -->
            <WizardStepButton
              :active="step === 'options'"
              :completed="stepCompleted.options"
              title="Options"
              tooltip="Options"
              icon="adjust"
              @activate="onOptionsTileClick"
            />
          </div>

          <!-- Wizard Play Button -->
          <div
            class="play-button"
            @click="onStartButtonClick(button?.meta?.buttonId)"
            v-bng-on-ui-nav:ok.asMouse
            bng-nav-item tabindex="1"
            v-bng-sound-class="'bng_click_hover_generic'"
          >
            <div class="background"></div>
            <div class="label">
              <div v-show="holdBindingRef?.displayed" class="hold-binding">
                <BngBinding ref="holdBindingRef" class="binding" ui-event="ok" controller />
                <svg class="hold-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 12" preserveAspectRatio="xMidYMid">
                  <path d="M1,1 L8,2 L16,1 L8,11 z" />
                </svg>
              </div>
              {{ button?.meta?.label || 'Start' }}
            </div>
          </div>

        </div>

      </div>

    </div>
  </LayoutSingle>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, onBeforeMount } from "vue"
import { storeToRefs } from "pinia"
import { LayoutSingle } from "@/common/layouts"
import { BngButton, BngSelect, BngSwitch, BngScreenHeadingV2, BngIcon, BngInput, BngBreadcrumbs, BngSmartSelect, BngPaintTile, BngCardHeading, BngBinding, ACCENTS } from "@/common/components/base"
import { vBngBlur, vBngOnUiNav, vBngScopedNav, vBngUiNavLabel, vBngTooltip, vBngClick, vBngSoundClass } from "@/common/directives"
import { SCOPED_NAV_TYPES } from "@/services/scopedNav"
import { useBridge } from "@/bridge"
import BlurBackground from "@/common/modules/main-bg/components/BlurBackground.vue"
import useFreeroamConfigurator from "../composables/useFreeroamConfigurator"
import Paint from "@/utils/paint"
import GridSelector from "@/common/modules/gridSelector/GridSelector.vue"
import GameplayDetails from "@/modules/gameplaySelector/components/GameplayDetails.vue"
import VehicleDetails from "@/modules/vehicleselect/components/VehicleDetails.vue"
import OptionsPanel from "../components/OptionsPanel.vue"
import WizardStepButton from "../components/wizardStepButton.vue"
import { AspectRatio } from "@/common/components/utility"
import { useRouter } from "vue-router"
import { useScopedNav } from "@/services/scopedNav"
import { startLoading } from "@/services"
import { waitForLoadingScreenFadeIn } from "@/services/screenCover"
import logger from "@/services/logger"

const { lua, events } = useBridge()
const router = useRouter()
const scopedNav = useScopedNav()

const WIZARD_SCOPE_ID = 'freeroam-wizard'

const steps = {
  level: {
    title: "Location",
    backendName: "freeroamSelector",
    path: "/freeroam-wizard/level",
    defaultPath: { keys: ["allFreeroam"] },
    defaultDetailsMode: "detail",
    hiddenTabs: ["filter", "advanced"]
  },
  vehicle: {
    title: "Vehicle",
    backendName: "vehicleSelector",
    path: "/freeroam-wizard/vehicle",
    defaultPath: { keys: ["allModels"] },
    defaultDetailsMode: "detail",
    hiddenTabs: ["advanced"]
  },
  options: {
    title: "Options",
    path: "/freeroam-wizard/options"
  }
}

const stepCompleted = computed(() => {
  return {
    level: props.step === "vehicle" || props.step === "options" ,
    vehicle: props.step === "options",
    options: false,
  }
})
const gridSelectorProps = computed(() => {
  const stepConfig = steps[props.step]
  if (stepConfig && stepConfig.backendName && stepConfig.path) {
    return {
      backendName: stepConfig.backendName,
      routePath: stepConfig.path,
      defaultPath: stepConfig.defaultPath || { keys: [] },
      defaultDetailsMode: stepConfig.defaultDetailsMode || "detail",
      hiddenTabs: stepConfig.hiddenTabs || []
    }
  }
  return null
})

const props = defineProps({
  step: {
    type: String,
    default: ""
  },
  pathMatch: {
    type: [String, Array],
    default: ""
  },
  itemDetails: {
    type: [String, Array],
    default: ""
  }
})

const gridSelectorRef = ref(null)
const holdBindingRef = ref(null)
const isLoading = ref(false)

// Breadcrumb items based on current step
const breadcrumbItems = computed(() => {

  // Fallback to default breadcrumb items
  const items = [
    { label: "Menu", gotoAngularState: "menu.mainmenu" },
    { label: "Freeroam Configurator", dividerType: "arrowSmallRight" }
  ]

  // Add current step
  if (props.step === "level") {
    items.push({ label: "Location", click: () => {
      onSpawnPointTileClick(true)
    }})
  } else if (props.step === "vehicle") {
    items.push({ label: "Vehicle", click: () => {
      onVehicleTileClick(true)
    }})
  } else if (props.step === "options") {
    items.push({ label: "Options", click: onOptionsTileClick })
  }
  // If GridSelector is available and has screenHeaderPath, append item 3 to the current items
  const screenHeaderPath = gridSelectorRef.value?.screenHeaderPath
  const pathValue = screenHeaderPath?.value || screenHeaderPath
  if (pathValue && Array.isArray(pathValue) && pathValue.length > 2) {
    if (pathValue.length > 3) {
      // if theres 3 items, item 2 is the filter/seach item
      items.push({label: pathValue[2].label, click: () => {
        gridSelectorRef.value.setCurrentPath({ keys: pathValue[2].gotoPath })
        onSpawnPointTileClick()
      }})
      items.push(pathValue[3])
    } else {
      items.push(pathValue[2])
    }
  }

  return items
})

// Use the composable
const {
  configData,
  button,
  error,
  hasOptions,
  hasSpawnPoint,
  hasVehicle,
  canConfigureOptions,
  initialize,
  handleButtonClick,
  selectSpawnPoint,
  selectVehicle,
  gotoHeaderItem,
  loadConfiguration,
} = useFreeroamConfigurator()

watch(() => props.step, step => {
  // this helps to update the options depending on the selected level/vehicle
  if (step === "options") {
    loadConfiguration()
    // Reactivate the wizard scope when showing options panel
    scopedNav.resumeScope(WIZARD_SCOPE_ID)
  }
})

const canBubbleOptionsEvent = event => {
  if (["back", "menu"].includes(event.detail.name)) return false
  // if (event.detail.name === "ok") return true
  return true
}

const overrideSelectItem = async (step, ...args) => {
  if (props.step === "level") {
    const item = args[0]
    if (!item?.showDetails?.levelName) {
      logger.error("overrideSelectItem: Invalid item data for level selection")
      return null
    }

    const success = await selectSpawnPoint(
      item.showDetails.levelName,
      item.showDetails.spawnPointObjectName,
      item.key
    )

    if (success) {
      router.push(steps.vehicle.path)
    }
  } else if (props.step === "vehicle") {
    const item = args[0]
    if (!item?.showDetails?.model || !item?.showDetails?.config) {
      logger.error("overrideSelectItem: Invalid item data for vehicle selection")
      return null
    }

    const selectedPaint = args[1]
    const selectedMultiPaint = args[2]

    const additionalData = {}
    if (selectedMultiPaint?.paintNames) {
      additionalData.paint = selectedMultiPaint.paintNames[0]
      additionalData.paint2 = selectedMultiPaint.paintNames[1]
      additionalData.paint3 = selectedMultiPaint.paintNames[2]
    } else if (selectedPaint?.name) {
      additionalData.paint = selectedPaint.name
    }

    const success = await selectVehicle(
      item.showDetails.model,
      item.showDetails.config,
      additionalData,
      item.key
    )

    if (success) {
      router.push(steps.options.path)
    }
  }
  return null
}

const onSelectCallback = async (item, doNavigation) => {
  if(doNavigation) {
    if(props.step === "level") {
      if (!item?.doubleClickDetails?.levelName) {
      logger.error("overrideSelectItem: Invalid item data for level selection")
      return null
    }

    const success = await selectSpawnPoint(
      item.doubleClickDetails.levelName,
      item.doubleClickDetails.spawnPointObjectName,
      item.key
    )
      //return true
    } else if(props.step === "vehicle") {
      if (!item?.doubleClickDetails?.model || !item?.doubleClickDetails?.config) {
        logger.error("overrideSelectItem: Invalid item data for vehicle selection")
        return null
      }

      const success = await selectVehicle(
        item.doubleClickDetails.model,
        item.doubleClickDetails.config,
        {},
        item.key
      )
      //return true
    }
  }
  return null
}

const doubleClickOverride = async (item) => {
  if (!item?.doubleClickDetails) {
    logger.error("doubleClickOverride: Invalid item data")
    return
  }

  const details = item.doubleClickDetails

  if (details.levelName) {
    const success = await selectSpawnPoint(
      details.levelName,
      details.spawnPointObjectName,
      item.key
    )

    if (success) {
      router.push(steps.vehicle.path)
    }
  } else if (details.model && details.config) {
    const success = await selectVehicle(
      details.model,
      details.config,
      {},
      item.key
    )

    if (success) {
      router.push(steps.options.path)
    }
  }
}

const goBack = () => {
  logger.debug("goBack called")
  let gridSelectorPath = gridSelectorRef.value?.screenHeaderPath
  if(props.step === "level") {
    // if grid selector path is available, go back to the previous step
    if (gridSelectorPath && gridSelectorPath.length > 2) {
      onSpawnPointTileClick()
    } else {
      // back to menu
      window.bngVue.gotoAngularState("menu.mainmenu")
    }
  } else if(props.step === "vehicle") {
    if (gridSelectorPath && gridSelectorPath.length > 2) {
      onVehicleTileClick()
    } else {
      // back to level step
      onSpawnPointTileClick()
    }
  } else if(props.step === "options") {
      // back to vehicle step
      onVehicleTileClick()
  }
}
/**
const goBackFromWizard = () => {
  if(props.step === "level") {
    goBack()
  } else if(props.step === "options") {
    router.replace(steps.vehicle.path)
  }
  return false
}

const overrideBackFromGrid = () => {
  if(props.step === "level") {
    goBack()
  } else if(props.step === "vehicle") {
    router.replace(steps.level.path)
  } else if(props.step === "options") {

  }
}
  **/

const onSpawnPointTileClick = async () => {
  router.replace(steps.level.path)
}

const onVehicleTileClick = async (clearSearch = false) => {
  if (clearSearch && gridSelectorRef.value) {
    gridSelectorRef.value.clearSearch()
    gridSelectorRef.value.clearFilters()
  }
  router.replace(steps.vehicle.path)
}

const onOptionsTileClick = async () => {
  router.replace(steps.options.path)
}

const onStartButtonClick = async (buttonId) => {
  isLoading.value = true
  events.emit("LoadingScreen", { active: true })
  await startLoading(async () => {
    await waitForLoadingScreenFadeIn()
    await handleButtonClick(buttonId)
  })
}

// Helper function to convert factory paint to BngPaintTile format
function convertPaintToTileFormat(paint) {
  if (!paint) return null

  // If paint already has the expected format, return as is
  if (paint.baseColor && paint.paintString) {
    return paint
  }

  // Convert to Paint object if needed
  try {
    const paintObj = new Paint()
    paintObj.paint = paint
    return paintObj.paintObject
  } catch (error) {
    console.warn("Failed to convert paint:", paint, error)
    return null
  }
}

// Get paint data for vehicle preview
const vehiclePaintData = computed(() => {
  const vehicle = configData.value?.currentVehicle
  if (!vehicle?.additionalData?.paint || !vehicle?.paints?.factoryPaints) {
    return null
  }

  const additionalData = vehicle.additionalData
  const factoryPaints = vehicle.paints.factoryPaints

  const paintNames = [
    additionalData.paint,
    additionalData.paint2,
    additionalData.paint3
  ].filter(name => name) // Remove undefined/null values

  const paints = paintNames
    .map(name => {
      const paint = factoryPaints.find(p => p.name === name)
      return paint ? convertPaintToTileFormat(paint) : null
    })
    .filter(paint => paint !== null)

  if (paints.length === 0) return null

  return {
    paint: paintNames[0], // Primary paint name
    paintNames: paintNames,
    paints: paints
  }
})

onBeforeMount(() => {
  lua.simTimeAuthority.pushPauseRequest("freeroamConfigurator")
})

// Initialize on mount
onMounted(() => {
  initialize()
})

// Clean up on unmount
onUnmounted(() => {
  lua.simTimeAuthority.popPauseRequest("freeroamConfigurator")
})
</script>

<style scoped lang="scss">
@use "@/styles/modules/mixins" as *;

// ROOT COMPONENT
.freeroam-configurator {
  --safezone-top: 1rem;
  --safezone-bottom: 4.75em;
  pointer-events: none;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: visible;
  width: 100%;
  height: calc(100% - 1rem - 4.75em);
  justify-content: center;
  > * {
    pointer-events: auto;
    gap: 0.25em;
    overflow: visible;
    justify-content: center;
  }
}

// MAIN CONTENT CONTAINER
.configurator-content {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 0.5rem;
  &.options-step {
    max-width: calc(3*30rem + 1rem);
    align-items: stretch;
    justify-self: center;
  }
}

// HEADER SECTION
.configurator-heading {
  position: relative;
  margin-top: 0;
  flex-direction: row;
  display: flex;
  .configurator-breadcrumbs {
    --background-color: var(--bng-black-o6);
    --bng-breadcrumbs-enabled-opacity: 0.01;
    align-self: flex-start;
    align-items: center;
  }
}

.configurator-body {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: visible;
}

.grid-section {
  position: relative;
  display: flex;
  flex-direction: row;
  flex: 1;
  overflow: visible;

  :deep(.grid-selector) {
    padding: 0;
    --safezone-top: 0;
    --safezone-bottom: 0;
    --content-flow: column nowrap;
    --content-max-width: unset;
    //margin-top: -2.9rem;
    .layout-content {
      gap: 0;
    }
  }
}

.option-summary-panel {
  position: relative;
  display: flex;
  flex-direction: row;
  flex: 1 1 auto;
  width: 100%;
  overflow: visible;
  align-self: center;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}


// ERROR STATE
.error-state {
  position: relative;
  background-color: var(--bng-black-o4);
  border-radius: var(--bng-corners-2);
  min-height: 20rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: white;
  text-align: center;
}

.error-icon {
  font-size: 3rem;
  color: var(--bng-add-red-400);
}

// MAIN CONFIGURATION SECTIONS
.configurator-sections {
  z-index: 2;
  position: relative;
  display: flex;
  flex-direction: row;
  flex: 1 1 auto;
  overflow: visible;
  gap: 0;
  min-width: 100%;

  .steps-container {
    display: flex;
    flex: 1;
    flex-direction: row;
    overflow: visible;
    justify-content: flex-start;
    position: relative;
    .background-bar {
      --bar-bg: var(--bng-off-black);
      --bar-bg-rgb: var(--bng-off-black-rgb);
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      inset: 0;
      border-radius: var(--bng-corners-2) 0 0 var(--bng-corners-2);
      clip-path: polygon(
        0% 0%,
        calc(100% - 0.5em) 0%,
        100% 50%,
        calc(100% - 0.5em) 100%,
        0% 100%
      );
      overflow: hidden;
      pointer-events: none;
      z-index: 0;
      &::before {
        content: "";
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--bng-off-black);
        opacity: 0.8;
      }
    }
  }

  .play-button {
    $hold-grad: #fffd 50%, transparent 50%;
    $hold-fill: #ddd3 0%, #eee7 45%, #fffa 50%, transparent 50%;

    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    width: auto;
    min-width: 28em;
    margin-left: 0.1em;
    font-family: "Overpass", var(--fnt-defs);
    font-weight: 800;
    font-style: italic;
    isolation: isolate;
    pointer-events: auto;
    cursor: pointer;

    --play-color: var(--bng-orange-700);
    --play-bg: var(--bng-orange-500);
    --play-bg-opacity: 1;

    &:hover {
      --play-color: var(--bng-orange-600);
      --play-bg: var(--bng-orange-400);
      --play-bg-opacity: 1;
    }

    .label {
      font-size: 1.75em;
      color: var(--bng-off-white);
      z-index: 1;
    }
    .hold-binding {
      position: relative;
      display: inline-block;
      font-size: 0.8em;
      .hold-arrow {
        position: absolute;
        top: -0.3em;
        left: 0;
        width: 100%;
        height: 0.6em;
        transition: top 150ms;
        pointer-events: none;
        z-index: 1;
        path {
          fill: var(--bng-orange-100);
          stroke: var(--play-bg);
          stroke-width: 1px;
        }
      }
    }

    .background {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      opacity: var(--play-bg-opacity, 1);
      pointer-events: none;
      z-index: 0;
      &::before { /* dark bg block */
        content: "";
        position: absolute;
        display: block;
        top: 0.5em;
        left: calc(100% - 2.5em);
        right: 0.5em;
        bottom: 0.5em;
        background-color: var(--bng-orange-900);
        opacity: 0.65;
      }
      &::after { /* button shape */
        content: "";
        position: absolute;
        display: block;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--play-bg);
        background-image: linear-gradient(90deg, $hold-fill);
        clip-path: polygon(
          /* first shape top (CW) */
          0.5em 50%,
          0% 0%,
          calc(100% - 2.5em) 0%,
          calc(100% - 2em) 50%,

          /* second shape top */
          calc(100% - 1.25em) 50%,
          calc(100% - 1.75em) 0%,
          calc(100% - 1.25em) 0%,
          calc(100% - 0.75em) 50%,

          /* third shape top */
          calc(100% - 0.5em) 50%,
          calc(100% - 1.0em) 0%,
          calc(100% - 0.5em) 0%,

          /* mirror point, switching to CCW */
          100% 50%,

          /* third shape bottom */
          calc(100% - 0.5em) 100%,
          calc(100% - 1.0em) 100%,
          calc(100% - 0.5em) 50%,

          /* second shape bottom */
          calc(100% - 0.75em) 50%,
          calc(100% - 1.25em) 100%,
          calc(100% - 1.75em) 100%,
          calc(100% - 1.25em) 50%,

          /* first shape bottom */
          calc(100% - 2em) 50%,
          calc(100% - 2.5em) 100%,
          0% 100%
        );
      }
    }

    &.focus-visible::before { /* focus-frame override */
      $off: 4px;
      $size: 2px;
      top: -$off !important;
      bottom: -$off !important;
      left: -$off !important;
      right: -$off !important;
      border: none !important;
      border-radius: 0 !important;
      background-color: var(--bng-orange-b400);
      background-image: linear-gradient(90deg, $hold-grad);
      background-repeat: no-repeat;
      clip-path: polygon(
        /* outer (CW) */
        0.5em 50%,
        0% 0%,
        calc(100% - 0.5em) 0%,
        100% 50%,
        calc(100% - 0.5em) 100%,
        0% 100%,
        0.5em 50%,

        /* inner (CCW) */
        calc(0.5em + $size) 50%,
        $size calc(100% - $size),
        calc(100% - 0.5em - $size) calc(100% - $size),
        calc(100% - $size) 50%,
        calc(100% - 0.5em - $size) $size,
        $size $size,
        calc(0.5em + $size) 50%
      );
    }

    .background::before {
      transition: background-color 300ms;
    }

    .background::after,
    &.focus-visible::before {
      background-size: 200% 100%;
      background-position: 100% 50%;
      transition: background-position-x 300ms;
    }
  }
}
.configurator-content {
  &.hold-start .play-button {
    .background::after,
    &.focus-visible::before {
      background-position-x: 90%; // comment this out to disable pre-roll position
      transition-duration: 0s;
    }
    .hold-arrow {
      top: -0.15em;
    }
  }

  &.hold-active .play-button {
    .background::before {
      background-color: var(--bng-orange-200);
      transition-delay: calc(var(--hold-time, 1s) * 0.65);
    }
    .background::after,
    &.focus-visible::before {
      background-position-x: 0%;
      transition: background-position-x var(--hold-time, 1s);
    }
  }
}

.configurator-button {
  position: relative;
  padding: 0;
  background-color: var(--bng-black-o6);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 12rem;
  margin: 0 !important;
  border-radius: var(--bng-corners-2);
  --bng-button-custom-hover: var(--bng-orange-400);
  --bng-button-custom-hover-opacity: 0.5;
  .back {
    font-size: 1.5rem;
    color: rgba(255, 255, 255, 0.8);
    gap: 0.0rem;
    margin-left: -0.5rem;
    align-items: center;
    display: flex;
    .back-icon {
      font-size: 2.5rem;
      color: rgba(255, 255, 255, 0.8);
      margin-right: 0.5rem;
    }
  }
  .center-icon {
    font-size: 3.5rem;
    color: rgba(255, 255, 255, 0.8);
    gap: 0.0rem;
    margin-left: -0.5rem;
  }
  &.start-button {
    //--bng-button-custom-border-enabled: var(--bng-orange-500);
    --bng-button-custom-border-hover: var(--bng-orange-200);
    --bng-button-custom-border-radius: var(--bng-corners-2);
    box-shadow: inset 0 0 1rem rgba(var(--bng-orange-300-rgb), 1);
    width: auto;
    min-width: 30rem;
    padding-right: 1rem;
    gap: 1rem;
    text-shadow: 0 0 1rem rgba(var(--bng-orange-300-rgb), 0.5);
    .label {
      font-size: 1.5rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1rem;
      color: rgba(255, 255, 255, 0.8);
      gap: 0.0rem;
      margin-left: -0.5rem;
      align-items: center;
      display: flex;
    }
  }
}

.step-tab-separator {
  flex: 1;
  content: "";
}

.thumbnail-icon {
  width: 9em;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bng-cool-gray-800);

  .options-icon {
    font-size: 3.5rem;
    color: rgba(255, 255, 255, 0.8);
  }
}


// ACTION BUTTON
.action-button-container {
  position: relative;
  background-color: var(--bng-black-o4);
  border-radius: var(--bng-corners-2);
}

.action-button {
  margin: 0 !important;
  padding: 1.5rem 2rem;
  height: 5.5rem;
  font-size: 1.5rem;
  font-weight: bold;
  align-items: center;
  text-transform: uppercase;
  width: 100% !important;
  max-width: 100% !important;
  border-radius: var(--bng-corners-2);
  --bng-button-custom-hover: var(--bng-orange-400);
  --bng-button-custom-hover-opacity: 0.5;
  text-shadow: 0 0 1rem rgba(var(--bng-orange-700-rgb), 0.5);
  transition: font-size 0.1s ease-in-out;

  &:hover, &:focus {
    text-shadow: 0 0 1.5rem rgba(var(--bng-orange-600-rgb), 2);
    font-size: 1.6rem;
  }

  &:focus-within {
    box-shadow: inset 0 0 5rem rgba(var(--bng-orange-400-rgb), 0.33);
  }

  .button-content {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    letter-spacing: 0.05rem;
  }

}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  gap: 1rem;

  &.row {
    flex-direction: row;
  }
}

.placeholder-text {
  font-size: 1rem;
  font-style: italic;
  margin: 0;
}

// UTILITY CLASSES
.loading-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 10rem;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
  background-color: var(--bng-black-o4);
  border-radius: var(--bng-corners-2);
}


// CONFIGURATION SECTIONS (Location, Vehicle, Options)
.config-section {
  position: relative;
  background-color: var(--bng-black-o4);
  border-radius: var(--bng-corners-2);
  overflow: visible;
  display: flex;
  flex-direction: column;
  height: 100%;
  color: white;
  flex: 1 1 30em;
  min-width: 25em;
  --font-size: 1rem;
  @include modify-focus(0.5rem, 0.25rem);

  // &:focus-within,
  &.selectable-component:hover {
    box-shadow: inset 0 0 5rem rgba(var(--bng-orange-400-rgb), 0.33);
  }

  &.selectable-component {
    cursor: pointer;
  }
}

.section-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  overflow: hidden;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background-color: var(--bng-black-o2);

  .section-title {
    color: white;
    margin-bottom: 0;
    padding-bottom: 0.5rem;
    margin-top: 0.5rem;
    margin-left: -0.5rem;
    margin-right: -0.5rem;
    width: 100%;
    overflow: visible;

    .section-title-label {
      margin-right: 0.5rem;
    }

    .section-title-value {
      font-weight: 600;
    }
  }
}

.section-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

}

</style>
