<template>
  <div
    ref="elCont"
    class="bng-overflow-container"
    :class="{
      'with-bindings': useBindings && (elBindPrev?.displayed || elBindNext?.displayed),
      'with-arrows': showArrows && !(elBindPrev?.displayed || elBindNext?.displayed),
      'hide-bindings': !showBindings,
    }"
    @wheel="onWheel"
  >
    <div
      v-show="showLeftFade"
      class="fade-left"
      @mouseenter="startScrolling('left')"
      @mouseleave="stopScrolling"
    ></div>
    <div
      v-show="showRightFade"
      class="fade-right"
      @mouseenter="startScrolling('right')"
      @mouseleave="stopScrolling"
    ></div>
    <BngIcon v-if="showArrows && !elBindPrev?.displayed" :type="icons.arrowLargeLeft" class="hint-prev" />
    <BngIcon v-if="showArrows && !elBindNext?.displayed" :type="icons.arrowLargeRight" class="hint-next" />
    <BngBinding v-if="useBindings" ref="elBindPrev" class="hint-prev" :ui-event="focusNav[0]" controller />
    <BngBinding v-if="useBindings" ref="elBindNext" class="hint-next" :ui-event="focusNav[1]" controller />
    <div
      ref="scrollContainer"
      class="scroll-container"
      :bng-no-child-nav="useBindingsOnly"
      @scroll="onScroll"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, getCurrentInstance, onBeforeUnmount, useSlots, nextTick } from "vue"
import { BngBinding, BngIcon, icons } from "@/common/components/base"
import { vBngOnUiNav } from "@/common/directives"
import { collectRects, navigate, scrollFix, NAVIGABLE_ELEMENTS_SELECTOR } from "@/services/crossfire"
import { setFocus } from "@/services/uiNavFocus"

const slots = useSlots()

const props = defineProps({
  scrollSpeed: {
    type: Number,
    default: 5,
  },
  initialIndex: {
    type: Number,
    default: -1,
  },
  useBindings: [Boolean, Array], // if true, will use tab-l/r for switching between items
  useBindingsOnly: [Boolean, Array], // if true, will only use uiNav for switching between items, not allowing crossfire nor mouse to focus inside
  showBindings: {
    type: Boolean,
    default: true,
  },
  showArrows: {
    type: Boolean,
    default: false,
  },
  noWheel: {
    type: Boolean,
    default: false,
  },
})

// prevent reactivity to avoid unnecessary complications
const useBindings = props.useBindings || props.useBindingsOnly
const useBindingsOnly = props.useBindingsOnly
watch(
  [() => props.useBindings, () => props.useBindingsOnly],
  () => console.warn("useBindings and useBindingsOnly can only be set at component mount time")
)

let uinavBound = false
const focusNav = useBindings && Array.isArray(useBindings) ? useBindings : ["tab_l", "tab_r"]
const elBindPrev = ref(null)
const elBindNext = ref(null)

const elCont = ref(null)
const scrollContainer = ref(null)
const showLeftFade = ref(false)
const showRightFade = ref(false)
const resizeObserver = new ResizeObserver(updateFadeVisibility)
let scrollInterval = null
const scrollBuildupTime = 3000
const scrollMaxSpeedModifier = 4
let scrollTime = 0

let lastActive = null, fixingActive = false
function setActive(elm) {
  clearActive()
  if (elm instanceof Element) {
    elm.setAttribute("active", "true")
    lastActive = elm
  }
}
function clearActive(evt) {
  if (!lastActive) return
  if (evt) {
    const target = evt.detail?.target || evt.target
    if (target === lastActive) return
  }
  lastActive.removeAttribute("active")
  lastActive = null
}

// function to fix the focus frame when using uiNavOnly and clicking on an element with mouse
function fixActive(evt) {
  if (fixingActive) return
  if (useBindings && evt.type === "focusin") return
  let active = evt.detail?.target || evt.target || document.activeElement
  if (!active.matches(NAVIGABLE_ELEMENTS_SELECTOR)) {
    active = active.closest(NAVIGABLE_ELEMENTS_SELECTOR)
  }
  // const active = document.activeElement
  if (!scrollContainer.value.contains(active)) return
  if (lastActive && (lastActive === active || lastActive.contains(active))) return
  if (useBindingsOnly) {
    fixingActive = true
    let prev = evt.detail.relatedTarget || evt.relatedTarget
    if (prev && scrollContainer.value.contains(prev)) prev = null
    if (prev) {
      // return focus frame to the previous element
      setFocus(prev, true)
    } else {
      // if no prev, only make the focus frame disappear
      setFocus(active, false)
    }
  }
  nextTick(() => {
    setActive(active)
    fixingActive = false
  })
}

