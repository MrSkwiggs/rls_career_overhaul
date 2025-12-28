<template>
  <div :class="{
    'bng-drawer': true,
    [`drawer-pos-${position}`]: true,
    'drawer-expanded': expanded,
  }">
    <div v-if="position === 'bottom' || position === 'right'" class="drawer-header" v-bng-blur="blur">
      <slot name="header"></slot>
    </div>
    <div v-if="hasAnyContent" class="drawer-content" v-bng-blur="blur">
      <slot v-if="expandedContent" name="expanded-content"></slot>
      <slot v-else name="content"></slot>
    </div>
    <div v-if="position === 'top' || position === 'left'" class="drawer-header" v-bng-blur="blur">
      <slot name="header"></slot>
    </div>
  </div>
</template>

<script>
export const DRAWER_POSITION = {
  bottom: "bottom",
  top: "top",
  left: "left",
  right: "right",
}
</script>

<script setup>
import { computed, watch, useSlots } from "vue"
import { vBngBlur } from "@/common/directives"

defineProps({
  blur: Boolean,
  // side where it will be used (default: bottom)
  position: {
    type: String,
    default: DRAWER_POSITION.bottom,
    validator: val => Object.values(DRAWER_POSITION).includes(val),
  },
})
const emit = defineEmits(["change"])

const expanded = defineModel({ type: Boolean })
watch(() => expanded.value, val => emit("change", val))

const slots = useSlots()
const expandedContent = computed(() => expanded.value && ("expanded-content" in slots))
const hasAnyContent = computed(() => expandedContent.value || ("content" in slots))
</script>

<style lang="scss" scoped>
.bng-drawer {
  position: relative;
  display: block;
  // display: flex;
  // flex-direction: column;
  width: 100%;
  height: auto;
  font-family: Overpass, var(--fnt-defs);

  $rad: 0.5rem;

  > .drawer-header {
    width: fit-content;
    display: flex;
    align-items: center; // consider baseline instead
    justify-content: flex-start;
    background-color: rgba(0, 0, 0, 0.6);
  }

  > .drawer-content {
    background: rgba(0, 0, 0, 0.6);
  }

  // &.drawer-expanded {
  // }

  &.drawer-pos-bottom {
    > .drawer-content {
      border-radius: 0 $rad 0 0;
    }
  }
  &.drawer-pos-top,
  &.drawer-pos-left {
    > .drawer-content {
      border-radius: 0 0 $rad 0;
    }
  }
  &.drawer-pos-right {
    > .drawer-content {
      border-radius: 0 0 0 $rad;
    }
  }
  &.drawer-pos-bottom {
    > .drawer-header {
      border-radius: $rad $rad 0 0;
    }
  }
  &.drawer-pos-top,
  &.drawer-pos-left,
  &.drawer-pos-right {
    > .drawer-header {
      border-radius: 0 0 $rad $rad;
    }
  }
  &.drawer-pos-left,
  &.drawer-pos-right {
    display: inline-block;
    width: auto;
    height: 100%;
    > .drawer-header {
      position: absolute;
      top: 0%;
      width: max-content;
    }
    > .drawer-content {
      height: 100%;
    }
  }
  &.drawer-pos-left {
    > .drawer-header {
      right: 0%;
      transform-origin: 100% 0%;
      transform-origin: round(100%, 1px) 0%; // compensate for more accurate relative positioning
      transform: rotateZ(-90deg);
    }
  }
  &.drawer-pos-right {
    > .drawer-header {
      left: 0%;
      transform-origin: 0% 0%;
      transform: rotateZ(90deg);
    }
  }
}
</style>
