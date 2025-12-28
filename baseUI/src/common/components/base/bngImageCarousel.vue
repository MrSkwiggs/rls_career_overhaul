<template>
  <div class="bng-image-carousel">
    <Carousel :items="imageAssets" ref="carousel" v-bind="carouselSettings">
      <template #item="{ item }">
        <div class="image-slide" :style="{ 'background-image': `url(${item})` }"></div>
      </template>
    </Carousel>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { Carousel, CarouselItem } from "@/common/components/utility"
import { getAssetURL } from "@/utils"

const props = defineProps({
  images: {
    type: Array,
    required: true,
  },
  external: Boolean,
  current: [String, Number],
  transition: Boolean,
  transitionType: {
    type: String,
    default: "fade",
  },
  transitionTime: {
    type: Number,
    default: 3000,
  },
  loop: {
    type: Boolean,
    default: true,
  },
  showNav: {
    type: Boolean,
    default: true,
  },
  parent: Object, // parent BngImageCarousel to sync with
})

const carousel = ref()
defineExpose({
  carousel,
})

const imageAssets = computed(() => (props.external ? props.images.map(x => "/" + x) : props.images.map(getAssetURL)))

const carouselSettings = computed(() =>
  props.parent && props.parent.carousel !== carousel
    ? {
        parent: props.parent.carousel,
        transition: false,
        transitionType: props.transitionType,
        loop: false,
        transitionTime: props.transitionTime,
      }
    : {
        current: props.current,
        transition: props.transition,
        transitionType: props.transitionType,
        transitionTime: props.transitionTime,
        loop: props.loop,
        showNav: props.showNav,
      }
)
</script>

<style scoped lang="scss">
.bng-image-carousel {
  // aspect-ratio: 2 / 1;

  :deep(.image-slide) {
    width: 100%;
    height: 100%;
    background-repeat: no-repeat;
    background-position: 50% 50%;
    background-size: cover;
  }
}
</style>
