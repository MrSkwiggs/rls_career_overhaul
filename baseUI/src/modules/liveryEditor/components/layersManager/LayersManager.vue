<template>
  <div class="layers-manager">
    <div class="layers-manager-header">
      <slot name="header"> </slot>
    </div>
    <div v-if="layers" ref="layersScrollable" class="layers-scrollable" @focusout="handleFocusOut">
      <Tree
        v-model:expandedKeys="expandedKeys"
        v-model:selectedKeys="selectedKeys"
        :nodes="layers"
        :selectMode="rootStore.selectMode"
        keyName="id"
        class="layers-tree">
        <template #node="{ node, parentNode, expanded, selected, expand }">
          <div
            v-if="!node.hidden"
            v-bng-click="{
              clickCallback: () => onClickItem(node),
              holdCallback: () => setMultiSelect(node),
              repeatInterval: 0,
            }"
            @focusin.self="setFocusLayer(node)"
            v-bng-ui-nav-focus="isFocusFirstLayer && layers[0].uid === node.uid ? 0 : undefined"
            v-bng-focus-if="isFocusFirstLayer && layers[0].uid === node.uid"
            bng-nav-item
            v-bng-on-ui-nav:ok.asMouse.focusRequired
            class="layer-node">
            <LayerTile :layer="node" :forceShowActions="focusLayer && focusLayer.uid === node.uid" @enableClicked="() => toggleEnabled(node)" />
            <BngIcon
              v-if="node.children"
              :type="expanded ? icons.arrowSmallUp : icons.arrowSmallDown"
              class="expand-icon"
              @mousedown.stop=""
              @mouseup.stop=""
              @click.stop="expand" />
          </div>
        </template>
      </Tree>
    </div>
  </div>
</template>

<script>
export const VIEW_MODES = {
  DEFAULT: "default",
  COMPACT: "compact",
}
</script>

<script setup>
import { nextTick, ref, computed, watch } from "vue"
import { lua, useBridge } from "@/bridge"
import LayerTile from "./LayerTile.vue"
import { BngIcon, icons } from "@/common/components/base"
import { Tree } from "@/common/components/utility"
import { vBngOnUiNav, vBngClick, vBngUiNavFocus, vBngFocusIf } from "@/common/directives"
import { useLiveryEditorStore } from "@/modules/liveryEditor/stores"

const props = defineProps({
  layers: {
    type: Array,
    required: true,
  },
  view: {
    type: String,
    default: "default",
    validator(value) {
      return Object.values(VIEW_MODES).find(x => x === value)
    },
  },
})

const emit = defineEmits(["focusedLayer"])

const rootStore = useLiveryEditorStore()

const expandedKeys = ref([])
const selectedKeys = defineModel("selectedKeys")
const focusLayer = ref(null)
const layersScrollable = ref(null)
const isModifierOn = ref(false)
const isFocusFirstLayer = ref(false)

watch(
  () => rootStore.selectedLayers,
  () => {
    if (!rootStore.selectedLayers || rootStore.selectedLayers.length === 0) {
      rootStore.selectMode = "single"
    }
  }
)

watch(
  () => selectedKeys.value,
  (newValue, oldValue) => {
    if (!newValue || (newValue.length === 0 && oldValue && oldValue.length > 0)) {
      isFocusFirstLayer.value = true
    }
  }
)

const onModifiedAction = event => {
  isModifierOn.value = event.detail.value === 1
}

const setMultiSelect = async node => {
  if (rootStore.selectMode === "multi") return

  rootStore.selectMode = "multi"
  rootStore.toggleSelection(node.id, false)
}

const toggleEnabled = layer => {
  const res = lua.extensions.ui_liveryEditor_layerAction.performAction("enabled")
  res.then(luaRes => {
    layer.enabled = luaRes
  })
}

const onClickItem = node => {
  lua.extensions.ui_liveryEditor_selection.select(node.id, true)
  setFocusLayer(null)
}

