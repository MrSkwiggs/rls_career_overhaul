<template>
  <div class="bng-app-binding-display-wrapper" :class="{ 'is-faded': isFaded && !isHovered }"
  @mouseenter="onMouseEnter"
  @mouseleave="onMouseLeave">
    <div
      v-if="showApp"
      class="bng-app-binding-display"
    >
       <!-- modifier bindings -->
       <div v-if="modifierActionInfos && additionalData.vehicleSpecificStatus !== 'enabled'" class="modifier-bindings">
        <BngModifierTiles :modifier-action-infos="modifierActionInfos" />
      </div>

      <!-- constant actions -->
      <BngButton
        v-for="action in constantActions"
        :accent="ACCENTS.custom"
        @mousedown="onActionClickDown(action)"
        tabindex="-1"
        :class="getActionClass(action, true)"
      >
        <div class="label-column">
          <span v-if="action.label" class="label-text">{{ $t(action.label) }}</span>
        </div>
        <div class="binding-column">
          <template v-if="action.bindings">
            <BngBinding
              v-for="binding in action.bindings"
              :key="binding.device + ':' + binding.control"
              :action="action.action"
              :device="binding.device"
              :device-key="binding.control"
              show-unassigned
              action-variants
            />
          </template>
          <BngBinding v-else :action="action.action" show-unassigned action-variants />
        </div>
      </BngButton>

      <div class="flexible-area">
        <!-- normal actions -->
        <BngButton
          v-for="(action, index) in actions"
          :key="action.action || action.label"
          :accent="ACCENTS.custom"
          @mousedown="onActionClickDown(action)"
          tabindex="-1"
          :ref="index === 0 ? 'actionButton' : undefined"
          :class="getActionClass(action, false)"
        >
          <div class="label-column">
            <span v-if="action.label" class="label-text">{{ $t(action.label) }}</span>
          </div>

          <div class="binding-column">
            <template v-if="action.bindings">
              <BngBinding
                v-for="binding in action.bindings"
                :key="binding.device + ':' + binding.control"
                :action="action.action"
                :device="binding.device"
                :device-key="binding.control"
                show-unassigned
                action-variants
              />
            </template>
            <BngBinding v-else :action="action.action" show-unassigned action-variants />
          </div>
        </BngButton>

        <!-- tile actions -->
        <div v-if="tileActions.length > 0" class="tile-flex">
          <BngBindingTileButton
            v-for="(action, i) in tileActions"
            class="tile-grid-item"
            :class="{ 'highlighted': action.highlighted }"
            :action="action"
            :icon="action.icon"
            :label="$t(action.label)"
            :layout="action.direction"
            :showValueBar="action.direction !== undefined"
            :isBidirectional="action.isCentered"
            :value="action.value"
            :style="{ '--tile-span': 4 }"
            :ref="el => setTileRef(i, el)"
            show-unassigned
            action-variants
            bng-no-nav
            tabindex="-1"
          >
            <template v-if="action.bindings">
              <BngBinding
                v-for="binding in action.bindings"
                :key="binding.device + ':' + binding.control"
                :action="action.action"
                :device="binding.device"
                :device-key="binding.control"
                show-unassigned
                action-variants
              />
            </template>
            <BngBinding v-else :action="action.action" show-unassigned action-variants />
          </BngBindingTileButton>
        </div>
      </div>
    </div>
    <div v-if="showApp" class="bottom-left-group">
      <BngButton
        class="bottom-left-button"
        :disabled="additionalData.vehicleSpecificStatus === 'inactive'"
        :accent="(additionalData.vehicleSpecificStatus === 'enabled' || additionalData.vehicleSpecificStatus === 'fleeting') ? ACCENTS.main : ACCENTS.text"
        v-bng-tooltip:right="'Press to show/hide vehicle specific actions'"
        @click="lua.ui_bindingsLegend.toggleShowVehicleSpecificActions()"
        bng-no-nav
        tabindex="-1"
      >
        <BngIcon
          :type="icons.car"
        />
        <BngIcon
          v-if="additionalData.vehicleSpecificStatus === 'enabled'"
          class="bottom-left-lock"
          :type="icons.lockClosed"
        />
      </BngButton>
    </div>
    <BngButton
      class="bottom-left-button"
      :accent="ACCENTS.text"
      :icon="icons.eyeSolidOpened"
      @click="lua.ui_bindingsLegend.toggleShowApp()"
      bng-no-nav
      tabindex="-1"
    />
  </div>
</template>

