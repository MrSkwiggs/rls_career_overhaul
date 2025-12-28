<template>
  <div class="decal-preview-tile">
    <div class="image"></div>
  </div>
</template>

<script setup>
import { computed } from "vue"
import { getAssetURL } from "@/utils"

const props = defineProps({
  textureImage: {
    type: String,
    required: true,
  },
  textureColor: {
    type: Array,
    default: [255, 255, 255, 1],
  },
  backgroundImage: String,
})

const alphaTextureBackground = computed(() => `url(${props.backgroundImage ? props.backgroundImage : getAssetURL("images/alpha_texture.png")}`)
const imageUrl = computed(() => `url(${props.textureImage})`)
const imgColor = computed(() => {
  const isDecimalFormat = props.textureColor.every(x => x >= 0 && x <= 1.0)
  let red = props.textureColor[0],
    green = props.textureColor[1],
    blue = props.textureColor[2],
    alpha = props.textureColor[3]

  if (isDecimalFormat) {
    red = Math.floor(red * 255)
    green = Math.floor(green * 255)
    blue = Math.floor(blue * 255)
  }

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
})
</script>

<style lang="scss" scoped>
.decal-preview-tile {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  padding: 0.25rem;
  background: v-bind(alphaTextureBackground);

  .image {
    height: 100%;
    width: 100%;
    background: v-bind(imgColor);
    // mix-blend-mode: multiply;
    -webkit-mask-image: v-bind(imageUrl);
    mask-image: v-bind(imageUrl);
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-size: cover;
    mask-size: cover;
  }
}
</style>
