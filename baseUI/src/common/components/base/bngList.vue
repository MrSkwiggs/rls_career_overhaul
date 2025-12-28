<template>
  <div class="list-container">
    <div class="list-toolbar" v-if="toolbar.enabled" v-show="toolbar.show">
      <Teleport v-if="toolbar.path" :disabled="!pathTarget" :to="pathTarget">
        <BngBreadcrumbs ref="elPath" :items="path" :limit="pathLimit" :blur="!noBackground" @click="itm => emit('pathClick', itm)" />
      </Teleport>
      <div v-else></div>
      <Teleport v-if="toolbar.layout" :disabled="!layoutSelectorTarget" :to="layoutSelectorTarget">
        <div class="list-layout-toggle">
          <BngButton
            :accent="layoutSelected === LIST_LAYOUTS.TILES ? ACCENTS.outlined : ACCENTS.text"
            :icon="icons.tiles"
            @click="layoutSelected = LIST_LAYOUTS.TILES" />
          <BngButton
            :accent="layoutSelected === LIST_LAYOUTS.LIST ? ACCENTS.outlined : ACCENTS.text"
            :icon="icons.listSmall"
            @click="layoutSelected = LIST_LAYOUTS.LIST" />
        </div>
      </Teleport>
    </div>
    <div
      ref="elCont"
      :class="{
        'list-content': true,
        'list-with-background': !noBackground,
        [`list-layout-${layoutSelected}`]: true,
        'list-item-width': !!tileWidth,
        'list-item-height': !!tileHeight,
        'list-item-margin': !!tileMargin,
        'list-title-width': !!titleWidth,
        'list-title-height': !!titleHeight,
        'list-title-margin': !!titleMargin,
        'list-big': bigmode.enabled,
        'list-scrolling': scrolling || bigmode.debounce === 0,
        'list-processing': processing,
      }"
      :style="{
        '--list-item-width': `${tileWidth}px`,
        '--list-item-height': `${tileHeight}px`,
        '--list-item-margin': `${tileMargin}px`,
        '--list-title-width': `${titleWidth}px`,
        '--list-title-height': `${titleHeight}px`,
        '--list-title-margin': `${titleMargin}px`,
        '--list-big-full': `${bigmode.full}px`,
      }"
      v-bng-blur="!noBackground"
      @scroll="onScrollDebounce"
    >
      <div ref="elSize" class="list-content-size-observer"></div>
      <div
        v-if="bigmode.enabled && bigmode.skeleton"
        ref="elSkeleton"
        class="list-skeleton"
      >
        <div
          v-for="(isTitle, i) in skeletonItems"
          :key="`skeleton-${i}`"
          :class="{
            'skeleton-item': true,
            'skeleton-title': isTitle,
          }"
        ></div>
      </div>
      <div class="list-items" :style="listItemsStyle">
        <component
          v-for="vnode in itemsView"
          :key="vnode.key"
          :is="vnode"
          :style="vnode.keepAliveStyle"
        />
      </div>
    </div>
  </div>
</template>

<script>
// note: this also sets "list-layout-%VALUE%" class
export const LIST_LAYOUTS = {
  DEFAULT: "tiles", // default layout
  TILES: "tiles", // tiles with autosize and vertical scroll
  LIST: "list", // list of rows with vertical scroll
  RIBBON: "ribbon", // tiles in one row with horizontal scroll
}
</script>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, useSlots, reactive } from "vue"
import { vBngBlur } from "@/common/directives"
import { BngButton, BngBreadcrumbs, ACCENTS, icons } from "@/common/components/base"
import { sleep } from "@/utils"
import logger from "@/services/logger"

const emit = defineEmits(["layoutChange", "pathClick"])

const props = defineProps({
  /// toolbar options
  // it will appear if path or layout-selector defined
  path: Array, // aka breadcrumbs
  pathLimit: {
    // how many items to display in path
    type: [Number, String],
    default: 3,
  },
  // target element to teleport path into
  pathTarget: Object,
  // enables layout selector (switching between tiles or rows only)
  layoutSelector: Boolean,
  // target element to teleport layout selector into
  layoutSelectorTarget: Object,

  /// layout options
  layout: {
    type: String,
    default: LIST_LAYOUTS.DEFAULT,
    validator: val => Object.values(LIST_LAYOUTS).includes(val),
  },

  // optimise big lists
  big: Boolean,
  immediate: Boolean, // disables debounce and skeleton
  keepAlive: [Boolean, Number], // keeps items rendered but hidden, if they were shown at least once

  // custom size calculation
  tileSizeCalc: Function, // (context) => { width, height, margin, unit? }

  /// target size (optional but encouraged)
  // those values should be in em and will override component's values
  // FIXME: rename target* to item* for consistency
  tileWidth: Number,
  tileHeight: Number, // height is used for big mode only, with TILE or LIST layout
  tileMargin: Number,
  // deprecated
  targetWidth: Number,
  targetHeight: Number,
  targetMargin: Number,

  /// title target size (optional but encouraged)
  // those values should be in em and will override component's values
  titleWidth: Number, // width is used for RIBBON layout only
  titleHeight: Number, // height is used for big mode only, with TILE or LIST layout
  titleMargin: Number,
  // deprecated
  targetTitleWidth: Number,
  targetTitleHeight: Number,
  targetTitleMargin: Number,

  /// other options
  noBackground: Boolean,
})

const elPath = ref()

