<template>
  <div class="pause-button-wrapper">
    <Teleport :disabled="!teleportTo" :to="teleportTo">
      <BngButton
        v-show="showPauseButton"
        class="pause-button"
        :class="buttonState"
        :accent="ACCENTS.custom"
        no-sound
        @click="togglePause"
        bng-no-nav
        v-bng-tooltip.bottom="$tt('ui.inputActions.general.pause.title')"
      >
        <BngBinding class="pause-button-binding-bg" :action="'pause'" />
        <BngIcon class="pause-button-icon" :type="isPaused ? icons.pause : icons.play" />
      </BngButton>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { useRoute } from "vue-router"
import { BngBinding, BngButton, ACCENTS, BngIcon, icons } from "@/common/components/base"
import { useEvents } from "@/services/events"
import { lua } from "@/bridge"
import { useGameContextStore } from "@/services/gameContextStore"
import SysInfo from "@/services/sysInfo"
import { vBngTooltip } from "@/common/directives"

defineProps({
  teleportTo: [String, Object],
})

const route = useRoute()
const events = useEvents()
const gameContext = useGameContextStore()
const isGamePaused = ref(false)
const physicsMaybePaused = ref(false)
const replayActive = ref(false)
const replayPaused = ref(false)

// Listen for physics state changes
events.on("physicsStateChanged", (state) => {
  physicsMaybePaused.value = !state
})

// Listen for replay state changes
events.on("replayStateChanged", (core_replay) => {
  replayActive.value = core_replay.state === "playback"
  replayPaused.value = replayActive.value && core_replay.paused
})

// Listen for pause state changes
events.on("simTimeAuthority.pauseStateChanged", (data) => {
  isGamePaused.value = data.paused
})

const isInMenu = computed(() =>
  route.name?.startsWith("menu") &&
  !gameContext.activities?.length &&
  typeof SysInfo.gameState.value !== "undefined" &&
  SysInfo.gameState.value !== "loading"
)

const isPhysicsPaused = computed(() => physicsMaybePaused.value)

const isReplayPaused = computed(() => replayActive.value && replayPaused.value)

// Computed property to determine if pause button should be shown
const showPauseButton = computed(() =>
  isInMenu.value || isPhysicsPaused.value || isReplayPaused.value
)

const isPaused = computed(() =>
  isGamePaused.value || isPhysicsPaused.value || isReplayPaused.value
)

const buttonState = computed(() => {
  if (isInMenu.value && isPaused.value) return "menu-paused"
  if (isInMenu.value) return "menu"
  if (isPaused.value) return "paused"
  return "default"
})

const togglePause = () => {
  lua.simTimeAuthority.togglePause()
}
</script>

<style scoped lang="scss">
@use "sass:math";
@use "@/styles/modules/mixins" as *;

@keyframes pulseColor {
  0% { --pause-icon-color: var(--bng-off-white); }
  50% { --pause-icon-color: var(--bng-orange-200); }
  100% { --pause-icon-color: var(--bng-off-white); }
}

.pause-button-wrapper {
  position: absolute !important;
  top: 0;
  right: 0;
  z-index: var(--zorder_index_waiting_screen_icon);
}

.pause-button {
  // Default state (not in menu, not paused)
  --bng-button-custom-enabled: var(--bng-orange-500);
  --bng-button-custom-hover: var(--bng-orange-600);
  --bng-button-custom-active: var(--bng-orange-700);
  --bng-button-custom-disabled: var(--bng-cool-gray-400);
  --bng-button-custom-margin: 0.125rem;
  --bng-button-custom-border-radius: 0;
  --bng-button-min-width: 2.5rem;
  // Custom accent opacity variables
  --bng-button-custom-enabled-opacity: 1;
  --bng-button-custom-hover-opacity: 1;
  --bng-button-custom-active-opacity: 1;
  --bng-button-custom-disabled-opacity: 1;

  align-items: center !important;
  color: var(--bng-off-white);

  .pause-button-icon {
    padding: 0.0625em;
    border-radius: 0.25em;
    box-shadow: inset 0 0 0 0.0625em var(--pause-icon-color, var(--bng-off-white));
  }

  // Menu state
  &.menu {
    --bng-button-custom-enabled: var(--bng-ter-blue-gray-700);
    --bng-button-custom-hover: var(--bng-ter-blue-gray-600);
    --bng-button-custom-active: var(--bng-ter-blue-gray-800);
    --bng-button-custom-enabled-opacity: 1;
    --bng-button-custom-hover-opacity: 1;
    --bng-button-custom-active-opacity: 1;
  }

  // Paused state (not in menu)
  &.paused {
    --bng-button-custom-enabled: var(--bng-cool-gray-800);
    --bng-button-custom-hover: var(--bng-add-green-600);
    --bng-button-custom-active: var(--bng-add-green-700);
    --bng-button-custom-enabled-opacity: 0;
    --bng-button-custom-hover-opacity: 0.25;
    --bng-button-custom-active-opacity: 0.25;
    --bng-button-custom-border-radius: 0.5rem;
    & :deep(.bng-binding-icon) { text-shadow: 0 0 0.25em rgba(var(--bng-off-black-rgb), 0.5); }
    .pause-button-binding-bg {
      border-radius: 0.25em 0 0 0.25em;
      padding-right: 0.125em;
      // background-color: var(--bng-cool-gray-600);
    }
    .pause-button-icon {
      font-size: 2em;
      color: var(--pause-icon-color, var(--bng-off-white));
      animation: pulseColor 2s infinite;
    }
  }

  // Menu + Paused state
  &.menu-paused {
    --bng-button-custom-enabled: var(--bng-add-red-500);
    --bng-button-custom-hover: var(--bng-add-red-600);
    --bng-button-custom-active: var(--bng-add-red-700);
    --bng-button-custom-enabled-opacity: 1;
    --bng-button-custom-hover-opacity: 1;
    --bng-button-custom-active-opacity: 1;
    .pause-button-icon {
      color: var(--pause-icon-color, var(--bng-off-white));
      animation: pulseColor 2s infinite;
    }
  }
}
</style>
