<template>
  <BngCard class="mission-settings" bng-nav-item>
    <SlotSwitcher v-for="setting in missionSettings" :slotId="setting.type" :key="setting.key">
      <template #bool>
        <div class="mission-setting-pill" :class="{ 'clickable': !setting.disabled && !noInput }" @click="!setting.disabled && !noInput && toggleSetting(setting)">
          <div class="setting-label" :class="{ 'disabled-text': setting.disabled }">
            <div class="setting-label-header">
              {{ $ctx_t(setting.label) }}
              <BngIcon v-if="setting.disabled" :type="icons.lockClosed" color="var(--bng-cool-gray-400)" class="locked-icon"/>
            </div>
            <div class="setting-label-value">
              <BngIcon :type="setting.value ? 'checkboxOn' : 'missionCheckboxCross'" />
            </div>
          </div>
        </div>
      </template>
      <template #int>
        <div class="mission-setting-pill" :class="{ 'clickable': !setting.disabled && !noInput }">
          <div class="setting-background">
            <div class="setting-increment clickable noHover" @click="!setting.disabled && !noInput && incrementSetting(setting)"></div>
            <div class="setting-decrement clickable noHover" @click="!setting.disabled && !noInput && decrementSetting(setting)"></div>
          </div>
          <div class="setting-label" :class="{ 'disabled-text': setting.disabled }">
            <div class="setting-label-header">
              {{ $ctx_t(setting.label) }}
              <BngIcon v-if="setting.disabled" :type="icons.lockClosed" color="var(--bng-cool-gray-400)" class="locked-icon"/>
            </div>
            <div class="setting-label-value">
              {{ setting.value }}
            </div>
          </div>
        </div>
      </template>
      <template #select>
        <div class="mission-setting-pill" :class="{ 'clickable': !setting.disabled && !noInput }" @click="!setting.disabled && !noInput && toggleSetting(setting)">
          <AspectRatio
            v-if="setting.currentOption && setting.currentOption.thumb"
            class="image"
            :style="{
              backgroundImage: 'url(' + encodeURI(setting.currentOption.thumb) + ')',
            }">
          </AspectRatio>

          <div class="setting-label" :class="{ 'disabled-text': setting.disabled }">
            <div class="setting-label-header">
              {{$ctx_t(setting.label)}}
              <BngIcon v-if="setting.disabled" :type="icons.lockClosed" color="var(--bng-cool-gray-400)" class="locked-icon"/>
            </div>
            <div class="setting-label-value">
              {{$ctx_t(setting.currentOption?.l)}}
            </div>
          </div>
        </div>
      </template>
    </SlotSwitcher>
  </BngCard>
</template>

<script setup>
import { BngCard, BngIcon, icons } from '@/common/components/base'
import { SlotSwitcher, AspectRatio } from '@/common/components/utility'
import { useMissionDetailsStore } from '@/modules/missions/stores/missionDetailsStore'

const store = useMissionDetailsStore()

const props = defineProps({
  missionSettings: {
    type: Array,
    required: true
  },
  noInput: {
    type: Boolean,
    default: false
  }
})

const findOptionValue = (valueToFind, opts) =>
  Math.max(
    0,
    opts.findIndex(opt => opt.v === valueToFind)
  )

const toggleSetting = (setting) => {
  console.log("toggleSetting", setting)
  if(setting.type === "bool") {
    setting.value = !setting.value
    store.changeSettings(setting.key, setting.value)
  } else if(setting.type === "int") {
    setting.value = setting.value + 1
    if(setting.value > (setting.max || 10)) {
      setting.value = setting.min || 0
    }
    store.changeSettings(setting.key, setting.value)
  } else if(setting.type === "select") {
    console.log("select", setting)
    let index = findOptionValue(setting.currentOption.v, setting.values)
    console.log("index", index)
    index = index + 1
    if(index > (setting.values.length - 1)) {
      index = 0
    }
    store.changeSettings(setting.key, setting.values[index].v)
    setting.currentOption = setting.values[index]
  }
}

const incrementSetting = (setting) => {
  console.log("incrementSetting", setting)
  if(setting.type === "int") {
    console.log("incrementSetting", setting.value)
    setting.value = setting.value + (setting.step || 1)
    console.log("incrementSetting", setting.value)
    if(setting.value > (setting.max || 10)) {
      setting.value = setting.min || 0
    }
    store.changeSettings(setting.key, setting.value)
  }
}

const decrementSetting = (setting) => {
  if(setting.type === "int") {
    setting.value = setting.value - (setting.step || 1)
    if(setting.value < (setting.min || 0)) {
      setting.value = setting.max || 10
    }
    store.changeSettings(setting.key, setting.value)
  }
}
</script>

<style scoped lang="scss">
.mission-settings {
  width: 100%;
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  justify-content: flex-start;
  flex-wrap: wrap;
  position: relative;
  border-radius: var(--bng-corners-1);

  :deep(.card-cnt) {
    display: flex;
    flex-flow: row wrap;
    gap: 0.5rem;
    background: none;
    padding-bottom: 0.25rem;
  }

  &:focus-visible::before {
    content: "";
    position: absolute;
    top: -4px;
    bottom: -4px;
    left: -4px;
    right: -4px;
    border-radius: 6px;
    border: 2px solid var(--bng-orange-b400);
    pointer-events: none;
    z-index: 1;
  }
}

.mission-setting-pill {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 0.2rem 0.5rem;
  display: flex;
  flex-direction: row;
  gap: 0.0rem;
  align-items: center;
  min-width: 6rem;
  position: relative;
  overflow: hidden;

  &.clickable {
    cursor: pointer;
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }

  &:not(.clickable) {
    opacity: 0.8;
  }

  .setting-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    pointer-events: none;

    .setting-increment,
    .setting-decrement {
      flex: 1;
      pointer-events: auto;
    }
  }

  .image {
    width: 10rem;
    border-radius: 0.5rem 0 0 0.5rem;
    margin: -0.2rem -0.5rem;
    margin-right: 0.5rem;
  }

  .disabled-text {
    color: var(--bng-cool-gray-400);
  }

  .setting-label {
    flex: 1 0 auto;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: space-between;
    gap: 0.5rem;
    padding: 0.5rem 0.25rem;

    .setting-label-header {
      flex: 0 0 auto;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;

      .locked-icon {
        font-size: 1.0em;
      }
    }

    .setting-label-value {
      flex: 0 0 auto;
      font-weight: 400;
    }
  }
}
</style>