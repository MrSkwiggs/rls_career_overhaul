<template>
  <div class="layer-tile" @mouseover="isHovered = true" @mouseleave="isHovered = false">
    <div class="layer-content">
      <slot name="content">
        <div class="layer-name">
          {{ layer.name }}
        </div>
        <div v-if="forceShowActions || !layer.enabled" class="layer-actions">
          <BngBinding v-if="forceShowActions" :track-ignore="true" uiEvent="action_2" deviceMask="xinput" />
          <BngButton accent="outlined" @click="$emit('enableClicked')" :icon="layer.enabled ? icons.eyeSolidOpened : icons.eyeSolidClosed" />
        </div>
      </slot>
    </div>
    <div class="layer-preview">
      <div v-if="layer.type === 1" class="fill-preview" :style="{ '--layer-color': toRgba255Styles(layer.color) }"></div>
      <div v-else-if="layer.type === 3" class="group-preview">
        <BngIcon :type="icons.group" />
      </div>
      <DecalPreviewTile v-else-if="layer.type === 0" :textureImage="layer.preview" :textureColor="layer.color" />
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { BngBinding, BngButton, BngIcon, icons } from "@/common/components/base"
import DecalPreviewTile from "@/modules/liveryEditor/components/DecalPreviewTile.vue"

const props = defineProps({
  layer: Object,
  isTargeted: Boolean, // Not explicityly selected but is hovered by controller and possibly target for actions
  forceShowActions: Boolean,
  disableMoveUp: Boolean,
  disableMoveDown: Boolean,
})

defineEmits(["lockClicked", "hideClicked", "moveClicked", "enableClicked"])

const isHovered = ref(false)

const toRgba255Styles = colors => `rgba(${colors[0] * 255}, ${colors[1] * 255}, ${colors[2] * 255}, ${colors[3]})`
</script>

<style lang="scss" scoped>
.layer-tile {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  color: white;
  cursor: pointer;

  > .layer-content {
    display: flex;
    align-items: baseline;
    overflow: hidden;
    flex-grow: 1;

    .layer-name {
      flex-shrink: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .layer-actions {
      display: flex;
      align-items: center;
      flex: 1 0 auto;
      // padding: 0 0.25rem;
      // min-height: 4.7rem;

      // > button {
      //   margin-left: 0;
      // }

      // > .move-actions {
      //   display: flex;
      //   flex-direction: column;
      //   align-items: center;
      //   justify-content: space-between;
      //   padding: 0 0.5rem;

      //   > .action-item {
      //     cursor: pointer;
      //   }

      //   > .disabled {
      //     color: var(--bng-cool-gray-400);
      //     cursor: default;
      //   }
      // }
    }
  }

  > .layer-preview {
    position: relative;
    width: 4rem;
    height: 4rem;
    min-width: 4rem;
    min-height: 4rem;

    > .fill-preview {
      height: 100%;
      background: var(--layer-color);
    }

    > .group-preview {
      height: 100%;
      font-size: 2rem;
    }
  }
}
</style>
