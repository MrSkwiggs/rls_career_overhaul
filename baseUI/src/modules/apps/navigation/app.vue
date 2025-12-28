<template>
  <div
    ref="minimapContainerRef"
    class="minimap-container-wrapper"
    :class="{ ['police-' + additionalInfo.policeMode]: minimapMode === 'rect', round: minimapMode === 'circle' }"
    @click="updateDrawTransform"
  >
    <template v-if="minimapMode === 'rect'">
      <div class="minimap-container-additional-info top" v-if="hasTopInfo">
        <span v-if="additionalInfo.locationName">{{ additionalInfo.locationName }}</span>
        <!--
        <BngIcon class="minimap-container-additional-info-icon" type="mapWithEmitter" />
        -->
      </div>
      <div class="minimap-container" :class="{'round-bottom': !hasBottomInfo, 'round-top': !hasTopInfo}" ref="containerRef">
      </div>
      <div class="minimap-container-additional-info bottom" v-if="hasBottomInfo">
        <BngIcon v-if="additionalInfo.policeMode === 'visibleToPolice'" type="eyeSolidOpened" />
        <BngIcon v-if="additionalInfo.policeMode === 'hiddenFromPolice'" type="eyeSolidClosed" />
        <span v-if="additionalInfo.distToTarget">{{ additionalInfo.distToTarget }}</span>
        <BngIcon v-if="additionalInfo.distToTarget" class="" type="mapPoint" />
      </div>
    </template>
    <template v-else-if="minimapMode === 'circle'">
      <div class="minimap-container-additional-info top round" v-if="hasTopInfo" >
        <span v-if="additionalInfo.locationName">{{ additionalInfo.locationName }}</span>
      </div>
      <div class="minimap-container round" :class="{ ['police-' + additionalInfo.policeMode]: true }" ref="containerRef">
      </div>
      <div class="minimap-container-additional-info bottom round" v-if="hasBottomInfo">
        <BngIcon v-if="additionalInfo.policeMode === 'visibleToPolice'" type="eyeSolidOpened" />
        <BngIcon v-if="additionalInfo.policeMode === 'hiddenFromPolice'" type="eyeSolidClosed" />
        <span v-if="additionalInfo.distToTarget">{{ additionalInfo.distToTarget }}</span>
        <BngIcon v-if="additionalInfo.distToTarget" class="" type="mapPoint" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, inject, nextTick } from "vue"
import { useRoute } from "vue-router"
import { useBridge } from "@/bridge"
import { useEvents, useStreams } from "@/services/events"
import { popupsView } from "@/services/popup"
import { BngIcon, icons } from "@/common/components/base"
import { vBngOcclusionWatcher } from "@/common/directives"
import { loadingScreen } from "@/services/screenCover"
import logger from "@/services/logger"

const { lua } = useBridge()
const events = useEvents()
const route = useRoute()
const $globalStore = inject("$globalStore")

const uiVisible = ref(true)
const initialising = ref(false)
const initialised = ref(false)
const minimapMode = ref("circle")
const minimapContainerRef = ref(null)
const containerRef = ref(null)
const occlusionTop = ref(null)
const occlusionBottom = ref(null)
const resizeObserver = ref(null)

const mapMetrics = reactive({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  xRel: 0,
  yRel: 0,
  widthRel: 0,
  heightRel: 0
})


const allowedRoutes = ["/play", ""]
const showMinimap = computed(() =>
  uiVisible.value && // if UI visible
  !loadingScreen.shown && // if loading screen is not shown
  $globalStore.__uiAppsShown && // if UI apps are shown (from angular)
  !$globalStore.__introPopupShown && // if intro popup is not shown
  !popupsView.popups && // if no popups are visible
  !popupsView.activities && // if no activity screens are visible
  allowedRoutes.includes(route.path) // if current route is in allow-list above
)

const toggleOptions = () => lua.test_imguiMinimap.toggleOptions()

const additionalInfo = reactive({
  distToTarget: null,
  locationName: null,
  policeMode: "disabled",
})


const hasTopInfo = computed(() => !!additionalInfo.locationName)
const hasBottomInfo = computed(() => !!(additionalInfo.distToTarget || additionalInfo.policeMode === "visibleToPolice" || additionalInfo.policeMode === "hiddenFromPolice"))

