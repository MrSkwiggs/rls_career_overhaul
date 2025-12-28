<template>
  <div
    v-show="displayItems.length > 0"
    class="shelf-wrapper"
  >
    <div
      ref="containerRef"
      class="shelf-container"
      v-bng-focus-capture:101="getActiveItem"
    >
      <div
        v-for="item in displayItems"
        :key="`item-${item.originalIndex}-${item.id}`"
        class="shelf-item"
        :style="item.style"
      >
        <component
          :is="item.vnode"
          :data-shelf-index="item.originalIndex"
          @click="onClick(item.originalIndex, $event)"
          @focus="onFocus(item.originalIndex)"
          @uinav-focus="onFocus(item.originalIndex)"
        />
      </div>
    </div>

    <button
      v-if="navShown"
      class="shelf-nav shelf-nav-prev"
      @click="navigatePrev"
      :disabled="isPrevDisabled"
    >
      <BngIcon :type="icons.arrowLargeLeft" />
    </button>

    <button
      v-if="navShown"
      class="shelf-nav shelf-nav-next"
      @click="navigateNext"
      :disabled="isNextDisabled"
    >
      <BngIcon :type="icons.arrowLargeRight" />
    </button>
  </div>
</template>

<script setup>
import { ref, watch, useSlots, onMounted, nextTick, computed } from "vue"
import { vBngFocusCapture } from "@/common/directives"
import { setFocus } from "@/services/uiNavFocus"
import { sleep } from "@/utils"
import { BngIcon, icons } from "@/common/components/base"

const selectedIndex = defineModel({ type: Number, default: 0 })

const props = defineProps({
  saveName: {
    type: String,
    default: null,
  },
  limit: {
    type: Number,
    default: 5,
    validator: val => val > 2 && val % 2 === 1, // only odd numbers
  },
  fade: {
    type: Boolean,
    default: false,
  },
  showExtra: {
    type: Boolean,
    default: true,
  },
  neighborsFlatten:{
    type: Boolean,
    default: false,
  },
  neighborsScale:{
    type: Number,
    default: 1,
  },
  keepNeighborsAspectRatio:{
    type: Boolean,
    default: false,
  },
  noLoop:{
    type: Boolean,
    default: false,
  },
  navShown:{
    type: Boolean,
    default: false,
  },
  inward:{
    type: Number,
    default: 0,
    validator: val => val >= 0 && val <= 1,
  },
})

const emit = defineEmits(["change", "click"])

const ready = ref(false)
const slots = useSlots()
const containerRef = ref(null)
const shelfItems = ref([])
const displayItems = ref([])
const isAnimating = ref(false)
let itemIdCounter = 0
let lastValidIndex = 0
let isReverting = false

const isPrevDisabled = computed(() => {
  return isAnimating.value || (props.noLoop && selectedIndex.value === 0)
})

const isNextDisabled = computed(() => {
  return isAnimating.value || (props.noLoop && selectedIndex.value === shelfItems.value.length - 1)
})

watch(selectedIndex, index => {
  if (isReverting) return

  index = parseInt(index, 10)

  // validate and revert if invalid
  if (isNaN(index) || index < 0 || (shelfItems.value.length > 0 && index >= shelfItems.value.length)) {
    isReverting = true
    selectedIndex.value = lastValidIndex
    isReverting = false
    return
  }

  lastValidIndex = index
  if (ready.value) buildDisplayItems() // direct update without animation for v-model
}, { immediate: true })

const timings = {
  single: 400,
  multiStart: 200,
  multiMiddle: 200,
  multiEnd: 200,
}

const storageKey = "bngshelf"

watch(() => slots.default?.(), update, { immediate: true })

function update(vnodes) {
  if (!ready.value) return
  if (typeof vnodes === "undefined") vnodes = slots.default?.()
  if (!Array.isArray(vnodes)) vnodes = []

  shelfItems.value = vnodes.reduce((res, vnode) => {
    if (typeof vnode.type === "symbol" && vnode.type.toString() === "Symbol(v-fgt)") {
      res.push(...vnode.children)
      return res
    }
    res.push(vnode)
    return res
  }, [])

  if (props.saveName) {
    const val = localStorage.getItem(`${storageKey}-${props.saveName}`)
    if (val !== null) {
      const idx = parseInt(val, 10)
      if (!isNaN(idx) && idx >= 0 && idx < shelfItems.value.length) {
        selectedIndex.value = idx
      }
    }
  }

  buildDisplayItems()
}