<script setup>
import { useEvents } from '@/services/events'
import { BngBindingTileButton } from "@/common/components/appsUtilities"
import { shallowRef, ref, onMounted, onBeforeUnmount, computed, watch, nextTick, triggerRef } from 'vue'
import { lua } from '@/bridge'
import { BngBinding, BngButton, BngIcon, ACCENTS, icons } from '@/common/components/base'
import { runRaw } from "@/bridge/libs/Lua.js"
import { setFocus } from '@/services/uiNavFocus'
import BngModifierTiles from './bngModifierTiles.vue'
import { vBngTooltip } from '@/common/directives'

const events = useEvents()

const actions = shallowRef([])
const tileActions = shallowRef([])
const constantActions = shallowRef([])
const modifierActionInfos = shallowRef([])
const additionalData = shallowRef({})
const isFaded = ref(false)
const isHovered = ref(false)
const mouseDownAction = ref("")
const actionOpacity = ref(1)
let fadeOutTimeout = null
const isFadingOut = ref(false)
const showApp = ref(true)

// Grid packing state (tile span via CSS vars)
const tileRefs = ref([])          // element refs for tiles
const isWide = ref([])            // per-tile: has combo-binding
const narrowSpan = ref(4)         // 3|4|6 columns for narrow tiles

const setActions = data => {
  const newActions = Array.isArray(data.actions) ? data.actions : []
  showApp.value = data.showApp
  // Always update constantActions and additionalData immediately
  constantActions.value = Array.isArray(data.constantActions) ? data.constantActions : []
  modifierActionInfos.value = data.modifierActionInfos ? { ...data.modifierActionInfos } : {}
  additionalData.value = data.additionalData ? { ...data.additionalData } : {}

  // Clear any existing fade-out timeout
  if (fadeOutTimeout) {
    clearTimeout(fadeOutTimeout)
    fadeOutTimeout = null
    isFadingOut.value = false
  }

  // If we have current actions and new actions is empty, fade out first
  if (actions.value.length > 0 && newActions.length === 0) {
    isFadingOut.value = true
    actionOpacity.value = 0 // Start fade-out
    // Wait for fade-out transition to complete (0.15s) then clear actions (animations are disabled, so the timeout is currently 0s)
    fadeOutTimeout = setTimeout(() => {
      actions.value = newActions
      actionOpacity.value = 1 // Reset opacity for next actions
      isFadingOut.value = false
      fadeOutTimeout = null
    }, 0)
  } else {
    // If we're getting new actions and previously had no actions, fade them in
    if (newActions.length > 0 && actions.value.length === 0) {
      actions.value = newActions
      // Start with 0 opacity for first-time actions, then fade in
      actionOpacity.value = 0
      // Use nextTick to ensure DOM update, then fade in
      nextTick(() => {
        actionOpacity.value = 1
      })
    } else {
      // For action changes (non-empty to non-empty) or any other case, just swap immediately
      actions.value = newActions
      actionOpacity.value = 1
    }
  }

  tileActions.value = actions.value.filter(action => action.icon)
  actions.value = actions.value.filter(action => !action.icon)
}

const getActionClass = (action, isConstant) => {
  let cls = 'binding-row'

  if (isConstant) {
    cls += ' is-constant'
  } else {
    if (isFadingOut.value) {
      cls += ' is-fading-out'
    }
  }

  if (!action.onClick && !action.inputActionOnClick) {
    cls += ' no-hover'
  }

  if (action.highlighted) {
    cls += ' highlighted'
  }

  return cls
}

const onActionClickDown = (action) => {
  if (action.onClick) {
    runRaw(action.onClick)
  } else if (action.inputActionOnClick) {
    mouseDownAction.value = action.action
    lua.ui_bindingsLegend.triggerInputAction(action.action, 1)
  }
}

const onMouseEnter = () => { isHovered.value = true }
const onMouseLeave = () => { isHovered.value = false }

const onGlobalMouseUp = (event) => {
  if (mouseDownAction.value) {
    lua.ui_bindingsLegend.triggerInputAction(mouseDownAction.value, 0)
    mouseDownAction.value = ""
  }
}

onMounted(() => {
  events.on("setActionsForLegend", setActions)
  events.on("setBindingsLegendFade", (value) => { isFaded.value = !!value })
  //events.on("RecentDevicesChanged", onRecentDevicesChanged)
  lua.ui_bindingsLegend.sendDataToUI(true)
  listenFilteredInputEvents(true)

  document.addEventListener('mouseup', onGlobalMouseUp)
})

onBeforeUnmount(() => {
  document.removeEventListener('mouseup', onGlobalMouseUp)
  // Clear any pending fade-out timeout
  if (fadeOutTimeout) {
    clearTimeout(fadeOutTimeout)
    fadeOutTimeout = null
  }
  // Reset opacity state
  actionOpacity.value = 1
  listenFilteredInputEvents(false)
})

