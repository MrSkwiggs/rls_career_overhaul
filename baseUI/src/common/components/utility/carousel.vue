<template>
  <div
    ref="carouselRoot"
    :class="{
      'bng-carousel': true,
      'carousel-vertical': vertical,
      [`transition-${transitionType}`]: true,
    }">
    <div ref="carousel" class="carousel-content">
      <Transition :name="transitionType">
        <CarouselItem :key="currentIndex" class="carousel-slide" :value="currentIndex">
          <slot name="item" :item="items[currentIndex]" :index="currentIndex">
            {{ items[currentIndex] }}
          </slot>
        </CarouselItem>
      </Transition>
    </div>
    <slot name="navigation">
      <div v-if="navShown && items && items.length > 1" class="navigation">
        <div
          v-for="(item, index) in items"
          class="navigation-item"
          :key="item.value"
          :class="{ active: index === currentIndex }"
          @click="showSlide(index)"></div>
      </div>
    </slot>
  </div>
</template>

<script>
const TRANSITION_TYPES = ["fade"]
</script>

<script setup>
import { ref, reactive, computed, onBeforeUnmount, onMounted, watchEffect, watch, nextTick } from "vue"
import CarouselItem from "./carouselItem.vue"

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  current: {
    type: [String, Number],
    default: 0,
  },
  vertical: Boolean,
  loop: {
    type: Boolean,
    default: true,
  },
  transition: Boolean,
  transitionType: {
    type: String,
    default: "fade",
    validator: value => TRANSITION_TYPES.includes(value),
  },
  transitionTime: {
    type: Number,
    default: 3000,
  },
  showNav: {
    type: Boolean,
    default: true,
  },
  parent: Object,
})

let transitionTimer

const carouselRoot = ref(null)
const carousel = ref(null)
const currentIndex = ref(props.current)
const transitionStyle = computed(() => ``)

const navState = reactive({
  selected: null,
})

const showSlide = value => {
  const slideIndex = parseInt(value)
  currentIndex.value = slideIndex
  navState.selected = slideIndex
  setTransition()
}

const navShown = computed(() => props.showNav && !props.parent)

const children = []
const childIndex = child => children.findIndex(itm => itm.element === child.element)
const addChild = child => {
  const idx = childIndex(child)
  idx === -1 && children.push(child)
}
const remChild = child => {
  const idx = childIndex(child)
  idx > -1 && children.splice(idx, 1)
}

const tryParent = (_retry = 0) => {
  if (props.parent.addChild) {
    props.parent.addChild(exposed)
  } else if (_retry < 100) {
    const unwatch = watch(
      () => props.parent.addChild,
      () => {
        unwatch()
        tryParent(++_retry)
      }
    )
  }
}

watch(() => props.parent, tryParent)

watch(
  () => navState.selected,
  sel => {
    for (const child of children) {
      child.showSlide && child.showSlide(sel)
    }
  }
)

onMounted(() => {
  setTransition()
  props.parent && tryParent()
})

onBeforeUnmount(() => {
  if (transitionTimer) {
    clearInterval(transitionTimer)
    transitionTimer = null
  }
  props.parent && props.parent.remChild && props.parent.remChild(exposed)
})

function showPrevious() {
  if (props.parent) return
  let prev
  if (currentIndex.value === 0 && props.loop) {
    prev = props.items.length - 1
  } else if (currentIndex.value > 0) {
    prev = currentIndex.value - 1
  }
  if (prev !== undefined) {
    navState.selected = prev
    currentIndex.value = prev
    setTransition()
  }
}

function showNext() {
  if (props.parent) return
  let next = getNext()
  if (next > -1) {
    navState.selected = next
    currentIndex.value = next
    setTransition()
  }
}

function setTransition() {
  if (transitionTimer) clearInterval(transitionTimer)
  transitionTimer = setInterval(() => {
    const next = getNext()
    if (next > -1) {
      currentIndex.value = next
    }
  }, props.transitionTime)
}

function getNext() {
  if (currentIndex.value === props.items.length - 1 && props.loop) return 0
  return currentIndex.value < props.items.length - 1 ? currentIndex.value + 1 : -1
}

const exposed = {
  element: carouselRoot,
  showSlide,
  showPrevious,
  showNext,
  addChild,
  remChild,
}
defineExpose(exposed)
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

.bng-carousel {
  position: relative;
  height: 100%;
  min-width: 8rem;
  min-height: 10rem;
  overflow: hidden;

  > .carousel-content {
    position: relative;
    height: 100%;
    width: 100%;
    overflow-y: hidden;
    overflow-x: auto;

    &::-webkit-scrollbar {
      display: none;
    }

    > .carousel-slide {
      position: absolute;
      width: 100%;
      height: 100%;
    }
  }

  > .navigation {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem;
    width: 100%;
    bottom: 0;

    > .navigation-item {
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      width: 0.5rem;
      height: 0.5rem;
      border-radius: var(--bng-corners-2);
      cursor: pointer;
      box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;

      &.active {
        width: 0.75rem;
        height: 0.75rem;
      }
    }
  }

  &.carousel-vertical {
    > .carousel-content {
      overflow-x: hidden;
      overflow-y: auto;
    }

    > .navigation {
      flex-direction: column;
      justify-content: center;
      width: 1rem;
      height: 100%;
      margin-left: 0.5rem;
    }
  }

  // &.transition-fade > .navigation {
  //   z-index: 4;
  // }
  // &.transition-fade > .carousel-content {
  //   display: block;
  //   z-index: 1;
  //   > :deep(.bng-carousel-item) {
  //     position: absolute;
  //     top: 0;
  //     left: 0;
  //     right: 0;
  //     bottom: 0;
  //     &:not(.prev-active):not(.active) {
  //       display: none;
  //     }
  //     &.prev-active {
  //       z-index: 2;
  //     }
  //     &.active {
  //       z-index: 3;
  //       animation: 1s linear 0s 1 normal none running carousel-fade;
  //     }
  //     @keyframes carousel-fade {
  //       from {
  //         opacity: 0;
  //       }
  //       to {
  //         opacity: 1;
  //       }
  //     }
  //   }
  // }
}
</style>
