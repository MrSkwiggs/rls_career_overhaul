<template>
  <div class="layers-preview" :disabled="disabled">
    <div class="item-navigation navigation-up" @click="store.setActiveLayerDirection(-1)">
      <BngIcon :type="icons.arrowSmallUp" />
      <BngBinding action="activate_previous_layer" deviceMask="xinput" class="navigation-icon" />
    </div>
    <div ref="scroller" class="preview-scroller">
      <div
        v-for="layer in store.appliedLayers"
        :ref="el => setTileRef(layer.uid, el)"
        :key="layer.uid"
        :class="{
          active: store.activeLayerUid === layer.uid,
        }"
        class="layer-item">
        <DecalPreviewTile
          v-if="store.activeLayerUid === layer.uid"
          v-bng-popover:right.click="'context-menu'"
          class="preview-img"
          :textureImage="layer.preview"
          :textureColor="layer.color" />
        <DecalPreviewTile v-else class="preview-img" :textureImage="layer.preview" :textureColor="layer.color" @click="() => onLayerClicked(layer)" />
        <BngIcon v-if="store.activeLayerUid === layer.uid" class="contextmenu-icon" :type="icons.edit" />
      </div>
    </div>
    <div class="item-navigation navigation-down" @click="store.setActiveLayerDirection(1)">
      <BngBinding action="activate_next_layer" deviceMask="xinput" class="navigation-icon" />
      <BngIcon :type="icons.arrowSmallDown" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue"
import { BngBinding, BngIcon, icons } from "@/common/components/base"
import { vBngPopover } from "@/common/directives"
import { useLayerSettingsStore } from "@/modules/liveryEditor/stores"
import DecalPreviewTile from "../DecalPreviewTile.vue"

const props = defineProps({
  contextMenuName: String,
})

const store = useLayerSettingsStore()

const scroller = ref(null)
const tiles = ref({})

const disabled = computed(() => store.requestApplyActive || store.reapplyActive)

const onLayerClicked = async layer => {
  if (store.activeLayerUid === layer.uid && store.appliedLayers.length > 1) {
  } else {
    await store.setActiveLayer(layer.uid)
  }
}

watch(
  () => store.activeLayerUid,
  layerUid => {
    if (!layerUid) return
    scrollTo(layerUid)
  }
)

function setTileRef(layerUid, el) {
  tiles.value[layerUid] = el
}

function scrollTo(layerUid) {
  const tileEl = tiles.value[layerUid]

  if (!tileEl) return

  const scrollerOffsetBottom = scroller.value.offsetTop + scroller.value.offsetHeight
  const scrollerOffsetTop = scroller.value.offsetTop + scroller.value.scrollTop
  const tileElOffsetBottom = tileEl.offsetTop + tileEl.offsetHeight
  const overflowsTop = tileEl.offsetTop < scrollerOffsetTop
  const overflowsBottom = tileEl.offsetTop + tileEl.offsetHeight > scrollerOffsetBottom

  if (!overflowsTop && !overflowsBottom) return

  window.requestAnimationFrame(() => {
    if (overflowsTop) {
      scroller.value.scrollBy({
        top: -(scrollerOffsetTop - tileEl.offsetTop),
      })
    } else if (overflowsBottom) {
      scroller.value.scrollTop = tileElOffsetBottom - scrollerOffsetBottom
    }
  })
}
</script>

<style lang="scss" scoped>
.layers-preview {
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  border-radius: var(--bng-corners-2);
  overflow-y: hidden;

  &[disabled="true"] {
    pointer-events: none;
    opacity: 0.7;
    cursor: default;
  }

  > .preview-scroller {
    flex-grow: 1;
    overflow-y: auto;
    overflow-x: hidden;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .item-navigation {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    justify-content: center;
    width: 100%;
    background: rgba(0, 0, 0, 0.5);
    cursor: pointer;

    &.navigation-up {
      .navigation-icon {
        margin-top: -0.65rem;
        padding-bottom: 0.65rem;
      }
    }

    &.navigation-down {
      .navigation-icon {
        margin-bottom: -0.35rem;
        padding-top: 0.35rem;
      }
    }
  }

  .layer-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 6rem;
    width: 6rem;
    cursor: pointer;
    border-left: 0.25rem solid var(--bng-cool-gray-650);

    &:not(:last-child) {
      margin-bottom: 0.25rem;
    }

    &.active {
      border-left-color: var(--bng-orange-400);

      &:hover {
        &::before {
          content: "";
          display: inline-block;
          position: absolute;
          top: 0;
          bottom: 0;
          right: 0;
          left: 0;
          background: var(--bng-cool-gray-600);
          opacity: 0.9;
          z-index: 1;
          pointer-events: none;
        }

        .preview-img {
          opacity: 0.8;
        }

        .contextmenu-icon {
          display: inline-block;
          pointer-events: none;
        }
      }
    }

    > .contextmenu-icon {
      display: none;
      position: absolute;
      // color: var(--bng-add-red-600);
      z-index: 1;
    }

    .preview-img {
      height: 100%;
      width: 100%;
    }
  }

  > .add-item {
    height: 6rem;
    width: 6rem;
    // margin-right: 0 !important;
    // margin-bottom: 0.5rem;

    &.cancel {
      background: var(--bng-add-red-600);
    }
  }

  .layer-context-menu {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 12rem;
    width: 12rem;
  }
}
</style>