function listenFilteredInputEvents(listen) {
  const method = listen ? "on" : "off"
  events[method]("FilteredInputChanged", onFilteredInputChanged)
  lua.WinInput.setForwardFilteredEvents(listen)
}

function onFilteredInputChanged(data) {
  let updated = false
  for (let action of tileActions.value) {
    if (action.action === data.bindingAction) {
      action.value = data.value
      updated = true
    }
  }
  if (updated) {
    // Force update because tileActions is a shallowRef and nested mutations aren't tracked
    triggerRef(tileActions)
  }
}

// --- Grid span control via CSS variable (no :deep) ---
function setTileRef(i, compOrEl) {
  tileRefs.value[i] = compOrEl && compOrEl.$el ? compOrEl.$el : compOrEl
}

function classifyTiles() {
  // wide if any inner binding renders a ".combo-binding"
  isWide.value = tileRefs.value.map(el => !!el?.querySelector?.('.combo-binding'))
}

function pickNarrowSpanByCount(n) {
  // Choose span to minimize leftover items in last row
  const options = [{ cols: 4, span: 3 }, { cols: 3, span: 4 }, { cols: 2, span: 6 }]
  let best = options[0]
  let bestR = n % best.cols
  for (const opt of options) {
    const r = n % opt.cols
    if (r < bestR) { bestR = r; best = opt }
  }
  return best.span
}

async function onRecentDevicesChanged(devNames) {
  await nextTick()
  // ensure refs array matches tiles length
  tileRefs.value.length = tileActions.value.length
  classifyTiles()
  recomputeLayout()
}

function recomputeLayout() {
  const wideCount = isWide.value.filter(Boolean).length
  const narrowCount = isWide.value.length - wideCount
  narrowSpan.value = wideCount ? 3 : pickNarrowSpanByCount(narrowCount)
}

watch(tileActions, async () => {
  await nextTick()
  // ensure refs array matches tiles length
  tileRefs.value.length = tileActions.value.length
  classifyTiles()
  recomputeLayout()
})

onMounted(async () => {
  await nextTick()
  classifyTiles()
  recomputeLayout()
})

</script>

