<template>
  <LayoutSingle class="freeroam-configurator" v-bng-on-ui-nav:back,menu="goBack">
    <div class="configurator-content">
      <BngScreenHeadingV2 class="configurator-heading">
        Freeroam
        <template #preheadings>
          <BngBreadcrumbs
          :show-back-button="true"
          simple
          disable-last-item
          class="configurator-breadcrumbs"
          @back="goBack"
          @click="gotoHeaderItem"
          :items="[{ label: 'Menu', gotoAngularState: 'menu.mainmenu' }, { label: 'Freeroam Configurator'}]"
          />
        </template>
      </BngScreenHeadingV2>

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
      <div v-else class="configurator-sections" bng-nav-item v-bng-scoped-nav="{ canDeactivate: () => false, activateOnMount: true}" v-bng-on-ui-nav:back,menu="goBack">
        <!-- Three Column Layout -->
        <div class="three-column-layout">
          <!-- Left Column - Location -->
          <div class="config-section" v-bng-blur v-bng-on-ui-nav:ok.focusRequired="() => onSpawnPointTileClick()" bng-nav-item>
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
              <div class="selectable-component" @click="() => onSpawnPointTileClick()">
                <div v-if="configData?.currentSpawnPoint" class="clickable">
                  <GameplayDetails
                    :active-item="{levelName: configData.currentSpawnPoint.levelName, spawnPointObjectName: configData.currentSpawnPoint.spawnPointObjectName}"
                    :active-item-details="configData.currentSpawnPoint"
                    inline
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
          <div class="config-section" v-bng-blur v-bng-on-ui-nav:ok.focusRequired="() => onVehicleTileClick()" bng-nav-item>
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
              <div class="selectable-component" @click="() => onVehicleTileClick()">
                <div v-if="configData?.currentVehicle" class="clickable">
                  <VehicleDetails
                    :active-item="{model: configData.currentVehicle.model, config: configData.currentVehicle.config}"
                    :active-item-details="configData.currentVehicle"
                    hide-details-and-buttons
                    inline
                  />
                </div>
                <div v-else class="placeholder-content">
                  <BngIcon type="car" class="placeholder-icon" />
                  <p class="placeholder-text">Click to select vehicle</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column - Options -->
          <div class="config-section" v-bng-blur bng-nav-item v-bng-scoped-nav="{ type: SCOPED_NAV_TYPES.normal }">
            <BlurBackground />
            <div class="section-header">
              <BngCardHeading type="ribbon" class="section-title">Options</BngCardHeading>
            </div>
            <div class="section-content" :class="{ 'disabled': !canConfigureOptions }">
              <div v-if="hasOptions" class="options-scope">
                <div class="config-group" v-for="group in configData.options" :key="group.name">

                  <div class="section-header" v-if="group.name">
                    <BngCardHeading :outline="!isGroupEnabled(group)" type="ribbon" class="section-title">
                      <!-- Switch for boolean options -->
                      <BngSwitch
                        v-if="group.type === 'switch'"
                        class="group-switch"
                        v-model="config[group.key]"
                        @update:modelValue="(newValue) => handleOptionChange(group.key, newValue)"
                        :label="group.name"
                        labelBefore
                        inline
                        alwaysTransparent
                      />
                    </BngCardHeading>
                  </div>
                  <template v-if="isGroupEnabled(group)">
                    <div class="config-item" v-for="(option, optionIndex) in group.options" :key="option.key" :bng-scoped-nav-autofocus="optionIndex === 0">
                      <div class="option-row" :class="{ 'disabled': option.disabled }">
                        <label class="option-label">
                          <BngIcon v-if="option.icon" :type="option.icon" class="option-icon" />
                          {{ option.label }}
                        </label>

                        <!-- Select dropdown for all options -->
                        <BngSmartSelect
                          v-if="option.type === 'select'"
                          :modelValue="config[option.key]"
                          :items="option.options || []"
                          :threshold="80"
                          @update:modelValue="(newValue) => handleOptionChange(option.key, newValue)"
                        />

                        <!-- Switch for boolean options -->
                        <BngSwitch
                          v-else-if="option.type === 'switch'"
                          v-model="config[option.key]"
                          @update:modelValue="(newValue) => handleOptionChange(option.key, newValue)"
                          :label="option.label"
                          labelBefore
                        />

                        <!-- String input for text options -->
                        <BngInput
                          v-else-if="option.type === 'string'"
                          v-model="config[option.key]"
                          :placeholder="option.placeholder"
                          :char-max="option.maxLength"
                          @valueChanged="(newValue) => handleOptionChange(option.key, newValue)"
                        />

                        <!-- Number input for numeric options -->
                        <BngInput
                          v-else-if="option.type === 'number'"
                          v-model="config[option.key]"
                          type="number"
                          :num-min="option.min"
                          :num-max="option.max"
                          :num-step="option.step"
                          @valueChanged="(newValue) => handleOptionChange(option.key, newValue)"
                        />
                      </div>
                    </div>
                  </template>
                </div>
              </div>
              <div v-else class="placeholder-content">
                <BngIcon type="adjust" class="placeholder-icon" />
                <p class="placeholder-text">No options available</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Button - Full Width Below Columns -->
        <div class="action-button-container">
          <BlurBackground />
          <BngButton
            v-if="button"
            class="action-button"
            :accent="ACCENTS.custom"
            @click="() => handleButtonClick(button.meta.buttonId)"
            v-bng-blur
            bng-scoped-nav-autofocus
          >
            <div class="button-content">
              <BngIcon v-if="button.meta.icon" :type="button.meta.icon" class="button-icon" />
              {{ button.meta.label }}
            </div>
          </BngButton>
          <div v-else class="placeholder-content row">
            <BngIcon type="play" class="placeholder-icon" />
            <p class="placeholder-text">Select location and vehicle to start</p>
          </div>
        </div>
      </div>

    </div>
  </LayoutSingle>
