<template>
  <div
    class="step-tab"
    :class="{
      'first-tab': first,
      'active-tab': active,
      'completed-tab': completed,
      'no-thumbnail': !preview,
    }"
    v-bng-on-ui-nav:ok.focusRequired="handleActivate"
    @click="handleActivate"
    v-bng-tooltip:bottom="tooltip"
  >
    <div class="icon-wrapper">
      <BngIcon class="step-icon" :type="icon" />
    </div>
    <AspectRatio
      v-if="preview"
      class="thumbnail-image"
      :ratio="ratio"
      :external-image="preview"
    >
      <slot name="overlay"></slot>
      <BngPaintTile
        v-if="showPaintTile && paints && paints.length > 0"
        :paint-id="paintId"
        :paint="paints"
        :paint-name="paintName"
        :width="paintWidth"
        :height="paintHeight"
        @click="handleActivate"
        class="preview-paint-tile"
        bng-no-nav="true"
        tabindex="-1"
      />
    </AspectRatio>
    <!-- <div v-else class="step-arrow">
      <svg width="24" height="50" viewBox="0 0 24 51" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMid meet">
        <path d="M0 0.00012207L15 0L23 25.5L15 51L0 51.0001V0.00012207Z" fill="var(--step-bg, rgba(var(--step-bg-rgb), 1))"/>
      </svg>
    </div> -->
  </div>
</template>

<script setup>
import { BngCardHeading, BngIcon, BngPaintTile } from "@/common/components/base"
import { vBngOnUiNav, vBngTooltip } from "@/common/directives"
import { AspectRatio } from "@/common/components/utility"

const props = defineProps({
  first: { type: Boolean, default: false },
  title: { type: String, required: true },
  tooltip: { type: String },
  active: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  preview: { type: String, default: "" },
  icon: { type: String, default: "" },
  ratio: { type: String, default: "2:1" },
  // Paint tile overlay (optional)
  showPaintTile: { type: Boolean, default: false },
  paintId: { type: String, default: "" },
  paints: { type: Array, default: () => [] },
  paintName: { type: String, default: "" },
  paintWidth: { type: Number, default: 45 },
  paintHeight: { type: Number, default: 20 },
})

const emit = defineEmits(["activate"])

function handleActivate() {
  emit("activate")
}
</script>

<style lang="scss" scoped>
.step-tab {
  --step-bg: var(--bng-cool-gray-750);
  --step-bg-rgb: var(--bng-cool-gray-750-rgb);

  flex: 0 1 auto;
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: flex-start;
  margin-right: -0.5em;
  overflow: visible;
  cursor: pointer;

  clip-path: polygon(
    0.5em 50%,
    0% 0%,
    calc(100% - 0.5em) 0%,
    100% 50%,
    calc(100% - 0.5em) 100%,
    0% 100%
  );

  &.first-tab {
    clip-path: polygon(
      0% 0%,
      calc(100% - 0.5em) 0%,
      100% 50%,
      calc(100% - 0.5em) 100%,
      0% 100%
    );
    .icon-wrapper {
      border-radius: 0.5em;
    }
  }

  .icon-wrapper {
    --bng-icon-size: 2.5em;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5em 1.5em;
    background: linear-gradient(
      to left,
      rgba(var(--step-bg-rgb), 0) 0,
      rgba(var(--step-bg-rgb), 0.98) 3em,
      rgba(var(--step-bg-rgb), 1) 3.001em,
      rgba(var(--step-bg-rgb), 1) 100%
    );
    margin-right: -3em;
    padding-right: 5em;
    z-index: 2;
  }

  & + .step-tab {
    .icon-wrapper {
      padding-left: 2em;
    }
  }

  &.no-thumbnail {
    background-color: rgb(var(--step-bg-rgb));
    .icon-wrapper {
      margin-right: 0;
      padding-right: 1.5rem;
      background-color: transparent;
    }
  }

  &:hover {
    --step-bg: var(--bng-cool-gray-650) !important;
    --step-bg-rgb: var(--bng-cool-gray-650-rgb) !important;
  }

  &.active-tab {
    --step-bg: var(--bng-orange-500) !important;
    --step-bg-rgb: var(--bng-orange-500-rgb) !important ;
    &:hover {
      --step-bg: var(--bng-orange-400) !important;
      --step-bg-rgb: var(--bng-orange-400-rgb) !important;
    }
  }

  &.completed-tab {
    --step-bg: var(--bng-cool-gray-600) !important;
    --step-bg-rgb: var(--bng-cool-gray-600-rgb) !important;
    &:hover {
      --step-bg: var(--bng-cool-gray-500) !important;
      --step-bg-rgb: var(--bng-cool-gray-500-rgb) !important;
    }
  }
}

.thumbnail-image {
  width: 8em;
  overflow: hidden;
}



.step-arrow {
  position: absolute;
  inset: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: var(--step-bg, rgba(var(--step-bg-rgb), 1));
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  z-index: 0;
}

.step-arrow svg {
  height: 100%;
  width: auto;
  transform-origin: right center;
  margin-right: -1.25em;
  display: block;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.3);

  .placeholder-icon {
    font-size: 2rem;
    color: rgba(255, 255, 255, 0.4);
  }
}

.preview-paint-tile {
  position: absolute;
  bottom: 0.25em;
  right: 1em;
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: 0.4rem;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.6));
  z-index: 2;
}
</style>