defineExpose({
  navBack() {
    elPath.value && elPath.value.navBack()
  },
  navTo(item) {
    elPath.value && elPath.value.navTo(item)
  },
  async scrollToIndex(index = 0) {
    if (!bigmode.enabled) {
      const hasPosObserver = (elCont.value.children || [])[0]?.classList.contains("bng-pos-observer")
      const elm = (elCont.value.children || [])[index + (hasPosObserver ? 1 : 0)]
      elm && elm.scrollIntoView()
      return elm
    }
    // big mode
    const big = await getBigProps(undefined, index)
    if (!big) return null
    const horizontal = layoutSelected.value === LIST_LAYOUTS.RIBBON
    const containerSize = horizontal ? contWidth : contHeight
    const rowIndex = layoutCache.itemToRow.get(index)
    const itemRowPos = layoutCache.rows[rowIndex]?.pos || big.position
    const itemRowSize = layoutCache.rows[rowIndex]?.size || (horizontal ? tileWidth.value : tileHeight.value)
    const centeredPos = itemRowPos - (containerSize / 2) + (itemRowSize / 2)
    scrollPos.value = Math.max(0, centeredPos)
    if (horizontal) {
      elCont.value.scrollLeft = scrollPos.value
    } else {
      elCont.value.scrollTop = scrollPos.value
    }
    await updSkeleton()
    const itm = items.value[index]
    if (!itm) return null
    return itm.getElement?.() || itm.el || itm
  },
  refresh() {
    tileWidth.value = 0
    tileHeight.value = 0
    titleWidth.value = 0
    titleHeight.value = 0
    tileProps = getItemProps(items.value, false)
    titleProps = getItemProps(items.value, true)
    if (tileProps) {
      tileMargin.value = validNum(tileProps.margin) ? tileProps.margin : defTileMargin * fontSize
      calcTiles()
    }
    if (titleProps) {
      titleMargin.value = validNum(titleProps.margin) ? titleProps.margin : defTitleMargin * fontSize
      calcTitles()
    }
    invalidateLayoutCache()
    nextTick(() => {
      if (bigmode.enabled && contWidth > 0 && contHeight > 0) {
        buildLayoutCache()
        calcBig()
        updSkeleton()
      }
    })
  },
})

// default font size in px
const defFontSize = 16
// default sizes in em if they aren't defined or zero
const defTileWidth = 10
const defTileHeight = 5
const defTileMargin = 0.2
// default title sizes in em
const defTitleWidth = 10 // full width
const defTitleHeight = 2.5
const defTitleMargin = 0.2

const layoutSelected = ref(props.layout)
watch(
  () => props.layout,
  () => layoutSelected.value = props.layout || LIST_LAYOUTS.DEFAULT,
)
watch(
  () => layoutSelected.value,
  val => {
    emit("layoutChange", val)
    invalidateLayoutCache()
    updSize()
  }
)

const toolbar = computed(() => {
  const res = {
    path: props.path && props.path.length > 0,
    layout: props.layoutSelector,
  }
  res.enabled = res.path || res.layout
  // if all toolbar content gets teleported away, hide the toolbar element
  res.show = res.enabled && ((res.path && !props.pathTarget) || (res.layout && !props.layoutSelectorTarget))
  return res
})

const slots = useSlots()

const elCont = ref()
const elSize = ref()
const elSkeleton = ref()
const tileWidth = ref(0) // px
const tileHeight = ref(0) // px
const tileMargin = ref(0) // px
const titleWidth = ref(0) // px
const titleHeight = ref(0) // px
const titleMargin = ref(0) // px
const scrollPos = ref(0)
const skeletonItems = ref([])
const processing = computed(() => bigmode.enabled && (bigmode.initial || layoutCache.building))

let contWidth = 0 // px
let contHeight = 0 // px
let fontSize = defFontSize // px, auto-detected
let skeletonShown = false
let warnShown = false

const listItemsStyle = computed(() => bigmode.enabled ? {
  transform: `translate${layoutSelected.value === LIST_LAYOUTS.RIBBON ? "X" : "Y"}(${bigmode.position}px)`,
} : undefined)

// this is a sampled tile and title as a custom object { el, width, height, margin }
let tileProps = null
let titleProps = null

// big mode, that will enable additional rendering optimisations
const bigmode = reactive({
  enabled: false,
  initial: true,
  debounce: 500, // scroll debounce in ms
  skeleton: true, // enable skeleton rendering
  layouts: [], // layouts that support bigmode (auto-filled)
  getPos: { // we don't want it to be reactive so leave it as functions instead of getters
    [LIST_LAYOUTS.TILES]: () => elCont.value?.scrollTop || 0,
    [LIST_LAYOUTS.LIST]: () => elCont.value?.scrollTop || 0,
    [LIST_LAYOUTS.RIBBON]: () => elCont.value?.scrollLeft || 0,
  },
  overflow: 2, // number of lines to render offscreen - it helps with partial scroll
  skeletonOverflow: 2, // same but for skeleton, can be much bigger
  // first and last visible item
  first: 0,
  last: 0,
  perRow: 1,
  items: [], // array of displayed items
  // position of the container
  position: 0,
  // full size of the list
  full: 0,
  // size of currently rendered items
  size: 0,
})
bigmode.layouts = Object.keys(bigmode.getPos)

// layout cache for fast virtual scrolling lookups when in big mode
const layoutCache = reactive({
  version: 0,
  building: false,
  valid: false,

  itemCount: 0,
  totalSize: 0,

  // row-based layout (memory intensive but highly performant)
  // [ { pos, size, first, last, isTitle? }, ...]
  rows: [],

  // reverse lookups
  itemToRow: new Map(), // item index > row index
  rowPositions: [],     // extracted positions for binary search
})

const items = ref([])
const itemsView = ref([])
const itemsShown = ref(new Set()) // indexes for keepAlive

watch(() => props.immediate, val => {
  if (val) {
    bigmode._skeleton = bigmode.skeleton
    bigmode._debounce = bigmode.debounce
    bigmode.skeleton = false
    bigmode.debounce = 0
  } else {
    if (bigmode._skeleton) bigmode.skeleton = bigmode._skeleton
    if (bigmode._debounce) bigmode.debounce = bigmode._debounce
  }
}, { immediate: true })

watch(
  [() => slots.default?.(), () => props.big, () => layoutSelected.value],
  () => {
    let res = slots.default ? slots.default() : []
    bigmode.enabled = props.big && bigmode.layouts.includes(layoutSelected.value)
    if (bigmode.enabled) {
      bigmode.initial = true
      res = getItems(res)
    }
    res = res.map((item, key) => ({ ...item, key }))
    items.value = res
    if (!bigmode.enabled) itemsView.value = res // set items directly for non-big mode
    itemsShown.value.clear()
    nextTick(() => {
      tileProps = getItemProps(res, false) // tiles
      titleProps = getItemProps(res, true) // titles
      invalidateLayoutCache() // items changed
      updSize()
      updSkeleton()
    })
  },
  { immediate: true }
)

