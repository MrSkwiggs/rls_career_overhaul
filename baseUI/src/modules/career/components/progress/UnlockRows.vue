<template>
  <div class="unlock-rows">
    <div class="rows-container">
      <div
        v-for="(tier, idx) in tiers"
        :key="tier.index"
        :class="{
          'tier-row': true,
          'grayed-out': currentTier <= tier.index - 1,
          'completed': currentTier + 1 > tier.index,
          'in-development': tier.isInDevelopment,
          'first-tier': idx === 0,
          'last-tier': idx === tiers.length - 1
        }"
      >
        <!-- Progress Bar (Full Width Background) -->
        <div class="progress-track">
          <div
            v-if="currentTier + 1 > tier.index"
            class="progress-fill"
            style="height: 100%"
          ></div>
        </div>


        <!-- Header -->
        <div class="header">
          <!-- Level Name + Description Heading -->
          <div class="level-name-and-heading">
            <span class="level-label">Level {{ tier.label ? tier.label : tier.index }}</span>
            <span v-if="tier.description && tier.description.heading" class="description-heading">: {{ tier.description.heading }}</span>
          </div>
        </div>

        <!-- Content Row -->
        <div class="content-row">
          <!-- Description Text (Left) -->
          <div class="description-column">
            <!-- Unlock Condition Card (only for locked/in-development levels) -->
            <BngCard v-if="tier.isInDevelopment || (currentTier + 1 <= tier.index || !unlocked)" class="unlock-condition-card" :style="progressStyle">
              <div class="unlock-condition">
                <div class="info">
                  <BngIcon
                    class="icon"
                    :type="tier.isInDevelopment ? icons.roadblockL : icons.lockClosed"
                    :color="'gray'"
                  />
                  <div class="label">
                    <template v-if="tier.isInDevelopment">
                      Coming Soon!
                    </template>
                    <template v-else>
                      {{ tier.xpCurrent }} / {{ tier.xpRequired }} XP
                    </template>
                  </div>
                </div>
                <BngProgressBar
                  v-if="!tier.isInDevelopment && tier.currentValue && tier.requiredValue"
                  :value="tier.xpCurrent"
                  :min="0"
                  :max="tier.xpRequired"
                  :valueLabelFormat="''"
                  class="progress" />
              </div>
            </BngCard>
            <div v-if="tier.description && tier.description.description" class="description-text">
              {{ tier.description.description }}
            </div>
          </div>

          <!-- Unlocks (Right) -->
          <div class="unlocks-column">
            <template v-if="tier.list && tier.list.length > 0">
              <div class="unlocks-list">
                <UnlockCard
                  v-for="(item, idx) in tier.list"
                  :key="idx"
                  class="unlock-item"
                  :data="item"
                />
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue"
import UnlockCard from "../progress/UnlockCard.vue"
import { BngIcon, icons, BngCard, BngProgressBar } from "@/common/components/base"

const props = defineProps({
  value: {
    type: Number,
    default: 0,
  },
  min: {
    type: Number,
    default: 0,
  },
  max: {
    type: Number,
    required: true,
  },
  maxRequiredValue: {
    type: Number,
    required: false,
  },
  tiers: Array,
  currentTier: Number,
  unlocked: Boolean,
  progressFillColor: {
    type: String,
    default: "#ff6600"
  },
})