function buildDisplayItems() {
  if (shelfItems.value.length === 0) {
    displayItems.value = []
    return
  }

  const halfLimit = ~~(props.limit / 2)
  const items = []

  for (let i = 0; i < props.limit; i++) {
    const offset = i - halfLimit

    if (!props.showExtra && Math.abs(offset) > halfLimit) continue

    let itemIndex = selectedIndex.value + offset

    if (props.noLoop) {
      // don't wrap items if noLoop is enabled
      if (itemIndex < 0 || itemIndex >= shelfItems.value.length) continue
    } else {
      // wrap items around
      if (itemIndex < 0) {
        itemIndex = shelfItems.value.length + itemIndex
      } else if (itemIndex >= shelfItems.value.length) {
        itemIndex = itemIndex - shelfItems.value.length
      }
    }

    items.push({
      vnode: shelfItems.value[itemIndex],
      originalIndex: itemIndex,
      position: offset,
      id: ++itemIdCounter,
      style: getItemStyle(offset, "normal"),
    })
  }

  displayItems.value = items
}

function getItemStyle(position, state = "normal") {
  const absPosition = Math.abs(position)
  const halfLimit = ~~(props.limit / 2)
  const isExtraItem = absPosition > halfLimit

  const factor = halfLimit > 0 ? absPosition / halfLimit : 1

  let leftPercentage
  if (isExtraItem) {
    // place extra items at the same location as edge items
    const edgePosition = position < 0 ? 0 : props.limit - 1
    leftPercentage = (edgePosition / (props.limit - 1)) * 100
  } else {
    const mainIndex = position + halfLimit
    leftPercentage = (mainIndex / (props.limit - 1)) * 100
  }

  // Apply inward adjustment - pull neighbors towards center (50%)
  if (position !== 0 && props.inward > 0) {
    const pullToCenter = (50 - leftPercentage) * props.inward * factor
    leftPercentage += pullToCenter
  }

  let rotateY = factor * -30 * Math.sign(position)
  let translateZ = 0
  let scaleX = 1
  let scaleY = 1
  let brightness = 1

  if (position !== 0) {
    translateZ = -100 * factor
    // use same scale for both X and Y to maintain aspect ratio
    if (props.keepNeighborsAspectRatio) {
    const scale = Math.max(0.6, 1 - factor * 0.4) * props.neighborsScale
      scaleX = scale
      scaleY = scale
    } else {
      scaleX = Math.max(0.4, 1 - factor * 0.6) * props.neighborsScale
      scaleY = Math.max(0.6, 1 - factor * 0.4) * props.neighborsScale
    }
    brightness = Math.max(0.5, 1 - factor * 0.5)

    // flatten neighbors if neighborsFlatten is true
    if (props.neighborsFlatten) {
      rotateY = 0
    }
  }

  let opacity = 1
  if (state === "entering" || state === "exiting") {
    opacity = 0.1
    translateZ = -100 * (absPosition / halfLimit) // overflow is wanted here
    leftPercentage += 2 * Math.sign(position)
  } else if (isExtraItem) {
    opacity = 0.2
  } else if (props.fade && position !== 0) {
    opacity = Math.max(0.4, 1 - absPosition * 0.3)
  }

  return {
    left: `${leftPercentage}%`,
    transform: "translateX(-50%) translateY(-50%) "
      + `translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scaleX}, ${scaleY})`,
    filter: `brightness(${brightness})`,
    transition: "all 400ms cubic-bezier(0.25, 0.8, 0.25, 1)",
    opacity,
    zIndex: isExtraItem ? 10 - absPosition : 100 - absPosition,
  }
}

