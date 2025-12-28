<template>
  <!-- Fix warning on binding items to dynamic components -->
  <div>
    <BngButton v-bng-popover:bottom.click="'camera-popovermenu'" :icon="currentCamera.icon" :accent="ACCENTS.secondary">
      <!-- <BngIcon :type="currentCamera.icon" /> -->
      <span>{{ currentCamera.label }}</span>
      <BngBinding :uiEvent="CONTROLLER_CAMERA_BINDING" deviceMask="xinput" />
    </BngButton>
    <BngPopoverContent name="camera-popovermenu" @show="expand = true" @hide="expand = false">
      <div class="camera-popovermenu">
        <BngImageTile
          v-for="cameraItem in CAMERA_BUTTONS"
          :key="cameraItem.value"
          :label="cameraItem.label"
          :icon="cameraItem.icon"
          :class="{ active: cameraItem.value === currentCamera.value }"
          @click="onCameraViewClicked(cameraItem.value)" />
      </div>
    </BngPopoverContent>
  </div>
</template>

<script>
const CONTROLLER_CAMERA_BINDING = "rotate_h_cam"
const CAMERA_BUTTONS = [
  {
    label: "Right",
    icon: icons.cameraSideRight,
    value: "right",
  },
  {
    label: "Front",
    icon: icons.cameraFront1,
    value: "front",
  },
  {
    label: "Left",
    icon: icons.cameraSideLeft,
    value: "left",
  },
  {
    label: "Back",
    icon: icons.cameraBack1,
    value: "back",
  },
  {
    label: "Top Right",
    icon: icons.cameraTop1,
    value: "topright",
  },
  {
    label: "Top Left",
    icon: icons.cameraTop1,
    value: "topleft",
  },
  {
    label: "Top Front",
    icon: icons.cameraTop1,
    value: "topfront",
  },
  {
    label: "Top Back",
    icon: icons.cameraTop1,
    value: "topback",
  },
]
</script>

<script setup>
import { computed, ref } from "vue"
import { BngPopoverContent, BngImageTile, BngButton, BngIcon, icons, ACCENTS, BngBinding } from "@/common/components/base"
import { vBngPopover } from "@/common/directives"
import { useLiveryEditorStore } from "@/modules/liveryEditor/stores"
import { usePopover } from "@/services/popover"

const store = useLiveryEditorStore()
const popover = usePopover()

const expand = ref(false)
const currentCamera = computed(() => {
  if (store.cameraView) {
    const curr = CAMERA_BUTTONS.find(x => x.value === store.cameraView)
    if (curr) return curr
  }
  return { icon: icons.movieCamera, label: "View" }
})

const onCameraViewClicked = view => {
  popover.hide("camera-popovermenu")
  store.setOrthographicView(view)
}
</script>

<style scoped lang="scss">
.camera-popovermenu {
  display: flex;
  flex-wrap: wrap;
  max-width: 34.5rem;
  margin-bottom: -0.25rem;
  margin-right: -0.5rem;
  padding: 0.25rem;

  :deep(.tile) {
    margin-bottom: 0.5rem;
    margin-right: 0.5rem;

    &.active {
      background: var(--bng-orange-400) !important;
    }
  }
}
</style>