// recursive search for all items
function getItems(vnodes, _level = 0) {
  const res = []
  for (const vnode of vnodes) {
    switch (typeof vnode.type) {
      case "object": { // vue component
        const isTitle = vnode.props && ("bng-list-title" in vnode.props)
        const item = { ...vnode }
        if (isTitle) item.isBngListTitle = true
        res.push(item)
        break
      }
      // case "string": // html element (not reliable: `el` can be null)
      //   // but let's double-check if it really is
      //   if (vnode.el instanceof HTMLElement) res.push(vnode)
      //   break
      case "symbol": // vue fragment (v-fgt)
        if (_level === 20) {
          logger.debug("BngList reached max level of nested Vue fragments")
          return []
        }
        res.push(...getItems(vnode.children, _level + 1))
        break
    }
  }
  return res
}

// recursive search for a tile to sample its properties
function findItem(vnode, _level = 0) {
  let res = null
  switch (typeof vnode.type) {
    case "object": // vue component
      res = { el: vnode.el, width: vnode.type.width, height: vnode.type.height, margin: vnode.type.margin }
      break
    case "string": // html element (not reliable: `el` can be null)
      // but let's double-check if it really is
      if (vnode.el instanceof HTMLElement) res = { el: vnode.el }
      break
    case "symbol": // vue fragment (v-fgt)
      if (vnode.children.length > 0) {
        // with inner elements
        if (_level === 20) return null // for safety
        res = findItem(vnode.children[0], ++_level)
      }
      break
  }
  return res
}

function getItemProps(vnodes, title = false) {
  if (vnodes.length === 0) return null

  const sampleItem = vnodes.find(vnode => (title && vnode.isBngListTitle) || (!title && !vnode.isBngListTitle))
  if (!sampleItem) return null

  // sample the component
  const res = findItem(sampleItem)
  if (!res) return null

  // validation results cache to save a few ticks and a calls
  const valid = {
    width: validNum(res.width),
    height: validNum(res.height),
    margin: validNum(res.margin),
  }

  let fontSize

  // set overrides if we have them
  let targetWidth = 0
  let targetHeight = 0
  let targetMargin = 0

  // check for custom size calc function (tile only)
  if (!title && props.tileSizeCalc) {
    try {
      if (!fontSize) fontSize = getFontSize()
      const size = props.tileSizeCalc({
        contWidth,
        contHeight,
        fontSize,
        layout: layoutSelected.value,
      })
      if (size && typeof size === "object") {
        const isPx = size.unit === "px"
        targetWidth = isPx ? size.width / fontSize : size.width
        targetHeight = isPx ? size.height / fontSize : size.height
        targetMargin = isPx ? size.margin / fontSize : size.margin
      }
    } catch (err) {
      logger.warn("BngList: tileSizeCalc function error:", err)
    }
  }

  // note: target* props are deprecated, but we're referencing them for backward compatibility
  if (!targetWidth) targetWidth = title ? (props.titleWidth || props.targetTitleWidth) : (props.tileWidth || props.targetWidth)
  if (!targetHeight) targetHeight = title ? (props.titleHeight || props.targetTitleHeight) : (props.tileHeight || props.targetHeight)
  if (!targetMargin) targetMargin = title ? (props.titleMargin || props.targetTitleMargin) : (props.tileMargin || props.targetMargin)

  // validate and apply the overrides
  if (/*!valid.width &&*/ validNum(targetWidth)) {
    res.width = targetWidth
    valid.width = true
  }
  if (/*!valid.height &&*/ validNum(targetHeight)) {
    res.height = targetHeight
    valid.height = true
  }
  if (/*!valid.margin &&*/ validNum(targetMargin)) {
    res.margin = targetMargin
    valid.margin = true
  }

  const em2px = em => {
    if (!fontSize) fontSize = getFontSize()
    return em * fontSize
  }

  if (valid.width && res.width) {
    res.width = em2px(res.width)
  }
  if (valid.height && res.height) {
    res.height = em2px(res.height)
  }
  if (valid.margin && res.margin) {
    res.margin = em2px(res.margin)
  }

  // detect target width and margin if it was not defined on the component itself
  if (!valid.width || (bigmode.enabled && !valid.height) || !valid.margin) {
    if (res.el instanceof HTMLElement) {
      const style = window.getComputedStyle(res.el, null)
      if (!valid.width) {
        // find width
        res.width = +style.width.substring(0, style.width.length - 2)
      }
      if (!valid.height) {
        // find height
        res.height = +style.height.substring(0, style.height.length - 2)
      }
      if (!valid.margin) {
        // find biggest margin
        res.margin =
          [style.marginTop, style.marginRight, style.marginBottom, style.marginLeft]
            .map(m => +m.substring(0, m.length - 2)).sort((a, b) => b - a)[0]
      }
    } else {
      logger.warn(`BngList cannot access ${title ? 'title' : 'tile'} element for size auto-detection!`)
    }
    if (!warnShown) {
      warnShown = true
      logger.debug(`BigList was not provided with ${title ? 'title' : 'target'} sizes (from props or from ${title ? 'title' : 'tile'} component export) and attempted to auto-detect them. This may lead to some size micro-adjustments visible to user or invalid sizes. Please specify ${title ? 'title' : 'target'} sizes manually.`)
      if (res.width < 1 || res.height < 1) logger.debug(`BigList noticed a detected ${title ? 'title' : ''} size being too low: width = ${res.width}, height = ${res.height}`)
    }
  }
  // console.log("component:", props)
  return res
}

const validNum = num => typeof num === "number" && !isNaN(num)

// get real font-size in pixels
const getFontSize = () => {
  if (!elCont.value) return defFontSize
  const size = window.getComputedStyle(elCont.value, null).fontSize
  return +size.substring(0, size.length - 2) || defFontSize
}