let abortAnimation = false
async function toIndex(targetIndex) {
  if (!ready.value || selectedIndex.value === targetIndex) return
  if (typeof targetIndex !== "number" || targetIndex < 0 || targetIndex >= shelfItems.value.length) return

  if (isAnimating.value) {
    abortAnimation = true
    while (abortAnimation) await sleep(20)
  }

  const prevIndex = selectedIndex.value
  const steps = calculateSteps(selectedIndex.value, targetIndex)
  if (steps.length === 0) return

  isAnimating.value = true

  try {
    const stepTimings = calculateStepTimings(steps.length)
    for (let i = 0; i < steps.length; i++) {
      if (abortAnimation) {
        abortAnimation = false
        return
      }
      const step = steps[i]
      const stepTiming = stepTimings[i]
      await animateToStep(step, stepTiming)
    }
    buildDisplayItems()
    selectedIndex.value = targetIndex
    nextTick(() => {
      if (selectedIndex.value === targetIndex) {
        setFocus(containerRef.value.querySelector(`[data-shelf-index="${targetIndex}"]`))
      }
    })
  } finally {
    abortAnimation = false
    isAnimating.value = false
  }

  if (props.saveName) {
    localStorage.setItem(`${storageKey}-${props.saveName}`, targetIndex.toString())
  }

  emit("change", targetIndex, prevIndex)
}

const onFocus = index => selectedIndex.value !== index && toIndex(index)

function onClick(index, event) {
  if (selectedIndex.value === index) {
    emit("click", event, index)
  } else {
    toIndex(index)
  }
}

function calculateStepTimings(stepCount) {
  if (stepCount === 1) return [timings.single]
  return Array.from({ length: stepCount }, (_, i) =>
    i === 0 ? timings.multiStart :
    i === stepCount - 1 ? timings.multiEnd :
    timings.multiMiddle
  )
}

function calculateSteps(fromIndex, toIndex) {
  const targetItemIndex = displayItems.value.findIndex(item => item.originalIndex === toIndex)
  const steps = []
  if (targetItemIndex === -1) {
    let current = fromIndex
    while (current !== toIndex) {
      const totalItems = shelfItems.value.length

      if (props.noLoop) {
        // move directly without wrapping
        if (toIndex > current) {
          current = current + 1
        } else {
          current = current - 1
        }
      } else {
        const directDistance = (toIndex - current + totalItems) % totalItems
        const reverseDistance = (current - toIndex + totalItems) % totalItems
        if (directDistance <= reverseDistance) {
          current = (current + 1) % totalItems
        } else {
          current = (current - 1 + totalItems) % totalItems
        }
      }
      steps.push(current)
    }
  } else {
    const targetPosition = displayItems.value[targetItemIndex].position
    if (targetPosition !== 0) {
      const direction = targetPosition > 0 ? 1 : -1
      const stepsNeeded = Math.abs(targetPosition)
      let current = fromIndex
      for (let i = 0; i < stepsNeeded; i++) {
        if (props.noLoop) {
          // move directly without wrapping
          if (direction > 0) {
            current = current + 1
          } else {
            current = current - 1
          }
        } else {
          if (direction > 0) {
            current = (current + 1) % shelfItems.value.length
          } else {
            current = (current - 1 + shelfItems.value.length) % shelfItems.value.length
          }
        }
        steps.push(current)
      }
    }
  }
  return steps
}