async function moveOrder(event) {
  if (event.detail.value === -1) {
    await moveOrderDown(event)
  } else if (event.detail.value >= 0.999) {
    await moveOrderUp(event)
  }
}

async function moveOrderUp(ev) {
  if (focusedLayer.value && focusedLayer.value.order !== 1) {
    await rootStore.moveOrderUp(focusedLayer.value)
  }
  await nextTick()
  ev.srcElement.focus()
}

async function moveOrderDown(ev) {
  if (focusedLayer.value && focusedLayer.value.order < focusedLayer.value.siblingCount) {
    await rootStore.moveOrderDown(focusedLayer.value)
  }
  await nextTick()
  ev.srcElement.focus()
}

async function changeOrder(node, direction) {
  lastInteractedLayerId.value = node.id
  await rootStore.changeOrder(node, direction)
}

const setFocusedLayer = layer => {
  focusedLayerPath.value = layer.path
}

const setFocusLayer = layer => {
  if (isFocusFirstLayer.value) {
    isFocusFirstLayer.value = false
  }

  focusLayer.value = layer
  emit("focusedLayer", layer)
}

function expandFocusedLayer() {
  if (!focusedLayer.value || !focusedLayer.value.children || focusedLayer.value.children.length === 0) return

  const layerId = focusedLayer.value.id
  if (expandedKeys.value.includes(layerId)) {
    expandedKeys.value = expandedKeys.value.filter(x => x !== layerId)
  } else {
    expandedKeys.value.push(layerId)
  }
}

const handleFocusOut = event => {
  setFocusLayer(null)
}
</script>

<style lang="scss" scoped>
@use "@/styles/modules/mixins" as *;

$selectBackground: #ff6600;

@mixin resetLayerTreeStyles {
  list-style: none !important;
  margin-block: 0;
  padding-inline: 0;
}

.layers-manager {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  height: 100%;
  width: 100%;
  padding: 0.5rem;
  border-radius: var(--bng-corners-1);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  overflow-y: hidden;

  > .layers-manager-header {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    padding: 0.25rem;
  }

  > .layers-scrollable {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    padding: 0.25rem;
    overflow-y: auto;

    &::-webkit-scrollbar {
      display: none;
    }

    .layer-node {
      display: flex;
      align-items: center;
      width: 100%;
    }
  }
}

.layers-tree {
  :deep() {
    .layer-node {
      position: relative;
      width: 100%;
      padding: 0.125rem 0.125rem 0.125rem 1.7rem;
      margin-bottom: 0.35rem;
      border-radius: calc(var(--bng-corners-1) * 0.5);
      border-left: 0.25rem solid transparent;

      @include modify-focus(0, 0.25rem);

      &:focus::before {
        left: -0.5rem;
      }

      > .expand-icon {
        position: absolute;
        left: 0;
        cursor: pointer;

        &:hover {
          color: orange;
        }
      }

      > .layer-tile {
        width: 100%;
      }
    }

    [data-tree-node][data-tree-node-selected="true"] .layer-node {
      background: rgba($selectBackground, 0.5) !important;
    }

    // Expanded node and children nodes
    [data-tree-node][data-tree-node-expanded="true"],
    [data-tree-node][data-tree-node-expanded="true"] [data-tree-node] {
      > .layer-node {
        border-left-color: darkgrey;
        background-color: grey;
      }

      &[data-tree-node-selected="true"] .layer-node {
        border-left-color: $selectBackground !important;
      }
    }

    [data-tree-node-children] {
      margin-top: 0.35rem;
      padding-left: 1rem;
    }

    // Reset box shadow
    .layer-node {
      &:focus {
        box-shadow: none !important;
      }
    }
  }
}

.layer-node {
  &.highlight {
    background: rgba($selectBackground, 0.6);
  }

  &.glow {
    animation: glow 0.25s;
    animation-duration: 1s;
  }
}

@keyframes glow {
  0%,
  100% {
    background: transparent;
  }

  50% {
    background: rgba(#ff6600, 0.6);
  }
}
</style>