const resizeObserver = new ResizeObserver(updSize)
onMounted(() => nextTick(() => {
  resizeObserver.observe(elSize.value)
}))
onBeforeUnmount(() => {
  if (elSize.value) resizeObserver.unobserve(elSize.value)
  resizeObserver.disconnect()
})

const scrolling = ref(false)
let scrollTmr, scrollTick = false
const onScrollDebounce = async () => {
  scrollPos.value = bigmode.getPos[layoutSelected.value]()
  await updSkeleton()
}
watch(scrollPos, async pos => {
  if (!bigmode.enabled) return
  if (bigmode.debounce > 0) {
    clearTimeout(scrollTmr)
    scrolling.value = true
    scrollTmr = setTimeout(async () => {
      scrolling.value = false
      await calcBig(pos)
      await updSkeleton()
    }, bigmode.debounce)
  } else {
    if (scrollTick) return
    scrollTick = true
    requestAnimationFrame(async () => {
      scrollTick = false
      await calcBig(pos)
      await updSkeleton()
    })
  }
})

function vScroll(evt) {
  // note: it is unpleasant with "smooth" behaviour
  evt.deltaY !== 0 && elCont.value.scrollBy({ left: evt.deltaY, behavior: "instant" })
}

function updSize(entries = []) {
  const oldContWidth = contWidth
  const oldContHeight = contHeight

  tileWidth.value = 0
  tileHeight.value = 0
  titleWidth.value = 0
  titleHeight.value = 0

  if (tileProps) {
    tileMargin.value = validNum(tileProps.margin) ? tileProps.margin : defTileMargin * fontSize
    calcTiles(entries)
  } else {
    tileMargin.value = 0
  }

  if (titleProps) {
    titleMargin.value = validNum(titleProps.margin) ? titleProps.margin : defTitleMargin * fontSize
    calcTitles(entries)
  } else {
    titleMargin.value = 0
  }

  if (Math.abs(oldContWidth - contWidth) > 1 || Math.abs(oldContHeight - contHeight) > 1) {
    invalidateLayoutCache()
  }

  if (bigmode.enabled && !layoutCache.valid && contWidth > 0 && contHeight > 0) {
    // don't build cache if title dimensions aren't ready yet
    const titleDimensionsReady = !titleProps || (titleWidth.value > 0 && titleHeight.value > 0)
    if (titleDimensionsReady) buildLayoutCache()
  }

  // force a proper initial render
  if (bigmode.enabled && bigmode.initial && (tileProps || titleProps)) {
    nextTick(async () => {
      await calcBig()
      await updSkeleton()
        // new cef has delayed dimension detection which messes things up a little
        // so we're forcing another render after a short delay to ensure proper rendering
      setTimeout(async () => {
        await calcBig()
        await updSkeleton()
      }, 50)
      })
    }

  // that's silly but will work for now
  elCont.value.removeEventListener("mousewheel", vScroll)
  if (layoutSelected.value === LIST_LAYOUTS.RIBBON) {
    elCont.value.addEventListener("mousewheel", vScroll)
  }
}

function calcSizes(entries = []) {
  contWidth = 0
  contHeight = 0
  if (!elSize.value || (!bigmode.enabled && layoutSelected.value !== LIST_LAYOUTS.TILES)) {
    return false
  }
  const baseMargin = tileMargin.value
  const rect = entries[0]?.contentRect || elSize.value.getBoundingClientRect()
  fontSize = getFontSize()
  contWidth = rect.width

  // in ribbon mode, set height based on tallest item rather than container
  if (layoutSelected.value === LIST_LAYOUTS.RIBBON) {
    const tileHeight = (tileProps?.height || defTileHeight * fontSize) + baseMargin
    const titleHeight = titleProps ? (titleProps.height || defTitleHeight * fontSize) + (titleProps.margin || defTitleMargin * fontSize) : 0
    contHeight = Math.max(tileHeight, titleHeight)
  } else {
    contHeight = rect.height - baseMargin
  }

  // if (contWidth <= 0 || contHeight <= 0) {
  //   // new cef has delayed dimension detection which messes things up a little
  //   // so we're going to re-check after a short delay
  //   window.requestAnimationFrame(() => calcSizes(entries))
  //   return false
  // }
  return true
}

function calcTiles(entries = []) {
  if (!calcSizes(entries)) return
  // decide what we need
  const wantsWidth = layoutSelected.value === LIST_LAYOUTS.TILES || (bigmode.enabled && layoutSelected.value === LIST_LAYOUTS.RIBBON)
  const wantsHeight = bigmode.enabled
  if (!wantsWidth && !wantsHeight) return
  const baseMargin = tileMargin.value
  if (wantsWidth) {
    // no need to check for valid number here, this shouldn't be zero anyway
    const baseWidth = tileProps.width || defTileWidth * fontSize // px
    if (contWidth > 0 && layoutSelected.value === LIST_LAYOUTS.TILES) {
      const prepWidth = baseWidth + baseMargin
      const amount = contWidth / prepWidth
      if (amount < 2) {
        tileWidth.value = contWidth - baseMargin
      } else {
        tileWidth.value = (contWidth - baseMargin) / ~~amount - baseMargin
      }
    } else {
      tileWidth.value = baseWidth
    }
  }
  if (wantsHeight) {
    const baseHeight = tileProps.height || defTileHeight * fontSize // px
    tileHeight.value = baseHeight
  }
  if (bigmode.enabled && bigmode.initial) {
    // console.log("calcTiles big", contWidth, contHeight)
    if ((!wantsWidth || contWidth > 0) && (!wantsHeight || contHeight > 0)) {
      bigmode.initial = false
      calcBig()
      updSkeleton()
    } else {
      // new cef has delayed dimension detection which messes things up a little
      // so we're going to re-check after a short delay
      // setTimeout(() => calcTiles(), 100)
      window.requestAnimationFrame(() => calcTiles())
    }
  }
}

