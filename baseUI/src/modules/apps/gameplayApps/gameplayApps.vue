<template>
  <div class="gameplay-apps">
    <!-- Show each app individually based on visibility -->
    <component
      v-show="isPointsBar"
      class="app"
      :is="pointsBar"
      v-bind="$attrs"
    />
    <component
      v-show="isRally"
      class="app rally"
      :is="rallyVisualPacenotes"
      v-bind="$attrs"
    />
    <component
      v-show="isDrift"
      class="app"
      :is="driftCurrentDrift"
      :showFlash="false"
      v-bind="$attrs"
    />
    <component
      v-show="isDragStaging"
      class="app"
      :is="dragRaceTree"
      :showFlash="false"
      v-bind="$attrs"
    />

    <component
      v-show="isFlashMessage"
      class="app flash-message"
      :is="simpleFlashMessage"
      :message-source="gameplayAppsFlashMessage"
      v-bind="$attrs"
    />

    <component
      v-show="isCountdown"
      class="countdown"
      :is="countdown"
      v-bind="$attrs"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { rallyVisualPacenotes, driftCurrentDrift, dragRaceTree, countdown, simpleFlashMessage, pointsBar } from '@/modules/apps'
import { useEvents } from '@/services/events'
import { useBridge } from '@/bridge'
const { lua } = useBridge()

const events = useEvents()

// Dedicated message source for gameplay apps flash messages
const gameplayAppsFlashMessage = 'GameplayAppsFlashMessage'

// Individual app visibility states
const isDrift = ref(false)
const isDragStaging = ref(false)
const isRally = ref(false)
const isPointsBar = ref(false)
const isFlashMessage = ref(false)
const isCountdown = ref(false)

// Map app IDs to their reactive states
const appStates = {
  drift: isDrift,
  drag: isDragStaging,
  rally: isRally,
  pointsBar: isPointsBar,
  flashMessage: isFlashMessage,
  countdown: isCountdown
}

const setAppVisibility = (data) => {
  // Handle individual app visibility updates
  if (data.appId && appStates[data.appId]) {
    appStates[data.appId].value = data.visible
  }

  // Handle bulk operations
  if (data.hideAll) {
    Object.values(appStates).forEach(state => state.value = false)
  }
}

const loadInitialVisibility = async () => {
  try {
    // Get current visibility state for all apps
    const visibleApps = await lua.ui_gameplayAppContainers.getVisibleApps('gameplayApps')

    // Reset all apps first
    Object.values(appStates).forEach(state => state.value = false)

    // Set visible apps
    if (Array.isArray(visibleApps)) {
      visibleApps.forEach(appId => {
        if (appStates[appId]) {
          appStates[appId].value = true
        }
      })
    }
  } catch (error) {
    // Silently ignore; backend is source of truth and will emit events on state changes
  }
}

onMounted(() => {
  // Listen to app visibility events only (backend is source of truth)
  events.on('setGameplayAppVisibility', setAppVisibility)
  lua.ui_gameplayAppContainers.onGameplayAppContainerMounted()
  // Load initial visibility state
  loadInitialVisibility()
})

onUnmounted(() => {
  events.off('setGameplayAppVisibility', setAppVisibility)
  lua.ui_gameplayAppContainers.onGameplayAppContainerUnmounted()
})

</script>

<style lang="scss" scoped>
.gameplay-apps {
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 100%;
  height: 100%;
  >* {
    flex: 0 0 auto;
    width: 100%;
    max-width: 36rem;
  }
  .rally {
    height: auto;
  }
}
</style>
