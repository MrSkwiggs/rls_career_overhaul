<template>
  <!-- TODO: Remove `tile` and `image` classes because it is only added for supporting :deep styling for bngImageTile before generic bngTile was added -->
  <div bng-nav-item class="bng-tile tile" v-bng-disabled="disabled">
    <AspectRatio class="content-container image" :ratio="ratio" :image="backgroundImage" :externalImage="backgroundExternalImage" imageMode="contain">
      <div class="content">
        <slot></slot>
      </div>
    </AspectRatio>
    <slot name="label">
      <div class="label">{{ label }}</div>
    </slot>
  </div>
</template>

<script setup>
import { AspectRatio } from "@/common/components/utility"
import { vBngDisabled } from "@/common/directives"

const props = defineProps({
  label: String,
  ratio: {
    type: String,
    default: "4:3",
  },
  backgroundImage: String,
  backgroundExternalImage: String,
  disabled: Boolean,
})
</script>

<style lang="scss" scoped>
@use "@/styles/modules/mixins" as *;
@use "@/styles/modules/density" as *;

$text-color: white;

.bng-tile {
  // Setting round corners and focus frame offset for focusable tile
  $f-offset: 0.25rem;
  $rad: $border-rad-1;

  position: relative;
  width: 8rem;
  display: flex;
  flex-direction: column;
  min-width: 6rem;
  justify-content: space-between;
  align-items: stretch;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: $rad;
  padding: 0.5rem;
  transition: background-color ease-in 75ms;
  color: $text-color;
  user-select: none;

  // Modify the focus frame radius and offset based on tile corner radius
  @include modify-focus($rad, $f-offset);

  &:not(:last-child) {
    margin-right: 0.2em;
  }

  &:focus,
  &:hover {
    background-color: rgba(var(--bng-cool-gray-700-rgb), 0.8);
  }

  &[disabled="disabled"] {
    pointer-events: none;
    opacity: 0.5;
  }

  &.active {
    background-color: rgba(var(--bng-cool-gray-800-rgb), 0.6);
  }

  &:active {
    background-color: rgba(var(--bng-cool-gray-700-rgb), 0.6);
  }

  > .label {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 0.5rem 0 0.25rem;
  }

  .content {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 0 0.25rem;
    min-height: 2rem;
  }

  > * {
    pointer-events: none;
  }

  .content-container {
    align-self: stretch;
  }
}
</style>
