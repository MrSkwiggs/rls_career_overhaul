<template>
  <div class="settings-container">
    <div class="settings-wrapper">
      <div v-if="!hasAnySettings" class="centered">Nothing to change here!</div>

      <!-- Mission Settings -->
      <SlotSwitcher v-for="(setting, index) in missionSettings" :slotId="setting.type" :key="setting.key + selectedMission.id">
        <template #select>
          <div class="setting-item" :class="{ 'vehicle-setting': setting.currentOption?.thumb }">
            <AspectRatio
            v-if="setting.currentOption?.thumb"
            class="image"
            :style="{
                backgroundImage: 'url(' + encodeURI(setting.currentOption.thumb) + ')',
              }">
            </AspectRatio>
            <div class="setting-row">
              <div class="setting-item-label" :class="{ 'disabled-text': setting.disabled }">
                {{ $t(setting.label) }}
                <BngIcon v-if="setting.disabled" :type="icons.lockClosed" color="var(--bng-cool-gray-400)" class="locked-icon" />
                <!-- <BngIcon :type="icons.wrench" color="gray" v-if="setting.value !== setting.defaultValue" class="modified-icon"/> -->
              </div>
              <BngSelect
              :bng-scoped-nav-autofocus="index === 0"
              class="setting-control"
              :options="setting.values"
              :value="setting.value"
              :config="{ label: x => $t(x.l), value: x => x.v }"
              @valueChanged="(a, b, c) => changeSelectValue(a, b, c, setting)"
              :loop="true"
              :disabled="setting.disabled" />
            </div>
            <!--
            <div v-if="setting.allowCustom" class="setting-row-button">
              <BngButton @click="pickVehicle(setting)">
                Select custom vehicle...
              </BngButton>
            </div>
            -->
          </div>
        </template>

        <template #int>
          <div class="setting-item">
            <div class="setting-row">
              <div class="setting-item-label" :class="{ 'disabled-text': setting.disabled }">
                {{ $t(setting.label) }}
                <BngIcon v-if="setting.disabled" :type="icons.lockClosed" color="var(--bng-cool-gray-400)" class="locked-icon" />
                <!-- <BngIcon :type="icons.wrench" color="gray" v-if="setting.value !== setting.defaultValue" class="modified-icon"/> -->
              </div>
              <div v-bng-scoped-nav class="input-wrapper" v-bng-on-ui-nav-focus:vertical.repeat="dir => changeNumSettingValue(setting, dir)">
                <BngInput
                  class="input"
                  :modelValue="setting.value"
                  :value="setting.value"
                  :min="setting.min"
                  :max="setting.max"
                  :disabled="setting.disabled"
                  type="number"
                  @valueChanged="value => store.changeSettings(setting.key, value)" />
              </div>
            </div>
          </div>
        </template>
        <!--
        <template #hidden>
          <div class="setting-item">
            <div class="setting-row">
              <div class="setting-item-label">
                ({{ $t(setting.label) }})
              </div>
              <div class="setting-control">
                {{ setting.value }}
              </div>
            </div>
          </div>
        </template>
        -->
      </SlotSwitcher>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, nextTick, ref, watch } from "vue"
import { storeToRefs } from "pinia"
import { BngSelect, BngSwitch, BngSlider, BngCardHeading, BngIcon, icons, BngButton } from "@/common/components/base"
import { BngInput } from "@/common/components/base"

import { SlotSwitcher } from "@/common/components/utility"
import { useMissionDetailsStore } from "@/modules/missions/stores/missionDetailsStore"
import { AspectRatio } from "@/common/components/utility"
import { vBngPanel, vBngFocusIf, vBngScopedNav, vBngOnUiNavFocus } from "@/common/directives"
import { useUINavScope } from "@/services/uiNav"
import { clamp } from "@/utils/maths"
import { lua } from '@/bridge'

const store = useMissionDetailsStore()
const { missionSettings, availableVehicles, selectedMission } = storeToRefs(store)

const hasAnySettings = computed(() => {
  return (missionSettings.value && missionSettings.value.length > 0) || (availableVehicles.value && availableVehicles.value.length > 0)
})

const hasCustomSettings = computed(() => {
  return false
})

const pickVehicle = setting => {
  console.log("pickVehicle", setting)
  lua.extensions.gameplay_missions_missionScreen.openVehicleSelectorForMissionBySetting(selectedMission.value.id, setting.key)
}

const changeSelectValue = function (value, label, option, setting) {
  store.changeSettings(setting.key, value)
  setting.currentOption = option
}

const toggleSetting = setting => {
  if (setting.type === "bool") {
    setting.value = !setting.value
    store.changeSettings(setting.key, setting.value)
  }
}

const changeNumSettingValue = (setting, dir) => {
  console.log("changeNumSettingValue", dir)
  const newValue = setting.value + dir
  const clampedValue = clamp(newValue, setting.min, setting.max)
  store.changeSettings(setting.key, clampedValue)
}
</script>

<style scoped lang="scss">
@use "@/styles/modules/density" as *;
$b-rad: $border-rad-1;

.settings-container {
  width: 30rem;
}

.settings-wrapper {
  display: grid;
  gap: 0.25rem;

  .setting-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.15rem;
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.15);
    border-radius: $b-rad;

    :deep(.bng-select) {
      padding: 0;
      flex: 1 0 5rem;
      min-width: 0;

      .bng-select-content {
        padding: 0.15rem 0;
      }

      .label {
        font-size: 1rem;
        padding: 0 0.15rem;
      }

      .bng-button {
        font-size: 0.8rem;
        margin: 0.15rem;
        background: none;
      }
    }

    .setting-item-label {
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
      min-width: 0;
      padding-right: 0.5rem;

      .modified-icon {
        font-size: 0.8em;
      }

      &.disabled-text {
        color: var(--bng-cool-gray-400);
      }
    }

    &.vehicle-setting {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;

      .image {
        width: 100%;
        border-radius: $b-rad;
      }
    }
    .setting-row {
      display: flex;
      align-items: center;
      flex: 1;

    }
    .setting-row-button {
      display: flex;
      align-items: center;
      flex: 1;
      > * {
        width: 100%;
        max-width: 100%;
      }
    }
  }

  .input {
    flex: 0 1 5em;
    :deep(.input-container) {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-end;
      color: red;
      > label {
        position: unset;
        display: unset;
        flex: 0 1 5em;
      }
    }
  }

  .setting-switch {
    width: 100%;
    flex-direction: row-reverse;
    :deep(.bng-switch-label) {
      flex: 1 1 auto;
    }
  }

  .centered {
    width: 100%;
    text-align: center;
    padding: 2rem;
  }

  .setting-value {
    padding: 0.5rem;
    border-radius: $b-rad;
    background: rgba(0, 0, 0, 0.2);
    text-align: center;
    font-weight: 500;

    &.enabled {
      background: rgba(0, 255, 0, 0.2);
    }

    &.disabled {
      opacity: 0.5;
      &:hover {
        background: rgba(0, 0, 0, 0.2);
      }
    }
  }

  .input-wrapper {
    display: flex;
    justify-content: flex-end;
    flex: 1 1 5em;

    .input {
      width: 80px;
    }
  }
}
</style>
