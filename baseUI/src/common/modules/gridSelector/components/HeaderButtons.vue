<template>
  <div class="header-buttons" :class="{ slim }" >
    <BngBinding
      v-show="canSwitchDetails"
      class="header-buttons-binding"
      ui-event="context"
      controller
      track-ignore
    />
    <BngButton
      v-if="!hiddenTabs.includes('detail')"
      class="header-button"
      :class="{ selected: detailsMode === 'detail' }"
      :accent="ACCENTS.text"
      @click="$emit('switch-details-mode', 'detail')"
      v-bng-tooltip:top="'Details'"
    >
      <BngIcon v-if="slim" :type="icons.info" />
      <span v-else>Details</span>
    </BngButton>
    <BngButton
      v-if="!hiddenTabs.includes('advanced')"
      class="header-button"
      :class="{ selected: detailsMode === 'advanced' }"
      :accent="ACCENTS.text"
      @click="$emit('switch-details-mode', 'advanced')"
      v-bng-tooltip:top="'Advanced'"
    >
      <BngIcon v-if="slim" :type="icons.laneProperties" />
      <span v-else>Advanced</span>
    </BngButton>
    <BngButton
      v-if="!hiddenTabs.includes('filter')"
      class="header-button"
      :class="{ selected: detailsMode === 'filter' }"
      :accent="ACCENTS.text"
      @click="$emit('switch-details-mode', 'filter')"
      v-bng-tooltip:top="'Filters'"
    >
      <BngIcon v-if="slim" :type="icons.filter" />
      <span v-else>Filters</span>
    </BngButton>
    <BngButton
      v-if="!hiddenTabs.includes('displayControls')"
      class="header-button"
      :class="{ selected: detailsMode === 'displayControls' }"
      :accent="ACCENTS.text"
      @click="$emit('switch-details-mode', 'displayControls')"
      v-bng-tooltip:top="'Display'"
    >
      <BngIcon v-if="slim" :type="icons.adjust" />
      <span v-else>Display</span>
    </BngButton>
  </div>
</template>

<script setup>
import { BngButton, BngBinding, BngIcon, icons, ACCENTS } from "@/common/components/base"
import { vBngTooltip } from "@/common/directives"
defineProps({
  canSwitchDetails: {
    type: Boolean,
    default: false
  },
  hiddenTabs: {
    type: Array,
    default: () => []
  },
  detailsMode: {
    type: String,
    required: true
  },
  slim: {
    type: Boolean,
    default: false
  }
})

defineEmits(['switch-details-mode'])
</script>

<style scoped lang="scss">
.header-buttons {
  align-self: flex-end;
  position: relative;
  display: flex;
  flex-flow: row nowrap;
  background-color: var(--background-color);
  border-radius: var(--bng-corners-2);
  width: 100%;
  height: 3.6rem;

  .header-buttons-binding {
    flex: 0 0 auto;
    //position: absolute;
    //top: 0.5rem;
    //right: 100%;
    padding-right: 0.5rem;
    padding-left: 0.5rem;
    align-self: center;
    --bng-icon-size: 1.5rem;
    text-shadow: 0 0 0.25rem #0008;
  }

  .header-button {
    padding-left: 0.75em;
    padding-right: 0.75em;
    :deep(.label) {
      max-width: 20em;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    :deep(.background) {
      background-color: var(--background-color);
      opacity: var(--bng-breadcrumbs-enabled-opacity, 1);
    }
    &.bng-path-simple:not(.bng-path-first) {
      padding-left: 0.5em;
    }
    &.bng-path-simple:not(.bng-path-last) {
      padding-right: 0.5em;
    }

    &.selected {
      :deep(.background) {
        background-color: var(--bng-cool-gray-500);
        opacity: 0.5;
      }
    }
  }
}

.slim {
  width: 100%;
  justify-content: space-between;
  .header-button {
    //padding-left: 0.0em;
    //padding-right: 0.0em;
    flex:1;
    background: var(--bng-black-o2);
  }
}
</style>

