<template>
  <div :class="{ 'insurance-perk-icon': !perkIconData.iconOnly, [computedColor]: computedColor }" v-bng-tooltip:top="!perkIconData.iconOnly ? perkIconData.tooltipText : null">
    <BngIcon :type="icons.shieldCheckmark" :class="{ 'glowing-icon': true, [computedColor]: computedColor }"/>
    <span v-if="!perkIconData.iconOnly" :class="{ 'small-text': true, [computedColor]: computedColor }">{{ perkIconData.smallText }}</span>
  </div>
</template>

<script setup>

import { computed } from "vue"
import { BngIcon, icons } from "@/common/components/base"
import { vBngTooltip } from "@/common/directives"

const props = defineProps({
  perkIconData:{
    type: Object,
    required: true,
  },
})

const computedColor = computed(() => {
  if (props.perkIconData.isSignaturePerk !== undefined) {
    return props.perkIconData.isSignaturePerk ? 'green' : 'blue'
  }
  return props.perkIconData.color
})
</script>

<style lang="scss">
@import '@/../../../ui/ui-vue/src/modules/career/components/insurance/insuranceStyle.css';
</style>

<style scoped lang="scss">
.insurance-perk-icon {
  display: inline-flex;
  align-items: center;
  font-style: normal !important;
  background-color: rgba(168, 168, 168, 0.338);
  border-radius: 0.5em;
  padding-right: 0.2em;

  &.red {
    background-color: rgba(248, 113, 113, 0.338);
  }
}

.small-text {
  font-size: 0.9em;
  margin-top: 0.2em;
  margin-left: 0.3em;
  font-weight: 400;

  &.red {
    color: var(--red-500);
    text-shadow: 0 0 0px var(--red-500);
  }
}

.glowing-icon {

  &.red {
    color: var(--red-400);
  }

  &.blue {
    color: var(--blue-shade-10);
  }

  &.green {
    color: var(--green-400);
  }
}

</style>