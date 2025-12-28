<template>
  <div class="display-controls-container">
    <div class="display-controls" :class="{ 'display-controls-list': detailsMode === 'displayControls' || detailsMode === 'default' }">
      <div v-for="option in controls" :key="option.key" class="control-group" :class="{'force-full-width': detailsMode === 'default'}">
        <div class="control-group-label">{{ option.label }}</div>
        <BngTooltip :text="option.description || 'No description available'" position="top">
          <BngSmartSelect
            v-if="option.type === 'dropdown'"
            :modelValue="option.value"
            :items="option.options || []"
            @update:modelValue="newValue => onOptionChanged(option.key, newValue)"
            :threshold="8" />
          <BngSwitch
            v-else-if="option.type === 'checkbox'"
            class="full-width-checkbox"
            :class="{ active: option.value }"
            :modelValue="option.value"
            @update:modelValue="newValue => onOptionChanged(option.key, newValue)"
            labelBefore
            alwaysTransparent>
            <!-- {{ booleanToStringByKey[option.key][option.value] }} -->
            {{ option.checkboxLabel }}
          </BngSwitch>

          <BngInputNew
            v-else-if="option.type === 'number'"
            :modelValue="option.value"
            :min="option.min"
            :max="option.max"
            :showExternalButton="false"
            type="number"
            @update:modelValue="newValue => onOptionChanged(option.key, newValue)" />
        </BngTooltip>
      </div>
    </div>

    <!-- Reset button -->
    <div class="reset-button-container" v-if="detailsMode === 'displayControls'">
      <BngButton @click="resetToDefaults" accent="attention" iconLeft="trashBin1" class="reset-button"> Reset to Defaults </BngButton>
    </div>
  </div>
</template>

<script setup>
import { BngButton, BngInputNew } from "@/common/components/base"
import { computed } from "vue"
import { BngSmartSelect, BngSwitch } from "@/common/components/base"
import BngTooltip from "@/common/components/base/bngTooltip.vue"

const props = defineProps({
  displayData: {
    type: Array,
    required: true,
  },
  detailsMode: {
    type: String,
    required: true,
  },
  updateDisplayData: {
    type: Function,
    required: true,
  },
  resetDisplayDataToDefaults: {
    type: Function,
    required: true,
  },
  setDetailsMode: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(["focus-item"])

const booleanToStringByKey = computed(() => {
  let valuesByKey = {}
  for (const option of props.displayData) {
    if (option.type === "checkbox") {
      valuesByKey[option.key] = {}
      for (const checkboxOption of option.options) {
        valuesByKey[option.key][checkboxOption.value] = checkboxOption.label || (checkboxOption.value ? "Yes" : "No")
      }
    }
  }
  return valuesByKey
})

// displayData and detailsMode are now passed as props

const controls = computed(() => {
  return props.displayData
    .filter(x => x.showInModes?.[props.detailsMode])
    .map(x => ({
      ...x,
      checkboxLabel: x.type === "checkbox" ? booleanToStringByKey.value[x.key]?.[x.value] : undefined,
    }))
})

const onOptionChanged = (key, newValue) => {
  props.updateDisplayData(key, newValue)
  emit("focus-item", key)
}

const resetToDefaults = () => {
  props.resetDisplayDataToDefaults()
}

const setDetailsModeToDisplayControls = () => {
  props.setDetailsMode("displayControls")
}
</script>

<style scoped lang="scss">
@use "@/styles/modules/mixins" as *;

.display-controls-container {
  color: white;
  :deep(.card-cnt) {
    background: none;
    overflow: visible;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .heading {
    margin-left: -0.5rem;
    margin-top: 0;
    margin-bottom: 0rem;
  }
  :deep(.heading-style-ribbon::before) {
    top: 0.1em;
  }
}

.display-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.25rem;
  &.display-controls-list {
    grid-template-columns: 1fr;
  }
}

.control-group {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.25rem;
  align-items: center;
  --font-size: 1em;
  > * {
    flex: 1 1 0;
  }
  .full-width-checkbox {
    width: 100%;
    :deep(.bng-pill) {
      width: 100%;
    }
    background-color: rgba(0, 0, 0, 0.25);
    &.active {
      background-color: rgba(0, 0, 0, 0.5);
    }
  }

  &.force-full-width {
    flex-direction: column;
    align-items: flex-start;

    > :not(.control-group-label) {
      width: 100%;
    }
  }
}

.control-group-label {
  color: var(--text-color-secondary);
}

.display-options-button {
  grid-column: 1 / -1;
  width: calc(100% - 0.5rem);
  max-width: unset !important;
}

.reset-button-container {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}

.reset-button {
  width: 100%;
  max-width: unset !important;
}
</style>