const CLICKID = "__bngOverflowContainer"
let firstTime = true

function updateContents() {
  if (!scrollContainer.value) return
  let elFirst
  for (const elm of scrollContainer.value.children) {
    if (firstTime && !elFirst) elFirst = elm
    if (elm[CLICKID]) continue
    elm[CLICKID] = true
    elm.addEventListener("click", fixActive)
  }
  if (firstTime && elFirst && props.initialIndex > -1) {
    firstTime = false
    if (!elFirst.matches(NAVIGABLE_ELEMENTS_SELECTOR)) {
      elFirst = elFirst.querySelector(NAVIGABLE_ELEMENTS_SELECTOR)
    }
    elFirst && activate(elFirst)
  }
}

watch(
  [() => slots.default?.(), () => scrollContainer.value],
  () => nextTick(updateContents),
  { immediate: true }
)

function navContents(dir, fireClick = false) {
  const links = collectRects(dir, scrollContainer.value, useBindingsOnly)
  const prev = lastActive
  clearActive()
  let res // result of navigation (link or element)
  if (useBindingsOnly) {
    const idx = links[dir].findIndex(link => link.dom === prev)
    if (idx > -1) {
      res = links[dir][dir === "right" ? idx + 1 : idx - 1]
    } else if (idx === 0 && dir === "left") {
      res = links[dir][links[dir].length - 1]
    } else if (idx === links[dir].length - 1 && dir === "right") {
      res = links[dir][0]
    }
    if (res) {
      setActive(res.dom)
      scrollFix(res, dir)
    }
  } else if (prev) {
    res = navigate(links, dir, prev)
    res && setActive(res)
  }
  if (!res) {
    scrollContainer.value.scrollTo({
      left: dir === "right" ? 0 : scrollContainer.value.clientWidth,
      behavior: "instant",
    })
    nextTick(() => {
      const elms = collectRects("right", scrollContainer.value, true).right
      if (dir === "left") elms.reverse()
      res = elms[0]
      if (res) {
        setActive(res.dom)
        if (useBindingsOnly) {
          scrollFix(res, dir)
        } else {
          setFocus(res.dom)
        }
        fireClick && res.dom.dispatchEvent(new Event("click"))
      }
    })
  } else if (fireClick) {
    if (res.dom) res = res.dom
    nextTick(() => res?.dispatchEvent(new Event("click")))
  }
}
const activatePrev = () => navContents("left", true)
const activateNext = () => navContents("right", true)

function activate(indexOrElement) {
  let elm
  if (typeof indexOrElement === "number") {
    const elms = scrollContainer.value.querySelectorAll(NAVIGABLE_ELEMENTS_SELECTOR)
    if (indexOrElement < 0) indexOrElement = elms.length + indexOrElement
    elm = elms[indexOrElement]
  } else if (indexOrElement instanceof Element) {
    elm = indexOrElement
  } else {
    throw new Error("Invalid argument")
  }
  if (!elm) {
    throw new Error("Element not found")
  }
  scrollFix({ dom: elm, rect: elm.getBoundingClientRect() }, "right")
  setActive(elm)
  !useBindingsOnly && setFocus(elm)
}

defineExpose({
  scrollBy: amount => scrollContainer.value?.scrollBy({ left: amount, behavior: "smooth" }),
  activatePrev,
  activateNext,
  activate,
  deactivate: () => {
    const active = document.activeElement
    const activeCorrect = active && active === lastActive
    clearActive()
    if (activeCorrect) {
      useBindingsOnly && setFocus(active, false)
      active.blur?.()
    }
  },
  refresh: (withActivation = false) => { // will activate an element by initialIndex
    if (withActivation) firstTime = true
    updateContents()
  },
})

if (useBindings) {
  const instance = getCurrentInstance()
  const contUnwatch = watch(() => elCont.value, elm => {
    if (!elm) return
    contUnwatch()
    nextTick(() => {
      uinavBound = true
      const vnode = { ctx: instance, el: elm }
      vBngOnUiNav.mounted(elm, {
        arg: focusNav[0],
        modifiers: {},
        value: activatePrev,
      }, vnode)
      vBngOnUiNav.mounted(elm, {
        arg: focusNav[1],
        modifiers: {},
        value: activateNext,
      }, vnode)
      elm.addEventListener("focusin", fixActive)
    })
  }, { immediate: true })
}

