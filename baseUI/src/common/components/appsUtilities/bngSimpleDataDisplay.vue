<template>
  <div class="simple-data-display" :class="{ 'with-icon': icon }">
    <BngIcon v-if="icon" :type="iconType" class="icon" />
    <div v-if="label && !icon" class="data-label">{{ label }}</div>
    <div v-if="!$slots.default" class="data-value">{{ value }}</div>
    <template v-if="props.minutes || props.seconds">
      <div class="time-container">
        <span :class="{ 'time-minutes': true, 'zero': minutes === '00' }">{{ props.minutes }}</span>
        :<span class="time-seconds">{{ props.seconds }}</span>
        <template v-if="props.milliseconds">
          .<span class="time-milliseconds">{{ props.milliseconds }}</span>
        </template>
      </div>
    </template>
    <template v-if="$slots.default">
      <div class="data-value-extra">
        <slot></slot>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { BngIcon, icons } from '@/common/components/base'

const props = defineProps({
  label: {
    type: String,
    default: ''
  },
  value: {
    type: [String, Number, Object, Array],
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  minutes: {
    type: String,
  },
  seconds: {
    type: String,
  },
  milliseconds: {
    type: String,
  }
})

const iconType = computed(() => {
  return props.icon
})

</script>

<style lang="scss" scoped>
.simple-data-display {
  display: flex;
  flex-direction: column;
  font-family: 'Overpass', var(--fnt-defs);
  padding: 0.75rem;
  font-size: 1em;
  position: relative;
  text-shadow: 0 0 0.5rem rgba(var(--bng-off-black-rgb), 0.25);
  min-width: 6em;
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--bng-off-black);
    opacity: var(--app-bg-opacity, 0.5);
    z-index: -1;
    border-radius: var(--bng-corners-1);
  }

  &.with-icon {
    flex-direction: row;
    align-items: first baseline;
    gap: 0.5rem;
    .icon {
      font-weight: 300 !important;
      --bng-icon-size: 1.5em;
      align-self: first baseline;
    }
  }

  .data-label {
    font-weight: 300;
  }

  .data-value, .data-value-extra, .time-container {
    font-weight: 500;
    font-size: 1.25em;
  }
  .time-container {
    display: flex;
    flex-flow: row;
    font-family: var(--fnt-mono);
    font-weight: 800;
    .zero {
      opacity: 0.5;
    }
  }
}
</style>
