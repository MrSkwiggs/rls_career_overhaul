import { ref, reactive, computed, watch, nextTick } from "vue"
import { sleep } from "@/utils"
import { useBridge } from "@/bridge"

// TODO: this should be the source of truth for the screen lock state once we make vue the main thing
export const screenLocked = computed(() => screenLockedState.value)

// informational
export const loadingScreen = reactive({
  active: false, // if loading screen is supposed to be visible
  visible: false, // if loading screen is actually visible
  fading: false, // if loading screen is currently fading in/out
  shown: false, // if loading screen is shown (including fade in/out)
})

const screenLockedState = ref(false)
let loadingScreenStateWatcher = null
let events

export function screenLock(lock = false) {
  lock = !!lock
  // if (screenLockedState.value === lock) return
  screenLockedState.value = lock
  const body = document.body
  if (body) {
    body.classList.toggle("screen-locked", lock)
  }
}

export async function startLoading(func) {
  screenLock(true)
  if (!events) events = useBridge().events
  events.emit("LoadingScreen", { active: true })
  await nextTick()
  setTimeout(() => func(), 500)
}

export function linkLoadingScreenState(state) {
  loadingScreenStateWatcher?.()
  loadingScreenStateWatcher = watch(
    [() => state.active, () => state.visible, () => state.fading, () => state.shown],
    ([active, visible, fading, shown]) => {
      loadingScreen.active = active
      loadingScreen.visible = visible
      loadingScreen.fading = fading
      loadingScreen.shown = shown
      screenLock(active)
    }
  )
}

export function waitForLoadingScreenFadeIn(timeout = 4000) {
  if (loadingScreen.visible && !loadingScreen.fading) {
    return
  }

  const fadeInPromise = new Promise(resolve => {
    const unwatch = watch(
      [() => loadingScreen.visible, () => loadingScreen.fading],
      ([visible, fading]) => {
        if (visible && !fading) {
          unwatch()
          resolve()
        }
      },
      { immediate: true }
    )
  })

  return Promise.race([fadeInPromise, sleep(timeout)])
}