function calcTitles() {
  // get font size
  if (bigmode.enabled) {
    fontSize = getFontSize()
  }

  if (!titleProps) return

  const baseMargin = titleMargin.value // px
  const baseHeight = titleProps.height || defTitleHeight * fontSize // px

  if (layoutSelected.value === LIST_LAYOUTS.RIBBON) {
    // behave like regular items
    const baseWidth = titleProps.width || defTitleWidth * fontSize // px
    titleWidth.value = baseWidth
  } else {
    // take full container width
    titleWidth.value = contWidth - baseMargin
  }

  const oldTitleHeight = titleHeight.value
  titleHeight.value = baseHeight

  // if title height changed from 0, rebuild cache with correct dimensions
  if (bigmode.enabled && oldTitleHeight === 0 && titleHeight.value > 0 && contWidth > 0 && contHeight > 0) {
    invalidateLayoutCache()
    buildLayoutCache()
  }
}

function clearLayoutCache() {
  // It's an empty list, which is a valid state.
  // Reset state and mark as not initial and not building.
  layoutCache.totalSize = 0
  layoutCache.rows = []
  layoutCache.itemToRow.clear()
  layoutCache.rowPositions = []
  layoutCache.valid = true
  layoutCache.building = false
  if (bigmode.enabled) {
    bigmode.initial = false
    bigmode.full = 0
    bigmode.position = 0
    itemsView.value = []
  }
}

async function buildLayoutCache() {
  if (layoutCache.building) {
    while (layoutCache.building)
      await sleep(10)
    return
  }

  if (items.value.length === 0) {
    clearLayoutCache()
    return
  }

  if (!tileProps && !titleProps) {
    // clearLayoutCache()
    // logger.warn("BngList: Cannot build layout cache - no tile or title props available")
    return
  }

  if (contWidth <= 0 || contHeight <= 0) {
    // clearLayoutCache()
    // logger.warn("BngList: Cannot build layout cache - invalid container dimensions", { contWidth, contHeight })
    return
  }

  layoutCache.building = true
  layoutCache.version = Date.now()
  layoutCache.itemCount = items.value.length
  await sleep(0)

  // logger.debug(`BngList: Building layout cache for ${layoutCache.itemCount} items...`)

  // reset cache
  layoutCache.rows = []
  layoutCache.itemToRow.clear()
  layoutCache.rowPositions = []

  if (layoutCache.itemCount !== items.value.length) {
    layoutCache.itemCount = 0
  }

  if (layoutCache.itemCount === 0) {
    clearLayoutCache()
    if (items.value.length > 0) buildLayoutCache()
    // else logger.debug("BngList: Layout cache built (empty)")
    return
  }

  const baseTileMargin = tileProps?.margin || defTileMargin * fontSize
  const baseTitleMargin = titleProps?.margin || defTitleMargin * fontSize
  const horizontal = layoutSelected.value === LIST_LAYOUTS.RIBBON
  const tilesPerRow = layoutSelected.value === LIST_LAYOUTS.TILES ? ~~(contWidth / tileWidth.value) : 1

  // let pos = (items.value[0]?.isBngListTitle ? baseTitleMargin : baseTileMargin)
  let pos = 0
  let first = 0
  let curItems = 0

  function completeRow(i) {
    const tileSize = horizontal ? tileWidth.value : tileHeight.value
    const size = tileSize + baseTileMargin
    const row = {
      pos,
      size,
      first,
      last: i - 1,
    }
    layoutCache.rows.push(row)
    layoutCache.rowPositions.push(pos)

    // map items to row
    for (let j = first; j < i; j++) {
      layoutCache.itemToRow.set(j, layoutCache.rows.length - 1)
    }

    // next row position: current pos + current row height + next row's margin
    const nextMargin = items.value[i]?.isBngListTitle ? baseTitleMargin : baseTileMargin
    pos += tileSize + nextMargin
  }

  for (let i = 0; i < layoutCache.itemCount; i++) {
    const item = items.value[i]

    if (item.isBngListTitle) {
      // complete any partial tile row first
      if (curItems > 0) {
        completeRow(i)
        curItems = 0
      }

      // create title row
      const titleSize = horizontal ? titleWidth.value : titleHeight.value
      const rowSize = titleSize + baseTitleMargin

      const row = {
        pos,
        size: rowSize,
        first: i,
        last: i,
        isTitle: true,
      }
      layoutCache.rows.push(row)
      layoutCache.rowPositions.push(pos)
      layoutCache.itemToRow.set(i, layoutCache.rows.length - 1)

      // next row position: current pos + current row height + next row's margin
      const nextMargin = items.value[i + 1]?.isBngListTitle ? baseTitleMargin : baseTileMargin
      pos += titleSize + nextMargin
      first = i + 1
      curItems = 0

    } else {
      // regular tile
      curItems++

      // start new row if this is the first tile
      if (curItems === 1) {
        first = i
      }

      // complete row if we've hit the limit
      if (curItems >= tilesPerRow) {
        const tileSize = horizontal ? tileWidth.value : tileHeight.value
        const size = tileSize + baseTileMargin

        const row = {
          pos,
          size,
          first,
          last: i,
        }
        layoutCache.rows.push(row)
        layoutCache.rowPositions.push(pos)

        // map items to row
        for (let j = first; j <= i; j++) {
          layoutCache.itemToRow.set(j, layoutCache.rows.length - 1)
        }

        // next row position: current pos + current row height + next row's margin
        const nextMargin = items.value[i + 1]?.isBngListTitle ? baseTitleMargin : baseTileMargin
        pos += tileSize + nextMargin
        curItems = 0
        first = i + 1
      }
    }
  }

  // handle any remaining partial tile row
  if (curItems > 0) completeRow(layoutCache.itemCount)

  // add final bottom margin
  pos += items.value[layoutCache.itemCount - 1]?.isBngListTitle ? baseTitleMargin : baseTileMargin

  layoutCache.totalSize = pos

  layoutCache.valid = true
  layoutCache.building = false

  // logger.debug(`Layout cache built successfully - ${layoutCache.rows.length} rows for ${layoutCache.itemCount} items (${currentPos}px total)`)
}