watch(hasTopInfo, val => {
  if(showMinimap.value) requestAnimationFrame(updateDrawTransform)
})
watch(hasBottomInfo, val => {
  if(showMinimap.value) requestAnimationFrame(updateDrawTransform)
})


const transformUpdateAttempts = 15
let transformUpdateAttempt = 0

const minimapSize = ref("100%")
const minimapShift = ref("0px")
const squareSize = ref("100%")

// Function to set screen space coordinates
async function updateDrawTransform() {
  if (minimapMode.value === "circle" && minimapContainerRef.value) {
    const rect = minimapContainerRef.value.getBoundingClientRect()
    const size = Math.min(rect.width, rect.height)
    const sizepx = size + "px"
    if (minimapSize.value !== sizepx) {
      minimapSize.value = sizepx
      if (rect.width > rect.height) {
        minimapShift.value = -(rect.width - size) / 2 + "px"
      } else {
        minimapShift.value = "0px"
      }
      await nextTick()
    }
  }

  // we do this check here to update visuals without waiting for lua to load
  if (!initialised.value || !showMinimap.value || !containerRef.value) return

  const screen = {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
  }
  const rect = containerRef.value.getBoundingClientRect()

  // Add scroll offsets to get absolute screen coordinates
  mapMetrics.x = rect.left + screen.scrollX
  mapMetrics.y = rect.top + screen.scrollY
  mapMetrics.width = rect.width
  mapMetrics.height = rect.height

  // Calculate percentages
  mapMetrics.xRel = mapMetrics.x / screen.width
  mapMetrics.yRel = mapMetrics.y / screen.height
  mapMetrics.widthRel = mapMetrics.width / screen.width
  mapMetrics.heightRel = mapMetrics.height / screen.height

  // logger.debug("Screen metrics:", {
  //   absolute: { x: mapMetrics.x, y: mapMetrics.y, width: mapMetrics.width, height: mapMetrics.height },
  //   relative: { x: mapMetrics.xRel, y: mapMetrics.yRel, width: mapMetrics.widthRel, height: mapMetrics.heightRel }
  // })

  // check for allowed metrics
  const keys = ["xRel", "yRel", "widthRel", "heightRel"]
  if (keys.some(key => mapMetrics[key] < 0 || mapMetrics[key] > 1) || keys.every(key => mapMetrics[key] === 0)) {
    transformUpdateAttempt++
    if (transformUpdateAttempt < transformUpdateAttempts) {
      requestAnimationFrame(updateDrawTransform)
    } else {
      logger.warn(`Failed to update minimap draw transform after ${transformUpdateAttempts} frames`)
    }
    return
  }

  sendTransformToLua(true)
}

async function sendTransformToLua(show = true) {
  if (!await initMinimap()) return
  if (!showMinimap.value || !show) { // force hide in case of race condition
    lua.ui_apps_minimap_minimap.hide()
    return
  }
  // this must go first
  lua.ui_apps_minimap_minimap.setDrawTransform(mapMetrics.xRel, mapMetrics.yRel, mapMetrics.widthRel, mapMetrics.heightRel)
  // then we request the info
  minimapMode.value = await lua.ui_apps_minimap_minimap.getMode()
  lua.ui_apps_minimap_additionalInfo.requestAdditionalInfo()
}

async function initMinimap() {
  if (initialising.value) return false // helps against simultaneous calls
  if (!initialised.value) {
    initialising.value = true
    await Promise.all([
      lua.extensions.load("ui_apps_minimap_minimap"),
      lua.extensions.load("ui_apps_minimap_additionalInfo"),
    ])
    minimapMode.value = await lua.ui_apps_minimap_minimap.getMode()
    initialised.value = true
    initialising.value = false
  }
  return true
}

watch(showMinimap, val => {
  if (val) {
    updateDrawTransform()
  } else if (initialised.value) {
    sendTransformToLua(false)
  }
})

watch([initialised, containerRef], () => {
  updateDrawTransform()

  // Set up ResizeObserver when containerRef becomes available
  if (containerRef.value && !resizeObserver.value) {
    resizeObserver.value = new ResizeObserver(() => {
      updateDrawTransform()
    })
    resizeObserver.value.observe(containerRef.value)
  }
}, { immediate: true })

