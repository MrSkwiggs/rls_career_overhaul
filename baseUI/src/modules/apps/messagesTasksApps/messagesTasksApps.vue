<template>
  <div class="messages-tasks-apps">

    <!-- Tasks app -->
    <component
      v-show="isTasks"
      class="app"
      :is="tasklist"
      v-bind="$attrs"
    />

    <!-- Messages app -->
    <component
      v-show="isMessages"
      class="app"
      :is="messages"
      v-bind="$attrs"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { messages, tasklist } from '@/modules/apps'
import { useEvents } from '@/services/events'
import { useBridge } from '@/bridge'

const { lua } = useBridge()
const events = useEvents()

// Individual app visibility states
const isMessages = ref(false)
const isTasks = ref(false)

// Map app IDs to their reactive states
const appStates = {
  messages: isMessages,
  tasks: isTasks,
}

const setAppVisibility = (data) => {
  // Handle individual app visibility updates
  if (data.appId && appStates[data.appId]) {
    appStates[data.appId].value = data.visible
  }

  // Handle bulk operations
  if (data.hideAll) {
    Object.values(appStates).forEach(state => {
      state.value = false
    })
  }
}

const loadInitialVisibility = async () => {
  try {
    // Get current visibility state for all apps
    const visibleApps = await lua.ui_messagesTasksAppContainers.getVisibleApps('messagesTasksApps')

    // Reset all apps first
    Object.values(appStates).forEach(state => {
      state.value = false
    })

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
  events.on('setMessagesTasksAppVisibility', setAppVisibility)
  lua.ui_messagesTasksAppContainers.onMessagesTasksAppContainerMounted()
  // Load initial visibility state
  loadInitialVisibility()
})

onUnmounted(() => {
  events.off('setMessagesTasksAppVisibility', setAppVisibility)
  lua.ui_messagesTasksAppContainers.onMessagesTasksAppContainerUnmounted()
})
</script>

<style lang="scss" scoped>
.messages-tasks-apps {
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 100%;
  height: 100%; /* fill the app frame so children can use 100% height */

  > * {
    width: 100%;
    max-width: 36rem;
  }

  > .app:first-child {
    flex: 0 0 auto;
  }

  > .app:last-child {
    flex: 1 1 auto;
  }

  /* Keep tasks using their own natural height */
  :deep(.tasks-container) {
    height: auto;
  }
}
</style>