function invalidateLayoutCache() {
  layoutCache.valid = false
  layoutCache.version++
}

function layoutCacheSearch(arr, target) { // binary search
  let left = 0
  let right = arr.length - 1
  while (left <= right) {
    const mid = ~~((left + right) / 2)
    if (arr[mid] <= target) {
      left = mid + 1
    } else {
      right = mid - 1
    }
  }
  return Math.max(0, right) // last index where arr[i] <= target
}

async function getBigProps(pos = undefined, index = undefined, overflow = undefined) {
  // specify either pos or index. index will override pos.
  const count = items.value.length
  if (count === 0) return

  if (!layoutCache.valid || layoutCache.itemCount !== count) {
    await buildLayoutCache()
    if (!layoutCache.valid) {
      // logger.error("BngList: Cannot calculate big props - layout cache build failed", {
      //   itemCount: count,
      //   hasTileProps: !!tileProps,
      //   hasTitleProps: !!titleProps,
      //   contWidth,
      //   contHeight,
      // })
      return null
    }
  }

  if (typeof index !== "number" || index < 0) {
    index = undefined
    if (typeof pos !== "number") pos = bigmode.getPos[layoutSelected.value]()
  }

  const horizontal = layoutSelected.value === LIST_LAYOUTS.RIBBON
  const contSize = horizontal ? contWidth : contHeight

  // bi-directional overflow
  if (typeof overflow !== "number") overflow = bigmode.overflow
  const overflowBefore = Math.ceil(overflow / 2)
  const overflowAfter = Math.floor(overflow / 2)

  let firstRow = 0
  let currentPos = 0

  // if index specified, find row containing that item
  if (typeof index === "number" && index >= 0) {
    const rowIndex = layoutCache.itemToRow.get(index)
    if (rowIndex !== undefined) {
      firstRow = rowIndex
      currentPos = layoutCache.rows[rowIndex].pos
      pos = currentPos
    }
  } else {
    // find first visible row using binary search
    firstRow = layoutCacheSearch(layoutCache.rowPositions, pos)
    currentPos = layoutCache.rows[firstRow]?.pos || 0
  }

  // extend backwards for overflow (by counting rows)
  let extendedFirstRow = firstRow
  let backwardCount = 0

  for (let i = firstRow - 1; i >= 0 && backwardCount < overflowBefore; i--) {
    extendedFirstRow = i
    backwardCount++
  }

  // extend forward for visible area + overflow
  let lastRow = firstRow
  let visibleSize = 0

  // fill visible container area (start from actual visible row)
  for (let i = firstRow; i < layoutCache.rows.length; i++) {
    lastRow = i
    visibleSize += layoutCache.rows[i].size
    if (visibleSize >= contSize) break
  }
  // add overflow rows beyond visible area
  let overflowCount = 0
  for (let i = lastRow + 1; i < layoutCache.rows.length && overflowCount < overflowAfter; i++) {
    lastRow = i
    overflowCount++
  }

  // extract item range from rows
  const first = layoutCache.rows[extendedFirstRow]?.first || 0
  const last = Math.min(count - 1, layoutCache.rows[lastRow]?.last || count - 1)

  // calculate virtual container size
  let virtualSize = 0
  for (let i = extendedFirstRow; i <= lastRow; i++)
    if (layoutCache.rows[i])
      virtualSize += layoutCache.rows[i].size

  const tilesPerRow = layoutSelected.value === LIST_LAYOUTS.TILES ? ~~(contWidth / tileWidth.value) : 1

  return {
    position: Math.max(0, layoutCache.rows[extendedFirstRow]?.pos || 0),
    first,
    last: Math.min(count - 1, last),
    full: layoutCache.totalSize,
    size: Math.max(0, virtualSize),
    perRow: tilesPerRow,
    items: items.value.slice(first, last + 1),
  }
}

async function calcBig(pos = undefined, index = undefined) {
  const big = await getBigProps(pos, index)
  if (!big) return

  bigmode.position = big.position
  bigmode.first = big.first
  bigmode.last = big.last
  bigmode.size = big.size
  bigmode.full = big.full
  bigmode.perRow = big.perRow

  if (props.keepAlive) {
    for (let i = big.first; i <= big.last; i++) {
      itemsShown.value.add(i)
    }
    if (typeof props.keepAlive === "number" && itemsShown.value.size > props.keepAlive) {
      const center = big.first + (big.last - big.first) / 2
      // sort by distance from view center
      const farthest = Array.from(itemsShown.value)
        .sort((a, b) => Math.abs(b - center) - Math.abs(a - center))
        .slice(0, itemsShown.value.size - props.keepAlive)
      for (const idx of farthest) {
        itemsShown.value.delete(idx)
      }
    }
    const indexes = Array.from(itemsShown.value).sort((a, b) => a - b)
    big.items = indexes.map(idx => {
      const item = items.value[idx]
      if (idx >= big.first && idx <= big.last) return item
      return {
        ...item,
        keepAliveStyle: "display: none !important;"
      }
    })
  } else if (itemsShown.value.size > 0) {
    itemsShown.value.clear()
  }

  bigmode.items = big.items
  itemsView.value = big.items

  // logger.debug(`bigmode: ${bigmode.first}..${bigmode.last} (${bigmode.perRow} per row) items: ${big.items.length} virtual: ${big.size}px on position ${(bigmode.position).toFixed(3)} with scroll at ${pos} out of ${bigmode.full} total size (cached: ${layoutCache.valid})`)
}

function showSkeleton(show = true) {
  if (skeletonShown === show) return
  if (show) {
    elSkeleton.value.style.removeProperty("display")
  } else {
    skeletonItems.value = []
    elSkeleton.value.style.setProperty("display", "none", "important")
  }
  skeletonShown = show
}

