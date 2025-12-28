<!-- bngPill - a pill control -->
<template>
  <span bng-nav-item class="bng-pill" :class="{ 'pill-marked': isMarked, 'pill-clickable': hasClickEvent }" :tabindex="hasClickEvent ? 0 : -1">
    <slot></slot>
  </span>
</template>

<script setup>
import { ref, computed, useAttrs, watch } from "vue"

const props = defineProps({
  marked: {
    type: Boolean,
    default: false,
  },
})
const attrs = useAttrs()

const hasClickEvent = computed(() => attrs && attrs.onClick)

const isMarked = ref(props.marked)

watch(
  () => props.marked,
  newValue => (isMarked.value = newValue)
)
</script>

<style lang="scss" scoped>
@use "@/styles/modules/mixins" as *;
@use "@/styles/modules/density" as *;

$highlight-color: var(--bng-orange-b400);
$text-color: var(--bng-off-white);
$default-background-color: transparent;
$marked-background-color: var(--bng-cool-gray-700);
$default-border-color: var(--bng-ter-blue-gray-700);

$f-offset: 0.25rem;
$rad: $border-rad-2;


.bng-pill {
  position: relative;
  display: inline-flex;
  justify-content: center;
  align-items: flex-end;
  padding: 0.4em 1em;
  border-radius: $rad;
  color: $text-color;
  box-shadow: inset 0 0 0 0.125em $default-border-color;
  white-space: nowrap;

  &:focus::before {
    display: none;
  }

  &.pill-marked {
    background-color: $marked-background-color;
    background-clip: padding-box;
    box-shadow: inset 0 0 0 0.125em $marked-background-color;
  }

  &.pill-clickable {
    cursor: pointer;

    &.pill-marked:focus {
      background-color: $marked-background-color;
    }


    &:focus,
    // &:focus-visible,
    &.focus-visible {
      &::before {
        position: absolute;
        display: block;
        border: 0.125em solid $highlight-color;
      }
    }

    @include modify-focus($rad, $f-offset);
  }
}
</style>