async function animateToStep(stepIndex, stepTiming) {
  const halfLimit = Math.floor(props.limit / 2)
  const currentIndex = selectedIndex.value
  let actualDirection = 0
  if(props.noLoop) {
    actualDirection = stepIndex > currentIndex ? 1 : -1
  }else{
    const totalItems = shelfItems.value.length
    const forwardDistance = (stepIndex - currentIndex + totalItems) % totalItems
    const backwardDistance = (currentIndex - stepIndex + totalItems) % totalItems
    actualDirection = forwardDistance <= backwardDistance ? 1 : -1
  }
  const newItems = []

  if (actualDirection > 0) {
    // moving right
    for (let i = 0; i < displayItems.value.length; i++) {
      const currentItem = displayItems.value[i]
      const newPosition = currentItem.position - 1
      const isExiting = newPosition < -halfLimit
      newItems.push({
        ...currentItem,
        position: newPosition,
        style: getItemStyle(newPosition, isExiting ? "exiting" : "normal"),
      })
    }

    const rightmostIndex = stepIndex + halfLimit
    let wrappedIndex = rightmostIndex

    if (!props.noLoop) {
      wrappedIndex = rightmostIndex >= shelfItems.value.length
        ? rightmostIndex - shelfItems.value.length
        : rightmostIndex
    }

    // only add if index is valid
    if (wrappedIndex >= 0 && wrappedIndex < shelfItems.value.length) {
      newItems.push({
        vnode: shelfItems.value[wrappedIndex],
        originalIndex: wrappedIndex,
        position: halfLimit,
        id: ++itemIdCounter,
        style: getItemStyle(halfLimit, "entering"),
      })
    }
  } else {
    // moving left
    const leftmostIndex = stepIndex - halfLimit
    let wrappedIndex = leftmostIndex

    if (!props.noLoop) {
      wrappedIndex = leftmostIndex < 0 ? leftmostIndex + shelfItems.value.length : leftmostIndex
    }

    // only add if index is valid
    if (wrappedIndex >= 0 && wrappedIndex < shelfItems.value.length) {
      newItems.push({
        vnode: shelfItems.value[wrappedIndex],
        originalIndex: wrappedIndex,
        position: -halfLimit,
        id: ++itemIdCounter,
        style: getItemStyle(-halfLimit, "entering"),
      })
    }

    for (let i = 0; i < displayItems.value.length; i++) {
      const currentItem = displayItems.value[i]
      const newPosition = currentItem.position + 1
      const isExiting = newPosition > halfLimit
      newItems.push({
        ...currentItem,
        position: newPosition,
        style: getItemStyle(newPosition, isExiting ? "exiting" : "normal"),
      })
    }
  }

  displayItems.value = newItems

  const delay = stepTiming / 2

  // await nextTick()
  await sleep(delay)

  displayItems.value = displayItems.value.map(item => {
    if (item.style.opacity === 0.1 && (item.position === halfLimit || item.position === -halfLimit)) {
      return {
        ...item,
        style: getItemStyle(item.position, "normal"),
      }
    }
    return item
  })

  await new Promise(resolve => setTimeout(resolve, delay))
}

function navigateNext() {
  if (isAnimating.value) return
  if (props.noLoop && selectedIndex.value === shelfItems.value.length - 1) return
  const nextIndex = (selectedIndex.value + 1) % shelfItems.value.length
  toIndex(nextIndex)
}

function navigatePrev() {
  if (isAnimating.value) return
  if (props.noLoop && selectedIndex.value === 0) return
  const prevIndex = selectedIndex.value === 0 ? shelfItems.value.length - 1 : selectedIndex.value - 1
  toIndex(prevIndex)
}

defineExpose({
  toIndex,
  next: navigateNext,
  prev: navigatePrev,
  isSelected: evt => {
    const elm = evt.target.closest("[data-shelf-index]")
    if (!elm) return false
    const idx = parseInt(elm.getAttribute("data-shelf-index"), 10)
    return !isNaN(idx) && selectedIndex.value === idx
  },
})

onMounted(() => {
  ready.value = true
  nextTick(update)
})

function getActiveItem() {
  const active = document.activeElement
  if (String(active.dataset.shelfIndex) === String(selectedIndex.value)) return null
  return containerRef.value.querySelector(`[data-shelf-index="${selectedIndex.value}"]`)
}
</script>

<style lang="scss" scoped>
@use "@/styles/modules/mixins" as *;

.shelf-wrapper {
  position: relative;
  display: block;
  width: 100%;
  height: var(--shelf-height, calc-ui-rem(4));
}

.shelf-container {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  background-color: var(--shelf-bg, transparent);
  perspective: 13em;
  transform-style: preserve-3d;
  overflow: hidden;
  pointer-events: all;

  > .shelf-overlay {
    position: absolute;
    display: block;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 101;
  }
  &:not(:hover):not(:focus-within) > .shelf-overlay {
    pointer-events: all;
  }
}

.shelf-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 999999;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 57.5px;
  height: 57.5px;
  background-color: #f27d00;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  outline: none;
  pointer-events: all;

  :deep(svg) {
    color: #ffffff;
    width: 28px;
    height: 28px;
    pointer-events: none;
    user-select: none;
  }

  &:hover:not(:disabled) {
    background-color: #ff8c1a;
    transform: translateY(-50%) scale(1.1);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  &.shelf-nav-prev {
    left: 1rem;
  }

  &.shelf-nav-next {
    right: 1rem;
  }
}

.shelf-item {
  position: absolute;
  top: 50%;
  cursor: pointer;
  outline: none;
  transform-origin: center center;
  will-change: transform, opacity;

  &:hover {
    filter: brightness(1);
  }
}
</style>