function hexToRgb(hex) {
  // Remove the hash if present
  hex = hex.replace(/^#/, '')

  // Parse the hex values
  const bigint = parseInt(hex, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255

  return `${r}, ${g}, ${b}`
}

const progressStyle = computed(() => {
  if (!props.progressFillColor) return {}

  const style = {}

  if (props.progressFillColor.startsWith("#")) {
    style['--progress-fill-color'] = hexToRgb(props.progressFillColor)
  } else if (props.progressFillColor.startsWith("var(--")) {
    style['--progress-fill-color'] = props.progressFillColor
  }

  return style
})


</script>

<style scoped lang="scss">
.unlock-rows {
  font-family: "Overpass", var(--fnt-defs);
  font-style: normal;
  font-weight: 600;
  background-color: rgba(black, 0.6);
  border-radius: var(--bng-corners-2);
  padding: 0.25rem;
  overflow: hidden;

  .rows-container {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .tier-row {
    position: relative;
    padding: 0;
    padding-left: 1rem;
    background-color: rgba(white, 0.05);
    border-radius: var(--bng-corners-1);
    overflow: hidden;
    display: flex;
    flex-direction: column;

    &.grayed-out {
      color: var(--bng-cool-gray-500);

      :deep(.icon) {
        color: var(--bng-cool-gray-500);
      }
    }

    &.current {
      background-color: rgba(white, 0.1);
      background: linear-gradient(
        to left,
        rgba(white, 0.15) 0%,
        color-mix(in srgb, v-bind('props.progressFillColor.startsWith("var(--") && props.progressFillColor.endsWith("-rgb)") ? `rgb(${props.progressFillColor})` : props.progressFillColor') 20%, transparent) 100%,
        rgba(black, 0.6) 12rem
      );
    }

    &.completed:not(.in-development) {
      background: linear-gradient(
        to left,
        rgba(white, 0.15) 0%,
        color-mix(in srgb, v-bind('props.progressFillColor.startsWith("var(--") && props.progressFillColor.endsWith("-rgb)") ? `rgb(${props.progressFillColor})` : props.progressFillColor') 50%, transparent) 100%,
        rgba(black, 0.6) 12rem
      );
    }

    &.in-development {
      background:
        repeating-linear-gradient(
          45deg,
          rgba(white, 0.05),
          rgba(white, 0.05) 1rem,
          rgba(white, 0) 1rem,
          rgba(white, 0) 2rem
        ),
        rgba(black, 0.6);
    }
  }


  .header {
    display: flex;
    border-radius: var(--bng-corners-1) var(--bng-corners-1) 0 0;
    padding: 0.33rem 0.5rem;
    flex: 0 0 auto;
    font-size: 1.25rem;
    font-weight: 800;
    background-color: rgba(var(--bng-cool-gray-700-rgb), 0.4);
    position: relative;
    z-index: 1;
    align-items: center;

    .level-name-and-heading {
      flex: 1 1 auto;
      display: flex;
      align-items: baseline;
      gap: 0.25rem;

      .level-label {
        font-weight: 800;
        font-style: italic;
      }

      .description-heading {
        font-weight: 600;
        font-style: normal;
      }
    }
  }

  .tier-row.completed .header {
    background-color: rgba(var(--bng-cool-gray-600-rgb), 0.6);
  }

  .tier-row.current .header {
    background-color: rgba(var(--bng-cool-gray-500-rgb), 0.5);
  }

  .tier-row.grayed-out .header {
    background-color: rgba(var(--bng-cool-gray-800-rgb), 0.3);
  }

  .progress-track {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 1rem;
    background-color: rgba(black, 0.4);
    overflow: visible;
    z-index: 0;

    .progress-fill {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(
        to bottom,
        v-bind('props.progressFillColor.startsWith("var(--") && props.progressFillColor.endsWith("-rgb)") ? `rgb(${props.progressFillColor})` : props.progressFillColor'),
        color-mix(in srgb, v-bind('props.progressFillColor.startsWith("var(--") && props.progressFillColor.endsWith("-rgb)") ? `rgb(${props.progressFillColor})` : props.progressFillColor') 80%, white)
      );
    }

  }

  .tier-row.first-tier .progress-track {
    border-top-left-radius: var(--bng-corners-1);
    border-top-right-radius: var(--bng-corners-1);
  }

  .tier-row.last-tier .progress-track {
    border-bottom-left-radius: var(--bng-corners-1);
    border-bottom-right-radius: var(--bng-corners-1);
  }

  .content-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    padding: 0.5rem 0.75rem;
    position: relative;
    z-index: 1;
  }

  .description-column {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;

    .unlock-condition-card {
      width: 100%;
    }

    .unlock-condition {
      display: flex;
      flex-flow: column;
      background: linear-gradient(
            to right,
            rgba(var(--progress-fill-color), 0.1),
            black
          );

      .info {
        flex: 1 1 auto;
        display: flex;
        flex-flow: row;
        align-items: center;
        gap: 0.5rem;
        padding: 0.2rem;

        .icon {
          flex: 0 0 auto;
          font-size: 1.5rem;
          z-index: 1;
        }

        .label {
          font-weight: 500;
        }
      }

      > .progress {
        padding: 0;
        :deep(.progress-bar) {
          overflow: hidden;
          border-radius: var(--bng-corners-1);
          height: 0.2rem;
          background: linear-gradient(
            to right,
            rgba(var(--progress-fill-color), 0.25),
            color-mix(in srgb, rgba(var(--progress-fill-color), 1) 25%, black)
          );
          .progress-fill {
            background: rgba(var(--progress-fill-color), 1) !important;
          }
        }
      }
    }

    .description-text {
      font-size: 0.9em;
      font-weight: 400;
      line-height: 1.4;
      color: rgba(white, 0.9);
    }
  }

  .tier-row.grayed-out .description-text {
    color: var(--bng-cool-gray-500);
  }

  .unlocks-column {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    .unlocks-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .unlock-item {
        border-radius: var(--bng-corners-2);
      }
    }
  }
}
</style>

