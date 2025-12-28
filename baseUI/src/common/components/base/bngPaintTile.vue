<template>
  <div
    ref="elCont"
    class="bng-paint-tile"
    :class="{
      'loading': isLoading && !hasRenderedOnce,
      'empty': isEmpty,
    }"
    v-bng-tooltip:[tooltipPosition]="$tt(tooltip.name) + (tooltip.subname ? ' - ' + $tt(...tooltip.subname) : '')"
    tabindex="0" bng-nav-item
    v-bng-on-ui-nav:ok.asMouse.focusRequired
    @click.stop="onContClick"
    @contextmenu.stop="onContRMB"
  >
    <canvas ref="elCanvas" :width="width" :height="height"></canvas>

    <template v-if="withAreas && paintAreas.length > 1">
      <img :usemap="`#${mapId}`" :src="emptyImage" alt="" />
      <map :name="mapId">
        <area
          v-for="(area, index) in paintAreas" :key="index"
          shape="poly"
          :coords="area.join(',')"
          @mouseover="onMouseOver(index)"
          @mouseleave="onMouseOver(-1)"
          @click.stop="onClick(index, $event)"
        />
      </map>
    </template>

    <div v-if="isEmpty || (isLoading && !hasRenderedOnce)" class="empty-indicator"></div>

    <BngPopoverMenu v-if="withMenu" ref="popMenu" :name="menuId" focus>
      <template v-if="paintNames.length > 1">
        <BngButton
          :accent="ACCENTS.menu"
          v-bng-on-ui-nav:ok.focusRequired.asMouse
          @click="onClick(-1, $event)"
        >{{ $tt("ui.color.paint.selectAll") }}</BngButton>
        <BngButton
          v-for="(paint, index) in paintNames" :key="index"
          :accent="ACCENTS.menu"
          v-bng-on-ui-nav:ok.focusRequired.asMouse
          @click="onClick(index, $event)"
        >{{ $tt(...paintNames[index].menu) }}{{ paintNames[index].menuAdd ? ": " + paintNames[index].menuAdd : "" }}</BngButton>
      </template>
      <BngButton
        v-else
        :accent="ACCENTS.menu"
        v-bng-on-ui-nav:ok.focusRequired.asMouse
        @click="onClick(0, $event)"
      >{{ $tt("ui.color.paint.select") }}</BngButton>
      <template v-if="customMenu?.length > 0">
        <BngButton
          v-for="(item, index) in customMenu" :key="index"
          :accent="ACCENTS.menu"
          v-bng-on-ui-nav:ok.focusRequired.asMouse
          @click="item.click($event)"
        >{{ $tt(item.label) }}</BngButton>
      </template>
    </BngPopoverMenu>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue"
import { BngPopoverMenu, BngButton, ACCENTS } from "@/common/components/base"
import { vBngTooltip, vBngOnUiNav } from "@/common/directives"
import { usePopover } from "@/services/popover"
import { uniqueId } from "@/services/uniqueId"
import { emptyImage } from "@/utils"
import { usePaintPreviews } from "@/services/paint-previews"

const popover = usePopover()

const props = defineProps({
  paint: [String, Array, Object], // single paint or array of paints (multipaint) - it will be auto-detected from the content
  paintId: String,
  vehicleName: String,
  paintName: String,
  paintNames: Array,
  disabled: Boolean,
  tooltip: String,
  tooltipPosition: {
    type: String,
    default: "top",
  },
  size: {
    type: Number,
    default: null,
  },
  width: {
    type: Number,
    default: 64,
  },
  height: {
    type: Number,
    default: 64,
  },
  radialLight: Boolean,
  withAreas: Boolean,
  withMenu: Boolean,
  customMenu: Array, // array of strings or objects with .label and .action properties
})

const emit = defineEmits(["click", "menu-click"])

const mapId = uniqueId("paint-tile-map")
const menuId = uniqueId("paint-tile-menu")
const popMenu = ref(null)
const elCont = ref(null)
const elCanvas = ref(null)
const isLoading = ref(false)
const isEmpty = ref(false)
const hasRenderedOnce = ref(false)

const paintPreviews = usePaintPreviews()

const width = computed(() => props.size || props.width)
const height = computed(() => props.size || props.height)

const tileWidth = computed(() => `${width.value}px`)
const tileHeight = computed(() => `${height.value}px`)

const paints = computed(() => props.paint ? paintPreviews.toArray(props.paint) : [])
const isMultipaint = computed(() => paintPreviews.checkMultipaint(paints.value))

const paintNames = computed(() => {
  const len = props.paint?.length || 0
  if (len === 0) return []
  const res = Array.from({ length: len }).map((_, idx) => ({
    tooltip: ["ui.color.paint.unnamed", { index: idx + 1 }],
    menu: ["ui.color.paint.selectOne", { index: idx + 1 }],
    menuAdd: null,
  }))
  if (props.paintNames?.length > 0) {
    for (let i = 0; i < len; i++) {
      const name = props.paintNames[i]
      if (!name) continue
      res[i].tooltip = [name]
      res[i].menuAdd = name
    }
  }
  return res
})

const hoveredPaintIndex = ref(-1)
const onMouseOver = idx => hoveredPaintIndex.value = idx

const tooltip = computed(() => {
  const res = { name: props.tooltip || props.paintName }
  if (hoveredPaintIndex.value > -1 && paintNames.value[hoveredPaintIndex.value]) {
    res.subname = paintNames.value[hoveredPaintIndex.value].tooltip
  }
  return res
})

