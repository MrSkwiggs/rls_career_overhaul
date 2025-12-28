<!-- bngImageAsset - a simple image, with some custom features -->
<template>
  <span
    v-if="span || mask"
    class="bng-image-asset"
    :style="{
      [mask ? 'maskImage' : 'backgroundImage']: `url(${assetURL})`,
    }"
  ><slot></slot></span>
  <img v-else class="bng-image-asset" :src="assetURL" alt="" @error="emit('error', $event)" @load="emit('load', $event)" />
</template>

<script setup>
import { computed } from "vue"
import { getAssetURL } from "@/utils"

const emit = defineEmits(['error', 'load'])

const props = defineProps({
  src: String,
  externalSrc: String,
  span: Boolean,
  mask: Boolean,
  bgColor: {
    type: String,
    default: "transparent",
  },
})

const assetURL = computed(() => props.src ? getAssetURL(props.src) : props.externalSrc)
</script>

<style lang="scss" scoped>
.bng-image-asset {
  align-self: center;
  background-repeat: no-repeat;
  background-size: contain;
  mask-repeat: no-repeat;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: contain;
  display: inline-block;
  background-color: v-bind(bgColor);
  background-color: var(--mask-image-bg-color, transparent);
}
</style>
