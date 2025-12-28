<template>
  <BngButton
    class="bng-binding-tile-button"
    :accent="ACCENTS.custom"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <div :class="['content', layoutClass]">
      <div class="action">
        <div v-if="showIndicators" class="indicators">
          <div :class="['indicator', { active: i === 2 }]" v-for="i in 5" :key="i"></div>
        </div>
        <div class="icon-wrapper">
          <BngIcon v-if="useGlyphIcon" class="icon-glyph" :type="resolvedGlyphType" />
          <BngImageAsset v-else-if="resolvedImagePath" :externalSrc="resolvedImagePath" class="icon-img" mask />
          <div v-else-if="label" class="tile-fallback-label">{{ label }}</div>
        </div>
      </div>

      <div v-if="showValueBar" class="value-bar">
        <BngInputBar :value="value" :target-value="targetValue" :is-bidirectional="isBidirectional" :vertical="layout == 'vertical'" />
      </div>

      <div class="bindings-wrapper">
        <slot name="binding">
          <template v-if="action && action.bindings">
            <BngBinding
              v-for="binding in action.bindings"
              :key="binding.device + ':' + binding.control"
              :action="action.action"
              :device="binding.device"
              :device-key="binding.control"
              :dark="dark"
              show-unassigned
              :action-variants="actionVariants"
              :vertical="layout === 'vertical'"
            />
          </template>
          <template v-else>
            <BngBinding
              :vertical="layout === 'vertical'"
              :action="action && action.action"
              :dark="dark"
              show-unassigned
              :action-variants="actionVariants"
            />
          </template>
        </slot>
      </div>
    </div>
  </BngButton>

</template>

<script setup>
import { computed } from 'vue'
import { BngButton, BngBinding, BngIcon, BngImageAsset, ACCENTS, icons } from '@/common/components/base'
import { BngInputBar } from '@/common/components/appsUtilities'

const props = defineProps({
  // Visuals
  label: String,
  icon: [Object, String],
  showIndicators: { type: Boolean, default: false },
  layout: { type: String, default: 'horizontal', validator: v => ['horizontal', 'vertical'].includes(v) },
  dark: Boolean,
  disabled: Boolean,

  // Binding source
  action: { type: Object, required: true },
  bindings: { type: Array, default: () => undefined },
  actionVariants: Boolean,

  // Input bar
  showValueBar: { type: Boolean, default: true },
  value: { type: Number, default: 0 },
  targetValue: { type: Number, default: 0 },
  isBidirectional: { type: Boolean, default: false },
})

defineEmits(['click'])

const layoutClass = computed(() => (props.layout === 'vertical' ? 'layout-vertical' : 'layout-horizontal'))
// expects `action` object compatible with bngAppBindingDisplay entries

// re-export icons for template usage if consumers want to pass via :icon="icons.someIcon"
defineExpose({ icons })

// Simple icon resolution from single `icon` prop
const isLikelyImagePath = (val) => typeof val === 'string' && (val.includes('/') || val.startsWith('.') || val.includes('\\'))

const candidateIcon = computed(() => props.icon ?? null)

const useGlyphIcon = computed(() => {
  const c = candidateIcon.value
  if (!c) return false
  if (typeof c === 'object') return !!c.glyph
  if (typeof c === 'string') return !isLikelyImagePath(c) && (c in icons)
  return false
})

const resolvedGlyphType = computed(() => {
  if (!useGlyphIcon.value) return null
  const c = candidateIcon.value
  return c
})

const resolvedImagePath = computed(() => {
  const c = candidateIcon.value
  if (typeof c === 'string' && isLikelyImagePath(c)) return c
  return null
})
</script>

