<!-- bngPropVal - for displaying a key/value pair, optionally with a leading icon -->
<template>
  <div :class="itemClass">
    <BngIcon v-if="iconType && !noIcon" class="icon" :type="iconType" :color="iconColor" />
    <span v-if="keyLabel" class="key-label">{{ keyLabel }}</span>
    <span class="value-label">{{ value }}</span>
  </div>
</template>

<script setup>
import { computed, ref } from "vue"
import { BngIcon } from "@/common/components/base"
import { shrinkNum } from "@/utils/format"

const props = defineProps({
  iconType: [String, Object],
  keyLabel: String,
  valueLabel: {
    required: true,
  },
  shrinkNum: Boolean,
  iconColor: {
    type: String,
    default: "#fff",
  },
  noGap: {
    type: Boolean,
    default: false,
  },
  noIcon: {
    type: Boolean,
    default: false,
  },
})

const itemClass = computed(() => ({
  "info-item": true,
  "with-icon": props.iconType,
  "no-key": !props.keyLabel,
  "no-gap": props.noGap,
}))

const value = computed(() => {
  const i = props.valueLabel
  return props.shrinkNum ? shrinkNum(i, 0) : i
})
</script>

<style lang="scss" scoped>
.info-item {
  --font-weight-key: 400;
  --font-weight-value: 600;
  --icon-size: 1.5em;

  display: inline-grid;
  grid-template-columns: auto auto;
  gap: 0.25rem;
  justify-content: flex-start;
  align-items: baseline;
  position: relative;
  line-height: 1.25em;
  font-family: var(--fnt-defs);
  padding: var(--paddings, 0.25em 0.25em);

  &.no-gap {
    gap: 0;
  }

  & > .icon {
    font-size: var(--icon-size);
    align-self: baseline;
    transform: translateY(calc((var(--icon-size) - 1em) / 8));
    font-style: normal;
    font-weight: 400 !important;
    --bng-icon-color: var(--units-icon-color, var(--bng-off-white));
  }
  &.with-icon {
    grid-template-columns: auto auto auto;
    &.no-key {
      grid-template-columns: auto auto;
    }
  }
  & > :not(:last-child) {
    // margin-right: 0.5em;
  }

  & > * {
    // margin-bottom: 0.125em;
  }

  & > .key-label {
    font-weight: var(--font-weight-key);
    color: var(--bng-cool-gray-100);
    color: var(--units-label-color);
    padding-right: 0.25rem;
  }

  & > .value-label {
    font-weight: var(--font-weight-value);
  }
}
</style>