</template>

<script setup>
import { onMounted, onUnmounted, onBeforeMount } from "vue"
import { LayoutSingle } from "@/common/layouts"
import { BngButton, BngSelect, BngSwitch, BngCardHeading, BngScreenHeadingV2, BngIcon, BngInput, BngBreadcrumbs, BngSmartSelect, ACCENTS } from "@/common/components/base"
import { vBngBlur, vBngOnUiNav, vBngScopedNav } from "@/common/directives"
import { SCOPED_NAV_TYPES } from "@/services/scopedNav"
import { useBridge } from "@/bridge"
import VehicleDetails from "@/modules/vehicleselect/components/VehicleDetails.vue"
import GameplayDetails from "@/modules/gameplaySelector/components/GameplayDetails.vue"
import BlurBackground from "@/common/modules/main-bg/components/BlurBackground.vue"
import useFreeroamConfigurator from "../composables/useFreeroamConfigurator"

const { lua } = useBridge()

// Use the composable
const {
  configData,
  config,
  button,
  error,
  hasOptions,
  hasSpawnPoint,
  hasVehicle,
  canConfigureOptions,
  initialize,
  onSpawnPointTileClick,
  onVehicleTileClick,
  handleOptionChange,
  handleButtonClick,
  gotoHeaderItem,
  goBack,
  isGroupEnabled
} = useFreeroamConfigurator()

onBeforeMount(() => {
  lua.simTimeAuthority.pushPauseRequest('freeroamConfigurator')
})

// Initialize on mount
onMounted(() => {
  initialize()
})

// Clean up on unmount
onUnmounted(() => {
  lua.simTimeAuthority.popPauseRequest('freeroamConfigurator')
})
</script>

<style scoped lang="scss">
@use "@/styles/modules/mixins" as *;

// ROOT COMPONENT
.freeroam-configurator {
  --safezone-top: 1rem;
  --safezone-bottom: 4.75em;
  --content-flow: column nowrap;
  --content-max-width: unset;
  pointer-events: none;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: visible;
  align-self: center;

  > * {
    pointer-events: auto;
    gap: 0.25em;
    overflow: visible;
  }
}

// MAIN CONTENT CONTAINER
.configurator-content {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 50rem;
  max-width: 80rem;
  align-self: center;
}

// HEADER SECTION
.configurator-heading {
  position: relative;
  margin-top: 0;
  margin-bottom: 1rem;

  .configurator-breadcrumbs {
    --background-color: var(--bng-black-o6);
    --bng-breadcrumbs-enabled-opacity: 0.01;
    align-self: flex-start;
    align-items: center;
  }
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
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  gap: 1rem;
  overflow: visible;
}

// THREE COLUMN LAYOUT
.three-column-layout {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  flex: 1 1 auto;
  gap: 1rem;
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
  flex: 0 1 30em;
  min-width: 25em;
  --font-size: 1rem;
  @include modify-focus(0.5rem, 0.25rem);

  &:focus-within {
    box-shadow: inset 0 0 5rem rgba(var(--bng-orange-400-rgb), 0.33);
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

// SELECTABLE COMPONENTS
.selectable-component {
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  cursor: pointer;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  &:hover {
    background-color: rgba(var(--bng-orange-400-rgb), 0.1);
  }
}

// OPTIONS CONFIGURATION
.options-scope {
  &[data-scoped-nav-activated="true"] {
    .option-row {
      background-color: rgba(var(--bng-orange-400-rgb), 0.1);
      border-radius: 0.25rem;
    }
  }
}


.config-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  @include modify-focus(0.25rem, 0.125rem);
}

.option-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 0 0.25rem;

  > * {
    flex: 1 0 50%;
  }

  .option-select {
    :deep(.bng-button) {
      margin: 0;
      padding: 0;
    }
  }

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}

.option-label {
  font-size: 1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex-shrink: 0;
  flex-basis: 40%;
  margin-left: 0.25rem;

  .option-icon {
    font-size: 1.5rem;
  }
}

.group-switch {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
  width: 100%;
  overflow: visible;

  :deep(.bng-switch-label) {
    justify-content: flex-start;
  }
}

// ACTION BUTTON
.action-button-container {
  position: relative;
  width: 100%;
  background-color: var(--bng-black-o4);
  border-radius: var(--bng-corners-2);
}

.action-button {
  margin: 0 !important;
  padding: 1.5rem 2rem;
  font-size: 1.5rem;
  font-weight: bold;
  align-items: center;
  text-transform: uppercase;
  width: 100% !important;
  max-width: 100% !important;
  border-radius: var(--bng-corners-2);
  --bng-button-custom-hover: var(--bng-orange-400);
  --bng-button-custom-hover-opacity: 0.1;
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

  .button-icon {
    font-size: 2.5rem;
  }
}

// PLACEHOLDER CONTENT
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

.placeholder-icon {
  font-size: 3rem;
  color: rgba(255, 255, 255, 0.4);
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
</style>
