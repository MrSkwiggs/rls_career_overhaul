<template>
  <div class="blur-wrap" v-if="bgRequired">
    <Slideshow
      class="blur-carousel"
      :images="backgroundsBlur"
      :parent="parentCarousel"
      transition
    />
  </div>
</template>

<script setup>
import { inject } from "vue"
import { SysInfo } from "@/services"
import Slideshow from "./Slideshow.vue"

const parentCarousel = inject("mainBackground")
const backgroundsBlur = inject("mainBackgroundBlur")
const bgRequired = SysInfo.mainMenuBackgroundRequired
</script>

<style lang="scss" scoped>
@use "@/styles/modules/mixins" as *;

.blur-wrap {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  /// rounded produces a polygon that slows things down, sadly
  // @include rounded-clip(5px);
  // &.corners-big {
  //   @include rounded-clip(10px);
  // }
  clip: rect(0, auto, auto, 0);
  z-index: -1 !important;
  pointer-events: none;
}

.blur-carousel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>
