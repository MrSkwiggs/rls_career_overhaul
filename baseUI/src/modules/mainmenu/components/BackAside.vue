<template>
  <div
    class="back-aside"
    @click="emit('click')"
    v-bng-sound-class="'bng_click_hover_generic'"
  >
    <BngIcon class="back-arrow" :type="icons.arrowLargeLeft" />
    <span class="back-text">
      <BngBinding class="back-binding" ui-event="back" controller track-ignore />
      {{ $tt("ui.common.back") }}
    </span>
  </div>
</template>

<script setup>
import { BngIcon, BngBinding, icons } from "@/common/components/base"
import { vBngSoundClass } from "@/common/directives"

const emit = defineEmits(["click"])
</script>

<style lang="scss" scoped>
@use "@/styles/modules/mixins" as *;

$rem: calc-ui-rem();
$width: 4em;

.back-aside {
  font-size: $rem;
  position: absolute;
  top: 0.25em;
  left: calc(#{-$width} - 0.25em);
  bottom: 0.25em;
  width: $width;
  pointer-events: all;
  // border-radius: 0 var(--bng-corners-2) var(--bng-corners-2) 0;
  border-radius: 0 0.5em 0.5em 0;
  color: #fff;
  cursor: pointer;
  background-image: linear-gradient(90deg, transparent 0%, #0004 40%, #0006 60%, #0008 100%);
  &:hover {
    background-image: linear-gradient(90deg, transparent 0%, #8306 60%, #830a 100%);
  }
  .back-arrow {
    position: absolute;
    top: 50%;
    right: 1.25em;
    transform: translateY(-50%);
  }
  .back-text {
    position: absolute;
    top: 50%;
    right: 0.25em;
    margin: 0;
    transform-origin: 50% 100%;
    transform: translate(50%, -100%) rotate(-90deg);
    font-size: 1.5em;
    font-style: italic;
    white-space: nowrap;
    .back-binding {
      position: relative;
      top: -0.2em;
      font-size: $rem;
    }
  }
}
</style>