watch(scrollContainer, elm => {
  if (elm) {
    updateFadeVisibility()
    resizeObserver.observe(elm)
  }
}, { immediate: true })

function updateFadeVisibility() {
  if (!scrollContainer.value) return
  const { scrollLeft, scrollWidth, clientWidth } = scrollContainer.value
  showLeftFade.value = scrollLeft > 0
  showRightFade.value = scrollLeft < (scrollWidth - clientWidth)
}

function startScrolling(direction) {
  stopScrolling()
  scrollTime = 0
  scrollInterval = setInterval(() => {
    const speedModifier = Math.min(
      1 + (scrollMaxSpeedModifier - 1) * (scrollTime / scrollBuildupTime),
      scrollMaxSpeedModifier
    )
    const baseScrollAmount = direction === "left" ? -props.scrollSpeed : props.scrollSpeed
    const scrollAmount = baseScrollAmount * speedModifier
    scrollContainer.value.scrollLeft += scrollAmount
    updateFadeVisibility()
    scrollTime += 1000 / 30
  }, 1000 / 30) // 1000ms / fps
}

function stopScrolling() {
  if (scrollInterval) {
    clearInterval(scrollInterval)
    scrollInterval = null
  }
  scrollTime = 0
}

function onWheel(evt) {
  if (props.noWheel) return
  evt.preventDefault()
  scrollContainer.value.scrollLeft += evt.deltaY
  updateFadeVisibility()
}

function onScroll() {
  updateFadeVisibility()
}

onBeforeUnmount(() => {
  resizeObserver.disconnect()
  stopScrolling()
  if (uinavBound) {
    vBngOnUiNav.beforeUnmount(elCont.value)
    elCont.value.removeEventListener("focusin", fixActive)
  }
})
</script>

<style scoped lang="scss">
@use "@/styles/modules/mixins" as *;
@use "@/styles/modules/density" as *;

$fade-color: var(--bng-overflow-container-fade-color, rgba(0, 0, 0, 0.65));
$fade-color-hover: var(--bng-overflow-container-fade-color-hover, rgba(var(--bng-orange-700-rgb), 0.8));
$binding-pad: 2.5em;

* {
  box-sizing: border-box;
}

.bng-overflow-container {
  position: relative;
  background-color: var(--bng-overflow-container-background, rgba(0, 0, 0, 0.5));
  border-radius: $border-rad-2;
  max-width: 100%;
  overflow: hidden;
}

.scroll-container {
  display: flex;
  flex-flow: row nowrap;
  gap: var(--bng-overflow-container-gap, 0);
  padding: 0.25em;
  overflow-x: auto;
  overflow-y: hidden;
  z-index: 0;
  &::-webkit-scrollbar {
    display: none;
  }
}

.with-bindings .scroll-container,
.with-arrows .scroll-container {
  margin-left: $binding-pad;
  margin-right: $binding-pad;
}

.fade-left,
.fade-right {
  content: "";
  position: absolute;
  display: block;
  top: 0;
  width: 2em;
  height: 100%;
  background-image: linear-gradient(90deg, $fade-color, #0000);
  cursor: pointer;
  z-index: 2;
  &:hover {
    background-image: linear-gradient(90deg, $fade-color-hover, #0000);
  }
}
.fade-left {
  left: 0;
}
.fade-right {
  right: 0;
  transform: scaleX(-1);
}

.with-bindings,
.with-arrows {
  .fade-left,
  .fade-right {
    &::before {
      content: "";
      position: absolute;
      top: 0;
      right: 100%;
      width: $binding-pad;
      height: 100%;
      background-color: $fade-color;
    }
    &:hover::before {
      background-color: $fade-color-hover;
    }
  }
  .fade-left {
    left: $binding-pad;
  }
  .fade-right {
    right: $binding-pad;
  }
}

.hint-prev,
.hint-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 3;
  font-size: var(--binding-font-size, 1.5em);
}
.hint-prev {
  left: 0.25em;
}
.hint-next {
  right: 0.25em;
}

.hide-bindings {
  .hint-prev,
  .hint-next {
    visibility: hidden;
  }
}
</style>