<style lang="scss" scoped>
// Custom accent tuning via CSS variables to match tile design; adjust via parent if needed
.bng-binding-tile-button {
  // Spacing and sizing from design system
  --bng-button-custom-margin: 0; // tiles usually align edge-to-edge in grids
  --bng-button-custom-border-radius: var(--bng-corners-2);

  // Background states
  --bng-button-custom-enabled: var(--bng-cool-gray-800);
  --bng-button-custom-enabled-opacity: 1;
  --bng-button-custom-hover: var(--bng-cool-gray-700);
  --bng-button-custom-hover-opacity: 1;
  --bng-button-custom-active: var(--bng-cool-gray-750);
  --bng-button-custom-active-opacity: 1;
  --bng-button-custom-disabled: var(--bng-cool-gray-800);
  --bng-button-custom-disabled-opacity: 0.5;
  --bng-button-custom-border-enabled: rgba(var(--bng-cool-gray-700-rgb), 0.7);
  --bng-button-custom-border-hover: rgba(var(--bng-cool-gray-600-rgb), 0.9);
  --bng-button-custom-border-active: rgba(var(--bng-cool-gray-700-rgb), 0.9);

  --bng-button-padding: 0.125em;
  --bng-button-padding-top: 0.125em;
  --bng-button-padding-bottom: 0.125em;

  min-height: var(--tile-height-override, 4em);
  min-width: 0;
  width: 100%;
  grid-column: span var(--tile-span, 3);

  // Inner layout
  .content {
    display: flex;
    align-items: stretch;
    align-self: stretch;
    flex: 1 0 auto;
    gap: 0;
    min-inline-size: 0;

    .action {
      display: flex;
      align-items: stretch;
      justify-content: center;
      gap: 0.25em;
      .indicators {
        display: flex;
        flex-flow: column nowrap;
        gap: 0.25rem;
        justify-content: center;
        align-items: stretch;
        width: 0.25em;
        padding-block: var(--indicator-pad, 0.5em);
        .indicator {
          width: auto;
          height: 0.125em;
          flex: 1 0 auto;
          background-color: var(--bng-off-black);
          border-radius: 0 0.125em 0.125em 0;
          &.active {
            background-color: var(--bng-add-blue-300);
          }
        }
      }
    }

    .icon-wrapper {
      flex: 1 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.25em;
      --icon-color: var(--bng-off-white);
      --mask-image-bg-color: var(--icon-color);
      .icon-glyph {
        --bng-icon-size: 1em;
        --bng-icon-color: var(--icon-color);
        flex: 0 0 auto;
      }
      .icon-img {
        width: 1em;
        height: 1em;
      }
      .tile-fallback-label {
        color: var(--bng-off-white);
        font-weight: 500;
        font-size: 1rem;
      }
      &.active {
        --icon-color: var(--bng-add-blue-300);
      }
    }

    .value-bar {
      flex: 0 0 auto;
      padding: 0.25em;
    }

    .bindings-wrapper {
      flex: 0 0 auto;
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-around;
      gap: 0.125rem;
      & > * {
        flex: 1 0 auto;
      }
      // keep it compact similar to app legend buttons
      :deep(.binding-wrap) {
        background: rgba(var(--bng-cool-gray-850-rgb), 0.5);
        border-radius: var(--bng-corners-1);
        padding: 0 0.125rem;
      }
    }

    // layout specific styles
    &.layout-vertical {
      flex-direction: row;
      & > .bindings-wrapper {
        flex-flow: column nowrap;
        padding-right: 0.125em;
      }
    }
    &.layout-horizontal {
      flex-direction: column;
      align-items: stretch;
      .action {
        flex-direction: column;
        .indicators {
          flex-flow: row nowrap;
          width: auto;
          height: 0.25em;
          padding-block: 0;
          padding-inline: var(--indicator-pad, 0.5em);
          .indicator {
            width: 0.125em;
            height: auto;
            border-radius: 0 0 0.125em 0.125em;
          }
        }
      }
      .bindings-wrapper {
        flex-flow: row wrap;
        align-items: flex-start;
        justify-content: space-around;
        padding-bottom: 0.125em;
      }
    }
  }
}
</style>