onMounted(() => {
  window.addEventListener("scroll", updateDrawTransform)
  window.addEventListener("resize", updateDrawTransform)
  events.on("onCefVisibilityChanged", visible => {
    // console.log("onCefVisibilityChanged", visible)
    uiVisible.value = visible
    nextTick(updateDrawTransform)
  })
  initMinimap()
})

onUnmounted(() => {
  const wasInitialised = initialised.value
  initialised.value = false

  //logger.debug("Unmounting MinimapVueSDF")
  window.removeEventListener("scroll", updateDrawTransform)
  window.removeEventListener("resize", updateDrawTransform)

  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
    resizeObserver.value = null
  }

  if (wasInitialised) sendTransformToLua(false)
})

useStreams(["minimap"], (streams) => {
  if(!streams.minimap) return

  additionalInfo.distToTarget = streams.minimap.distToTarget
  additionalInfo.locationName = streams.minimap.locationName
  additionalInfo.policeMode = streams.minimap.policeMode

})
</script>

<style scoped lang="scss">
.minimap-container-wrapper {
  width: 100%;
  height: 100%;
  color: white;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;

  // For rect mode, constrain the content to square dimensions
  &:not(.round) {
    max-width: v-bind(squareSize);
    max-height: v-bind(squareSize);
    width: v-bind(squareSize);
    height: v-bind(squareSize);
  }
}

.minimap-container {
  box-shadow: inset 0 0 10px 2px rgba(0, 0, 0, 0.55);
  background-color: rgba(0, 0, 0, 0.55); // Semi-transparent black background

  width: 100%;
  flex: 1 1 auto;
  position: relative;

  &.round {
    border-radius: 50%;
    width: auto;
    height: auto;
    max-width: calc(v-bind(minimapSize) - 1rem);
    max-height: calc(v-bind(minimapSize) - 1rem);
    aspect-ratio: 1 / 1;
  }

  &.round-bottom {
    border-radius: 0 0 0.5rem 0.5rem;
  }
  &.round-top {
    border-radius: 0.5rem 0.5rem 0 0;
  }
  display: flex;
}



.minimap-container-additional-info {
  flex: 0 0 auto;
  background-color: rgba(0, 0, 0, 0.69);
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  text-align: center;
  font-weight: 500;
  z-index: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &.invisible {
    opacity: 0.0;
  }

  &.top {
    border-top: none;
    border-radius: 0.5rem 0.5rem 0 0;
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;
  }
  &.bottom {
    border-radius: 0 0 0.5rem 0.5rem;
    border-bottom: none;
    padding-bottom: 0.5rem;
  }
  &.round {
    background-color: rgba(0, 0, 0, 0.6);
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    width: fit-content;
    box-shadow: inset 0 0 10px 2px rgba(0, 0, 0, 0.55);

    &.top {
      margin-bottom: 0.1rem;
    }
    &.bottom {
      margin-top: 0.1rem;
    }
  }

}
.minimap-container-additional-info-icon {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  color: white;
  cursor: pointer;
  opacity: 0.33;
  &:hover {
    opacity: 1;
  }
}


.police-visibleToPolice {
  animation: colorCycle 0.7s  infinite alternate ease-in-out;
}

@keyframes colorCycle {
  0% {
    box-shadow: inset 0 0 10px 5px rgba(255, 16, 16, 1);
    background-color: rgba(25, 0, 0, 0.55);
  }
  100% {
    box-shadow: inset 0 0 10px 5px rgba(16, 16, 255, 1);
    background-color: rgba(0, 0, 25, 0.55);
  }
}

.police-hiddenFromPolice {
  animation: colorCycleWeak 1.4s  infinite alternate ease-in-out;
}

@keyframes colorCycleWeak {
  0% {
    box-shadow: inset 0 0 7px 2px rgba(128, 16, 16, 1);
    background-color: rgba(5, 0, 0, 0.55);
  }
  100% {
    box-shadow: inset 0 0 7px 2px rgba(16, 16, 128, 1);
    background-color: rgba(0, 0, 5, 0.55);
  }
}
</style>