<style lang="scss" scoped>
.bng-app-binding-display-wrapper {
  position: relative;
  display: flex;
  flex-direction: row-reverse;
  overflow-y: visible;
  overflow-x: hidden;
  height: 100%;
  align-items: flex-start;
  justify-content: right;

  &.is-faded {
    opacity: 0.2;
  }

  .bng-app-binding-display {
    position: relative;
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    overflow-x: hidden;
    overflow-y: auto;

    &::-webkit-scrollbar { // Chromium/CEF
      width: 0.125em;
      height: 0.125em;
    }

    padding: 0.125em;

    .flexible-area {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      overflow: hidden auto;
      margin-top: 0.125em;
      &::-webkit-scrollbar { // Chromium/CEF
        width: 4px;
        height: 4px;
      }
      background: rgba(var(--bng-cool-gray-700-rgb), 0.8);
      border-radius: var(--bng-corners-2);

      .tile-flex {
        display: flex;
        flex-flow: row wrap;
        gap: 0.25em;
        padding: 0.25em;
        align-items: flex-start;
        justify-items: flex-start;
        .tile-grid-item {
          flex: 0 0 auto;
          width: auto;
        }
      }

      .highlighted {
          --bng-button-custom-enabled: var(--bng-orange-550);
          --bng-button-custom-enabled-opacity: 1;
          --bng-input-bar-border: var(--bng-orange-300);
          --bng-input-bar-track: var(--bng-orange-700);
        }

      .tile-grid {
        pointer-events: none;
        display: grid;
        grid-template-columns: repeat(12, minmax(0, 1fr));
        grid-auto-rows: 1fr;
        grid-auto-flow: dense;
        gap: 0.25em;
        padding: 0.25em;
        align-items: stretch;
        justify-items: stretch;
      }

      // .tile-grid .tile-grid-item {
      //   box-sizing: border-box;
      //   width: 100%;
      //   aspect-ratio: auto;
      //   min-width: 0;
      //   min-height: 0;
      //   overflow: visible;
      //   display: block;
      //   height: auto;
      //   // neutralize any button-level margins that could cause overlap
      //   --bng-button-custom-margin: 0;
      // }
    }

    .binding-row {
      //box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.25);
      // border-bottom: 1px solid rgba(var(--bng-cool-gray-400-rgb), 0.5);
      max-width: unset;
      justify-content: flex-end;
      font-size: 1em;
      flex-direction: row;
      padding: 0.125em 0.25em 0.125em 0.25em;
      gap: 0.5em;
      margin: 0;
      display: flex;
      border-radius: 0;
      align-items: flex-start;
      text-shadow: 0 0 4px rgba(var(--bng-off-black-rgb), 0.15);
      transform-origin: center;
      flex: 0 0 auto;

      --bng-color-text: var(--bng-off-white-brighter);

      /* Preserve previous accent="text" visuals while using accent="custom" */
      --bng-button-custom-margin: 0;
      --bng-button-custom-border-radius: 0 0 0 0;
      --bng-button-custom-enabled: var(--bng-cool-gray-850);
      --bng-button-custom-enabled-opacity: 0.01;
      --bng-button-custom-hover: var(--bng-orange-400);
      --bng-button-custom-hover-opacity: 0.5;
      --bng-button-custom-active: var(--bng-cool-gray-850);
      --bng-button-custom-active-opacity: 0.01;
      --bng-button-custom-disabled: var(--bng-cool-gray-850);
      --bng-button-custom-disabled-opacity: 0.01;

      &.no-hover {
        pointer-events: none;
      }

      &:focus,
      // &:focus-visible,
      &.focus-visible {
        &::before {
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          border-radius: 0.125em;
        }
      }

      // Alternating background colors for buttons (counting from bottom)

      // Make constant actions more transparent
      &.is-constant {
        --bng-button-custom-enabled-opacity: 0.01;
      }

      :deep(.background) {
        border-radius: 0;
      }
      .label-column {
        flex: 0 1 auto;
        text-align: right;
        display: flex;
        align-items: flex-start;
        line-height: 1.25em;
        min-height: 1.75em;
        padding-top: 0.125em;
        .label-text {
          display: inline-block;
          padding-bottom: 0.125em;
          padding-left: 0.25em;
          padding-right: 0.25em;
          border-radius: 0.125em;
        }
      }
      &.is-faded {
        --bng-button-custom-enabled-opacity: 0.01;
        --bng-button-custom-disabled-opacity: 0.01;
        text-shadow: 0 0 4px rgba(var(--bng-off-black-rgb), 0.1);
        .label-column {
          .label-text {
            background: rgba(var(--bng-cool-gray-850-rgb), 0.05);
          }
        }
        .binding-column {
          .binding-wrap {
            background: rgba(var(--bng-cool-gray-850-rgb), 0.05);
          }
          // :deep(.bng-binding-icon) {
          //   background: radial-gradient(circle at 50% 50%, rgba(var(--bng-cool-gray-850-rgb), 0.05) 0%, rgba(var(--bng-cool-gray-850-rgb), 0) 175%);
          //   border-radius: 0.125em;
          // }
        }
      }

      .binding-column {
        display: flex;
        flex-flow: row wrap;
        align-items: center;
        justify-content: flex-start;
        min-height: 1.75em;
        gap: 0.125em;
        flex: 0 1 auto;
        max-width: 8em;
        min-width: 4em;
        // :deep(.bng-binding-icon) {
        //   background: radial-gradient(circle at 50% 50%, rgba(var(--bng-cool-gray-850-rgb), 0.5) 0%, rgba(var(--bng-cool-gray-850-rgb), 0) 175%);
        //   border-radius: 0.125em;
        // }

        .binding-wrap {
          background: rgba(var(--bng-cool-gray-850-rgb), 0.5);
          border-radius: 0.125em;
        }
      }

        // Vehicle-specific row styling
        &.vehicle-specific {
          // Label color based on status
          &.vehicle-status-enabled {
            --bng-icon-color: var(--bng-orange-300);
            --bng-button-custom-enabled: var(--bng-cool-gray-800);
            --bng-button-custom-enabled-opacity: 1;
            --bng-button-custom-border-enabled: var(--bng-cool-gray-700);
            .label-column {
              color: var(--bng-orange-300);
              font-weight: 600;
            }
          }

          &.vehicle-status-default {
            --bng-icon-color: var(--bng-off-white-brighter);
            .label-column { color: var(--bng-off-white-brighter); }
          }

          &.vehicle-status-inactive {
            --bng-icon-color: var(--bng-cool-gray-100);
            .label-column { color: var(--bng-cool-gray-100); }
          }
        }
    }

    .modifier-bindings {
      display: flex;
      flex-direction: row;
      align-items: stretch;
      justify-content: stretch;
      gap: 0;
      border-radius: var(--bng-corners-2);
      overflow: hidden;
      min-height: 2em;
      min-width: 20em;
      background: rgba(var(--bng-cool-gray-700-rgb), 0.8);

    }
  }

  .bottom-left-button {
    height: 1.5em;
    width: 1.5em;
    min-width: 1.5em;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 1.5em;
    height: auto;
  }

  .bottom-left-lock {
    font-size: 1em;
  }
}
</style>