async function updSkeleton() {
  if (!elSkeleton.value || !bigmode.enabled || !bigmode.skeleton || !scrolling.value || items.value.length === 0 || !layoutCache.valid) {
    showSkeleton(false)
    return
  }

  // no skeleton needed if all items are rendered
  if (bigmode.first === 0 && bigmode.last === items.value.length - 1) {
    showSkeleton(false)
    return
  }

  const horizontal = layoutSelected.value === LIST_LAYOUTS.RIBBON
  const contSize = horizontal ? contWidth : contHeight

  let pos = scrollPos.value

  let start, end

  if (pos < bigmode.position) {
    // scroll up

    if (bigmode.first === 0) {
      showSkeleton(false)
      return
    }

    // find starting row from scroll position
    const scrollRowIndex = layoutCacheSearch(layoutCache.rowPositions, pos)
    start = Math.max(0, scrollRowIndex)
    end = start

    // fill visible area by accumulating actual row sizes
    let visibleSize = 0
    for (let i = start; i < layoutCache.rows.length; i++) {
      const row = layoutCache.rows[i]
      // check if this row starts at or past real items position
      if (row.pos >= bigmode.position) break
      end = i
      visibleSize += row.size
      if (visibleSize >= contSize) break
    }

    // add overflow by counting rows
    let overflowCount = 0
    for (let i = end + 1; i < layoutCache.rows.length; i++) {
      const row = layoutCache.rows[i]
      // check if this row starts at or past real items position
      if (row.pos >= bigmode.position) break
      end = i
      overflowCount++
    }

    // expand backwards to fill any remaining visible area gap + overflow
    // (forward fill might have stopped early due to boundary check)
    const neededSize = contSize + (bigmode.skeletonOverflow * (horizontal ? tileWidth.value : tileHeight.value))
    let backwardSize = visibleSize
    while (start > 0 && backwardSize < neededSize) {
      start--
      backwardSize += layoutCache.rows[start].size
    }

    pos = layoutCache.rows[start]?.pos || 0
  } else {
    // scroll down

    if (bigmode.last === items.value.length - 1) {
      showSkeleton(false)
      return
    }

    // skeleton should fill from current scroll position, but skip real items area
    const realItemsEnd = bigmode.position + bigmode.size
    let startRowIndex = layoutCacheSearch(layoutCache.rowPositions, pos)

    // if this row is inside real items area, skip to first row after real items
    if (startRowIndex < layoutCache.rows.length && layoutCache.rows[startRowIndex].pos < realItemsEnd) {
      // find first row after real items
      startRowIndex = layoutCacheSearch(layoutCache.rowPositions, realItemsEnd)
      if (startRowIndex < layoutCache.rows.length && layoutCache.rows[startRowIndex].pos < realItemsEnd) {
        startRowIndex++
      }
    }

    start = Math.max(0, Math.min(startRowIndex, layoutCache.rows.length - 1))
    end = start

    // fill visible area by accumulating actual row sizes
    let visibleSize = 0
    for (let i = start; i < layoutCache.rows.length; i++) {
      end = i
      visibleSize += layoutCache.rows[i].size
      if (visibleSize >= contSize) break
    }

    // add overflow by counting rows
    let overflowCount = 0
    for (let i = end + 1; i < layoutCache.rows.length && overflowCount < bigmode.skeletonOverflow; i++) {
      end = i
      overflowCount++
    }

    pos = layoutCache.rows[start]?.pos || pos
  }

  // build skeleton items from cache rows
  const skelItems = []
  for (let i = start; i <= end && i < layoutCache.rows.length; i++) {
    const row = layoutCache.rows[i]
    for (let j = row.first; j <= row.last; j++) {
      const item = items.value[j]
      if (item) skelItems.push(!!item.isBngListTitle)
    }
  }

  if (skelItems.length === 0) {
    showSkeleton(false)
    return
  }

  // safety check: ensure skeleton items don't overlap with rendered items
  // const skeletonFirstItem = layoutCache.rows[start]?.first
  // const skeletonLastItem = layoutCache.rows[end]?.last
  // if (skeletonFirstItem !== undefined && skeletonLastItem !== undefined) {
  //   // check if skeleton range overlaps with rendered range
  //   if (!(skeletonLastItem < bigmode.first || skeletonFirstItem > bigmode.last)) {
  //     logger.warn("Skeleton would overlap with real items, skipping", { skeletonFirstItem, skeletonLastItem, bigmode: { first: bigmode.first, last: bigmode.last } })
  //     showSkeleton(false)
  //     return
  //   }
  // }

  skeletonItems.value = skelItems
  elSkeleton.value.style.setProperty("transform", `translate${horizontal ? "X" : "Y"}(${pos}px)`)
  showSkeleton(true)
}
</script>

