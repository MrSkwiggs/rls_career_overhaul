<template>
  <BngList
    ref="gridListRef"
    class="grid-list" :layout="LIST_LAYOUTS.TILES" no-background
    big immediate :keep-alive="500"
    :title-width="20" :title-height="1.5" :title-margin="0.5"
    :tile-size-calc="tileSizeCalc"
  >
    <!-- NOTE: only vue components will be rendered correctly -->
    <template v-for="group in limitedGroups" :key="group.label">
      <GroupHeader v-if="group.label" :label="group.label" bng-list-title />
      <Tile
        v-for="tile in group.tiles"
        :key="tile.key"
        :tile="tile"
        :is-config="isConfig"
        :display-size="displaySize"
        :is-favourite="group.label === 'Favourites'"
        :tile-images-top-aligned="tileImagesTopAligned"
        @focus="focusItem(tile)"
        @click="selectItem(tile)"
        @dblclick="handleDoubleClick(tile)"
      />
    </template>
  </BngList>
</template>

<script setup>
import { ref, computed, provide, onMounted, onUnmounted } from "vue"
import { storeToRefs } from "pinia"
import { BngList, LIST_LAYOUTS } from "@/common/components/base"
import Tile from "./Tile.vue"
import GroupHeader from "./GroupHeader.vue"
import { lua } from "@/bridge"
import { debounce } from "@/utils/rateLimit"
import useControls from "@/services/controls"

const Controls = useControls()
const { showIfController } = storeToRefs(Controls)

const props = defineProps({
  autoFocusKey: {
    type: String,
    default: null,
  },
  activeItem: {
    type: Object,
    default: null,
  },
  groups: {
    type: Array,
    required: true,
  },
  isConfig: {
    type: Boolean,
    default: false,
  },
  displaySize: {
    type: String,
    default: "medium",
    validator: value => ["tiny", "small", "medium", "large", "huge", "list"].includes(value),
  },
  inDetails: {
    type: Boolean,
    default: false,
  },
  backendName: {
    type: String,
    default: "gridSelector",
  },
  tileImagesTopAligned: {
    type: Boolean,
    default: false
  },
  doubleClickOverride: {
    type: Function,
    default: null
  }
})

// autoFocusKey and activeItem are now passed as props

const emit = defineEmits(["select-item", "deselect-item", "focus-item"])

const gridListRef = ref()
const containerWidth = ref(0)
const baseFontSize = ref(16)

const tileSizeCalc = ctx => Tile.getSizeCalc(props.displaySize)(ctx)

// Calculate max tiles per group based on container width
const maxTilesPerRow = computed(() => {
  if (!containerWidth.value) return Infinity

  // Get tile dimensions from Tile.getSizeCalc (returns values in rem)
  const size = Tile.getSizeCalc(props.displaySize)({})
  // Convert rem to pixels: tile width + gap between tiles
  const tileWidthRem = size.width + size.margin
  const tileWidthPx = tileWidthRem * baseFontSize.value
  const tilesPerRow = Math.floor(containerWidth.value / tileWidthPx) || 1

  // For list mode, allow 2 rows of tiles
  const rowCount = props.displaySize === 'list' ? 2 : 1
  return tilesPerRow * rowCount
})

// Limit tiles in each group based on calculated max
const limitedGroups = computed(() => {
  return props.groups.map(group => ({
    ...group,
    tiles: group.isRecentGroup ? group.tiles.slice(0, maxTilesPerRow.value) : group.tiles
  }))
})

// Update container width and base font size
const updateContainerWidth = () => {
  if (gridListRef.value?.$el) {
    containerWidth.value = gridListRef.value.$el.clientWidth
    // Get the root font size for rem calculations
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)
    baseFontSize.value = rootFontSize || 16
  }
}

// Set up resize observer
let resizeObserver
onMounted(() => {
  updateContainerWidth()
  if (gridListRef.value?.$el) {
    resizeObserver = new ResizeObserver(debounce(updateContainerWidth, 100))
    resizeObserver.observe(gridListRef.value.$el)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

// this prevents extra updates
const gridSelectionState = computed(() => ({
  inDetails: props.inDetails,
  activeItemKey: props.activeItem?.key || null,
  autoFocusKey: props.autoFocusKey,
}))
provide("gridSelectionState", gridSelectionState)

// displaySize tile prop triggers a refresh, but if it won't do it - simply uncomment the next line
// watch(() => props.displaySize, () => nextTick(gridListRef.value?.refresh))

const focusItem = tile => {
  if (props.inDetails) return
  // console.log("focusItem", tile)
  if (showIfController.value)
    preselectItem(tile)
  emit("focus-item", tile)
}

const selectItem = tile => {
  preselectItem.cancel()
  // console.log("selectItem", tile)
  emit("select-item", tile)
}

const preselectItem = debounce(tile => emit("select-item", tile, false), 200)

const handleDoubleClick = async item => {
  console.log("handleDoubleClick", item)
  if (!item.doubleClickDetails) return
  try {
    if (props.doubleClickOverride) {
      props.doubleClickOverride(item)
    } else {
      await lua.ui_gridSelector.executeDoubleClick(props.backendName, item.doubleClickDetails)
    }
  } catch (error) {
    console.error("Failed to execute double click:", error)
  }
}
</script>

<style lang="scss" scoped>
.grid-list {
  width: 100%;
  height: 100%;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.1);

}
</style>