const customMenu = computed(() => {
  if (!props.customMenu || props.customMenu.length === 0) return null
  return props.customMenu.reduce((res, item, idx) => item ? [...res, {
    label: item.label || item,
    click: evt => {
      popMenu.value?.hide?.()
      nextTick(() => {
        if (item.action) item.action(props.paint, evt)
        else emit("menu-click", item.value || idx, props.paint, evt)
      })
    },
  }] : res, [])
})
const withMenu = computed(() => props.withMenu && (paintAreas.value.length > 1 || customMenu.value))

const opts = computed(() => ({
  paintId: props.paintId,
  vehicleName: props.vehicleName,
  paintName: props.paintName,
  width: width.value,
  height: height.value,
  radialLight: props.radialLight,
}))

const cacheKey = computed(() => {
  try {
    return paintPreviews.getCacheKey(opts.value)
  } catch (error) {
    return null
  }
})

const paintAreas = computed(() => {
  if (!props.paint || isEmpty.value) return []
  try {
    return paintPreviews.getAreas(opts.value)
  } catch (error) {
    return []
  }
})

const onContClick = evt => onClick(-1, evt)
const onContRMB = () => withMenu.value && openMenu()

function onClick(idx, evt) {
  popMenu.value?.hide?.()
  !props.disabled && emit("click", idx, props.paint, evt)
}

function openMenu() {
  if (!elCont.value || !popMenu.value) return
  popover.hideAll("paint-tile-menu")
  !props.disabled && popMenu.value.show(elCont.value)
}

async function renderPreview() {
  if (!cacheKey.value || !props.paint) {
    isEmpty.value = true
    hasRenderedOnce.value = false
    return
  }

  isLoading.value = true
  isEmpty.value = false

  try {
    const bmp = await paintPreviews.getPreview(paints.value, opts.value)
    if (elCanvas.value && bmp) {
      const ctx = elCanvas.value.getContext("2d")
      ctx.clearRect(0, 0, width.value, height.value)
      ctx.drawImage(bmp, 0, 0, width.value, height.value)
      hasRenderedOnce.value = true
    }
  } catch (error) {
    console.error("Failed to render preview", error)
    isEmpty.value = true
    hasRenderedOnce.value = false
  } finally {
    isLoading.value = false
  }
}

function checkEmpty() {
  if (!props.paint) {
    isEmpty.value = true
    hasRenderedOnce.value = false
    return true
  }
  if (isMultipaint.value) {
    // for multipaint, check if all paints are empty
    const allEmpty = paints.value.every(paintArray => !paintArray || paintArray.length === 0)
    isEmpty.value = allEmpty
    if (allEmpty) hasRenderedOnce.value = false
    return allEmpty
  }
  if (Array.isArray(paints.value) && paints.value.length === 0) {
    isEmpty.value = true
    hasRenderedOnce.value = false
    return true
  }
  isEmpty.value = false
  return false
}

watch(
  () => [paints.value, props.paintId, props.vehicleName, props.paintName, width.value, height.value, props.radialLight],
  () => {
    if (checkEmpty()) {
      isLoading.value = false
    } else {
      renderPreview()
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => props.withAreas,
  val => {
    if (!val) hoveredPaintIndex.value = -1
  }
)

let unsubscribeFromCacheClear = null
const outEvents = ["click", "contextmenu", "uinav-focus"]
let listeningOutEvents = false

function outOfMenu(evt) {
  if (!popMenu.value || !popMenu.value.isShown()) return
  const el = popMenu.value.getElement()
  if (el && el.contains(evt.detail?.target || evt.target)) return
  nextTick(() => popMenu.value.hide?.())
}

watch(() => popover.popovers[menuId]?.show, val => {
  if (val) {
    if (!listeningOutEvents) {
      listeningOutEvents = true
      outEvents.forEach(evt => document.addEventListener(evt, outOfMenu))
    }
  } else {
    if (listeningOutEvents) {
      listeningOutEvents = false
      outEvents.forEach(evt => document.removeEventListener(evt, outOfMenu))
    }
  }
})

onMounted(() => {
  !checkEmpty() && renderPreview()
  unsubscribeFromCacheClear = paintPreviews.onCacheClear((type, key) => {
    if (type === "all" || (type === "single" && key === cacheKey.value)) {
      if (!checkEmpty() && hasRenderedOnce.value) renderPreview()
    }
  })
})

onUnmounted(() => {
  unsubscribeFromCacheClear?.()
  if (listeningOutEvents) {
    outEvents.forEach(evt => document.removeEventListener(evt, outOfMenu))
  }
})
</script>

<style lang="scss" scoped>
@use "@/styles/modules/mixins" as *;
@use "@/styles/modules/density" as *;

.bng-paint-tile {
  position: relative;
  display: inline-block;
  width: var(--tile-width, v-bind(tileWidth));
  height: var(--tile-height, v-bind(tileHeight));
  background-color: rgba(0, 0, 0, 0.1);
  cursor: pointer;

  > * {
    border-radius: $border-rad-1;
    overflow: hidden;
  }

  canvas {
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  &.loading {
    canvas {
      opacity: 0.5;
    }
  }

  &.empty {
    background-image: repeating-linear-gradient(
      -45deg,
      rgba(0, 0, 0, 0.0) 0px,
      rgba(0, 0, 0, 0.0) 8px,
      rgba(0, 0, 0, 0.2) 8px,
      rgba(0, 0, 0, 0.2) 16px
    );
  }
}

.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.empty-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  .empty-text {
    font-size: 0.7em;
    font-weight: bold;
    color: rgba(255, 255, 255, 0.6);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    white-space: nowrap;
  }
}
</style>
