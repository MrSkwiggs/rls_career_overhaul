<template>
  <div class="options-panel-content" v-bng-blur>
    <BlurBackground />
    <div class="header-row">
      <BngScreenHeadingV2 type="2" class="header-title-v2">
        Options
      </BngScreenHeadingV2>
    </div>
    <div class="section-content" :class="{ 'disabled': !canConfigureOptions }">
      <div v-if="hasOptions" class="options-scope">
        <div class="config-group" v-for="group in options" :key="group.name">
          <div class="section-header" v-if="group.name">
            <BngCardHeading :outline="!group.enabled" type="ribbon" class="section-title">
              <!-- Switch for boolean options -->
              <BngSwitch
                v-if="group.type === 'switch'"
                class="group-switch"
                v-model="group.value"
                @update:modelValue="group.onChange"
                :label="group.name"
                labelBefore
                inline
                alwaysTransparent
              />
            </BngCardHeading>
          </div>
          <template v-if="group.enabled">
            <div class="config-item" v-for="(option, optionIndex) in group.options" :key="option.key">
              <div class="option-row" :class="{ 'disabled': option.disabled }">
                <label class="option-label">
                  <BngIcon v-if="option.icon" :type="option.icon" class="option-icon" />
                  {{ option.label }}
                </label>

                <!-- Select dropdown for all options -->
                <BngSmartSelect
                  v-if="option.type === 'select'"
                  v-model="option.value"
                  :items="option.options || []"
                  :threshold="80"
                  @update:modelValue="option.onChange"
                />

                <!-- Switch for boolean options -->
                <BngSwitch
                  v-else-if="option.type === 'switch'"
                  v-model="option.value"
                  @update:modelValue="option.onChange"
                  :label="option.label"
                  labelBefore
                />

                <!-- String input for text options -->
                <BngInput
                  v-else-if="option.type === 'string'"
                  v-model="option.value"
                  :placeholder="option.placeholder"
                  :char-max="option.maxLength"
                  @valueChanged="option.onChange"
                />

                <!-- Number input for numeric options -->
                <BngInput
                  v-else-if="option.type === 'number'"
                  v-model="option.value"
                  type="number"
                  :num-min="option.min"
                  :num-max="option.max"
                  :num-step="option.step"
                  @valueChanged="option.onChange"
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
    <slot name="buttons"></slot>
  </div>
</template>

<script setup>
import { BngCardHeading, BngIcon, BngSwitch, BngInput, BngSmartSelect, BngScreenHeadingV2 } from "@/common/components/base"
import { vBngBlur} from "@/common/directives"
import BlurBackground from "@/common/modules/main-bg/components/BlurBackground.vue"

const props = defineProps({
  options: {
    type: Array,
    default: () => []
  },
  hasOptions: {
    type: Boolean,
    default: false
  },
  canConfigureOptions: {
    type: Boolean,
    default: true
  }
})
</script>

<style scoped lang="scss">
@use "@/styles/modules/mixins" as *;

.options-panel-content {
  flex: 1;
  position: relative;
  background-color: var(--bng-black-o4);
  border-radius: var(--bng-corners-2);
  overflow: visible;
  display: flex;
  flex-direction: column;
  align-self: center;
  width: 100%;
  color: white;
}

.header-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  padding-right: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: var(--bng-corners-2) var(--bng-corners-2) 0 0;
  --bng-heading-background-opacity: 0;
  min-height: 3.6rem;
  > :deep(.bng-button) {
    margin-top: 0.75rem !important;
  }
  &.active {
    background-color: rgba(0, 0, 0, 0.75);
    .header-title {
      color: white;
      margin-left: 0rem;
    }
  }
  &.no-controller {
    background-color: rgba(0, 0, 0, 0.5);
  }
}

.header-title-v2 {
  :deep(.header) {
    > h1 {
      font-weight: 1000 !important;
    }
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
  }
}

.section-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}

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

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  gap: 1rem;
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
</style>