<style lang="scss" scoped>
$skeleton-color: var(--list-skeleton-color, #0008);

.list-container {
  display: flex;
  flex-flow: column;
  justify-content: stretch;
  width: 100%;
  max-height: 100%;
  pointer-events: none;

  &[disabled] {
    filter: grayscale(50%);
    opacity: 0.8;
    * {
      pointer-events: none !important;
    }
  }

  & > * {
    flex: 0 0 auto;
  }
  &, * {
    position: relative;
  }
}

.list-toolbar {
  display: flex;
  flex-flow: row nowrap;
  justify-content: stretch;
  align-items: center;
  pointer-events: none;

  > * {
    flex: 1 1 auto;
    width: auto;
    pointer-events: all;
  }
}

.list-layout-toggle {
  flex: 0 0 auto;
  > * {
    min-width: unset;
    width: 2em;
  }
}

.list-content {
  flex: 0 1 auto;
  height: 100%;
  overflow: hidden scroll;
  pointer-events: all;

  &.list-with-background {
    background-color: #0008;
  }

  > .list-content-size-observer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    pointer-events: none;
  }

  > .list-items {
    position: relative;
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-start;
    align-content: flex-start;
    width: 100%;
    height: auto;
    overflow: hidden;
  }

  // big mode (virtual scrolling)
  &.list-big {
    overflow-anchor: none; // chromium thing that messes up everything
    isolation: isolate;
    &::before {
      content: "";
      display: block;
      contain: strict;
    }

    > .list-skeleton {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-content: flex-start;
      overflow: hidden;
      .skeleton-item {
        flex: 0 0 auto;
        width: var(--list-item-width);
        height: var(--list-item-height);
        margin: var(--list-item-margin) 0 0 var(--list-item-margin);
        background-color: $skeleton-color;
        border-radius: 0.25em;
        &.skeleton-title {
          flex-basis: 100%;
          width: var(--list-title-width);
          height: var(--list-title-height);
          margin: var(--list-title-margin) 0 0 var(--list-title-margin);
        }
      }
    }

    &.list-scrolling > .list-skeleton,
    &.list-scrolling > .list-items {
      contain: layout style;
      // contain: paint;
      // will-change: transform;
      // backface-visibility: hidden;
    }
    &.list-scrolling {
      backface-visibility: hidden;
    }

    &.list-layout-tiles > .list-skeleton {
      width: calc(100% + var(--list-title-margin) * 4);
      max-width: calc(100% + var(--list-title-margin) * 4);
      .skeleton-title {
        width: calc(100% - var(--list-title-margin) * 6);
        max-width: calc(100% - var(--list-title-margin) * 6);
      }
    }

    &.list-layout-ribbon > .list-skeleton {
      flex-wrap: nowrap;
      width: fit-content;
      max-height: 100%;
      .skeleton-title {
        flex-basis: auto;
      }
    }

    &.list-layout-list > .list-skeleton {
      flex-direction: column;
      max-width: 100%;
      .skeleton-item {
        width: calc(100% - var(--list-item-margin) * 2);
        &.skeleton-title {
          flex-basis: auto;
          width: calc(100% - var(--list-title-margin) * 2) !important;
          height: var(--list-title-height) !important;
        }
      }
    }

    > .list-items {
      position: absolute;
      top: 0;
      left: 0;
      padding-bottom: var(--list-item-margin);
    }
    &.list-layout-tiles,
    &.list-layout-list {
      &::before {
        width: calc(var(--list-item-width) + var(--list-item-margin));
        height: var(--list-big-full);
      }
    }
    &.list-layout-ribbon {
      &::before {
        width: var(--list-big-full);
        height: calc(var(--list-item-height) + var(--list-item-margin));
      }
    }
  }

  // tiles layout
  &.list-layout-tiles {
    > .list-items {
      width: calc(100% + 0.5em); // fix for a slight width mismatch
      max-width: calc(100% + 0.5em);
      > :deep(*) {
        flex: 0 0 auto !important;
        min-width: unset !important;
        max-width: unset !important;
      }
      > :deep(*[bng-list-title]) {
        flex-basis: 100% !important;
        width: 100% !important;
      }
    }
  }

  // list layout
  &.list-layout-list {
    > .list-items {
      flex-direction: column;
      max-width: 100%;
      > :deep(*) {
        flex: 0 0 auto !important;
        min-width: unset !important;
        max-width: unset !important;
      }
      > :deep(*[bng-list-title]) {
        flex-basis: 100% !important;
        width: 100% !important;
      }
    }
  }

  // ribbon layout
  &.list-layout-ribbon {
    overflow: scroll hidden;
    > .list-items {
      flex-wrap: nowrap;
      width: fit-content;
      max-height: 100%;
      > :deep(*) {
        flex: 0 0 auto !important;
      }
    }
  }

  // width is known
  &.list-item-width {
    > .list-items > :deep(*) {
      width: var(--list-item-width) !important;
      min-width: unset !important;
      max-width: unset !important;
    }
  }

  // height is known
  &.list-item-height {
    > .list-items > :deep(*) {
      height: var(--list-item-height) !important;
      min-height: unset !important;
      max-height: unset !important;
    }
    &.list-layout-list > .list-items > :deep(*) {
      flex: 0 0 var(--list-item-height) !important;
    }
  }

  // margin is known
  &.list-item-margin {
    &:not(.list-big) {
      > .list-items {
        margin-bottom: var(--list-item-margin) !important;
      }
    }
    > .list-items > :deep(*) {
      margin: var(--list-item-margin) 0 0 var(--list-item-margin) !important;
    }
    &.list-layout-list > .list-items > :deep(*) {
      width: calc(100% - var(--list-item-margin) * 2) !important;
    }
  }

  // title width is known
  &.list-title-width {
    > .list-items > :deep(*[bng-list-title]) {
      width: var(--list-title-width) !important;
      min-width: unset !important;
      max-width: unset !important;
    }
  }

  // title height is known
  &.list-title-height {
    > .list-items > :deep(*[bng-list-title]) {
      height: var(--list-title-height) !important;
      min-height: unset !important;
      max-height: unset !important;
    }
  }

  // title margin is known
  &.list-title-margin {
    > .list-items > :deep(*[bng-list-title]) {
      flex-basis: calc(100% - var(--list-title-margin) * 4) !important;
      margin: var(--list-title-margin) 0 0 var(--list-title-margin) !important;
    }
    &.list-layout-list > .list-items > :deep(*[bng-list-title]) {
      width: calc(100% - var(--list-title-margin) * 4) !important;
    }
    &.list-layout-tiles > .list-items > :deep(*[bng-list-title]) {
      width: calc(100% - var(--list-title-margin) * 4) !important;
    }
    &.list-layout-ribbon > .list-items > :deep(*[bng-list-title]) {
      flex-basis: auto !important;
    }
  }

  &.list-layout-list.list-title-margin.list-title-height {
    > .list-items > :deep(*[bng-list-title]) {
      flex-basis: var(--list-title-height) !important;
    }
  }

  &.list-processing {
    isolation: isolate;
    .list-items,
    .list-skeleton {
      opacity: 0.5 !important;
      pointer-events: none !important;
    }
    // &::before {
    //   content: "";
    //   position: absolute;
    //   top: 0;
    //   left: 0;
    //   width: 100%;
    //   min-width: 100%;
    //   height: 100%;
    //   min-height: 100%;
    //   background-color: #0004;
    //   z-index: 1000;
    // }

    &::after {
      content: "Loading...";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #fff;
      font-size: 1.2em;
      font-weight: 200;
      font-style: italic;
      text-shadow: 0 1px 3px #000;
      z-index: 1001;
      pointer-events: none;
    }
  }
}
</style>
