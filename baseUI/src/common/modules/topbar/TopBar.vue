<template>
  <div v-show="visible" v-bng-blur class="topbar">
    <div class="topbar-section topbar-left">

      <BngButton
        v-if="gameState.isInGame"
        track-ignore
        accent="custom"
        class="topbar-button"
        bng-no-nav="true"
        tabindex="-1"
        v-bng-tooltip:right="'Back to gameplay'"
        @click="onContinue"
      >
        <BngIcon :type="icons.play" />
        <BngBinding ui-event="menu" controller />
      </BngButton>

      <BngButton
        track-ignore
        accent="custom"
        class="topbar-button back-button"
        bng-no-nav="true"
        tabindex="-1"
        v-bng-tooltip:right="'Back one level'"
        @click="onBack"
      >
        <BngIcon :type="icons.undo" />
        <BngBinding ui-event="back" controller v-show="showBackBinding" />
      </BngButton>

    </div>
    <div class="topbar-section topbar-center">
      <BngOverflowContainer
        v-show="items.length > 0"
        ref="overflowContainer"
        class="topbar-overflow-container"
        use-bindings-only
        :show-bindings="showTabBindings"
      >
        <TopBarItem v-for="item in items" :key="item.id" :icon="item.icon" :label="item.label" @click="onItemClicked(item)" />
      </BngOverflowContainer>
    </div>
    <div ref="pauseButtonTarget" class="topbar-section topbar-right"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue"
import { storeToRefs } from "pinia"
import { useTopBar } from "@/services/topBar"
import { BngButton, BngOverflowContainer, BngIcon, BngBinding, icons } from "@/common/components/base"
import { vBngBlur, vBngTooltip } from "@/common/directives"
import TopBarItem from "./components/TopBarItem.vue"

const topBar = useTopBar()
const { visible, items, activeItem, gameState } = storeToRefs(topBar)

const overflowContainer = ref(null)
const pauseButtonTarget = ref(null)

const showTabBindings = ref(true)
const showBackBinding = ref(true)

const onItemClicked = item => {
  if (activeItem.value === item.id) return
  activeItem.value = item.id
  topBar.selectEntry(item.id)
}

const backStack = new Map()
let customBack = null
function setBack(id, fn) {
  if (!id)
    throw new Error(
      "Usage: " +
        "TopBar.setBack(id, [fn]), where `id` is your unique id and `fn` is a custom back function " +
        "that will fire and expected to return `true` or `false` (undefined return means `true`), " +
        "which will dis-/allow the base back functionality."
    )
  if (typeof fn === "function") {
    backStack.set(id, fn)
  } else {
    backStack.delete(id)
  }
  customBack = Array.from(backStack.values()).at(-1) || null
}

const onBack = () => {
  let res = customBack?.()
  if (typeof res === "undefined") res = true

  // res && window.globalAngularRootScope?.$broadcast("MenuToggle")

  // TODO: hack for now to go to play state if pressing back/continue
  if (!res) return
  if (gameState.isInGame) window.bngVue.gotoGameState("play")
  else window.globalAngularRootScope?.$broadcast("MenuToggle")
}

const onContinue = () => {
  window.bngVue.gotoAngularState("play")
}

// TODO: (This will likely be needed to be fixed in ui scoping) BngOverflowContainer doesn't fire if the route is angular
// With tab handlers in global handlers, changing active item fires twice due to global handler and the itemClicked from BngOverflowContainer when in vue route
watch(
  () => activeItem.value,
  val => {
    if (activeItem.value !== null && items.value.length > 0) {
      const idx = items.value.findIndex(item => item.id === val)
      overflowContainer.value.activate(idx)
    } else {
      overflowContainer.value.deactivate()
    }
  }
)

defineExpose({
  pauseButtonTarget: computed(() => (visible.value ? pauseButtonTarget.value : null)),
  setBack,
  showTabBindings,
  showBackBinding,
})

onMounted(() => {})

onUnmounted(() => {})
</script>

<style lang="scss" scoped>
$background: rgba(0, 0, 0, 0.6);
$text-color: var(--bng-off-white);
$height: 2.9em;

$active-background: var(--bng-orange-400);
$active-text-color: var(--bng-off-white);

$hover-background: rgba(0, 0, 0, 0.6);
$hover-border-color: var(--bng-orange-400);

.topbar {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  top: 0;
  left: 0;
  width: 100%;
  max-height: 2.5em;
  height: 2.5em;
  background-color: $background;
  .topbar-button {
    --bng-button-min-width: 2em;
    --bng-button-custom-margin: 0;

    /* ACCENTS.custom variables pre-populated to mimic ACCENTS.secondary */
    --bng-button-custom-enabled: var(--bng-ter-blue-gray-600);
    --bng-button-custom-hover: var(--bng-ter-blue-gray-550);
    --bng-button-custom-active: var(--bng-ter-blue-gray-800);
    --bng-button-custom-disabled: var(--bng-cool-gray-800);

    --bng-button-custom-enabled-opacity: 0.8;
    --bng-button-custom-hover-opacity: 1;
    --bng-button-custom-active-opacity: 1;
    --bng-button-custom-disabled-opacity: 0.25;

    --bng-button-custom-border-radius: 0;

    align-self: stretch;
    align-items: center;
    gap: 0.25em;

    &.back-button {
      --bng-button-custom-enabled-opacity: 0;
    }
  }
}

.topbar-section {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 1 auto;
  height: 100%;
  overflow: hidden;
  &.topbar-left,
  &.topbar-right {
    flex: 1 1 auto;
  }

  &.topbar-left {
    justify-content: flex-start;
  }
  &.topbar-right {
    justify-content: flex-end;
  }

  &.topbar-center {
    flex: 0 0 auto;
  }
}


.topbar-overflow-container {
  width: 100%;
  height: 100%;
  background-color: transparent;

  :deep() {
    .scroll-container {
      height: 100%;
      padding-top: 0;
      padding-bottom: 0;
    }
  }
}

.topbar-item {
  display: flex;
  flex-wrap: nowrap;
  justify-content: stretch;
  align-items: center;
  height: 100%;
  color: $text-color;
  white-space: nowrap;
  cursor: pointer;

  &:not(:last-child) {
    margin-right: 0.125em;
  }

  &[active] {
    background-color: $active-background;
    color: $active-text-color;
  }
}

.topbar-item-text {
  font-weight: 600;
}

.topbar-item-icon {
  margin-right: 0.25em;
}
</style>
