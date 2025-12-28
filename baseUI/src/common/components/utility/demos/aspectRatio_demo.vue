<!-- Aspect Ratio Demo -->
<template>
  <h2>Aspect Ratio Demo</h2>

  <span>Empty:</span>
  <AspectRatio class="aspectDemoItem" />

  <span>Image Only (default 16:9):</span>
  <AspectRatio class="aspectDemoItem" :image="demoValues.imgurl" />

  <span>Image 4:3:</span>
  <AspectRatio class="aspectDemoItem" :image="demoValues.imgurl" :ratio="demoValues.fourByThree" />

  <span>Image 3:4:</span>
  <AspectRatio class="aspectDemoItem" :image="demoValues.imgurl" :ratio="demoValues.threeByFour" />
</template>

<script setup>
import { AspectRatio } from "@/common/components/utility"

const demoValues = {
  "imgurl": "images/beamngdrive.png",
  // "imgurl": "images/logos.svg#bng-beamng-white",
  "fourByThree": "4:3",
  "threeByFour": "3:4"
}
</script>

<style lang="scss" scoped>
.aspectDemoItem {
  width: 300px;
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./aspectRatio_demo.vue?raw"
export default {
  source,
  title: "Display a fixed aspect image",
  description: `For displaying an image at a fixed aspect ratio, optionally with overlaid content (should be placed in the default slot)`,
  propInfo: [
    {
      name: "ratio",
      type: "String",
      desc: "Aspect ratio for the image. Default is `'16:9'`",
    },
    {
      name: "imageMode",
      type: "String",
      desc: "'Mode' for the image (corresponds to CSS `background-size` property). Should be one of: `'cover'` (default), `'contain'`",
    },
    {
      name: "image",
      type: "String",
      desc: "Path of image (relative to `/ui-vue/src/assets/`) to be used",
    },
    {
      name: "externalImage",
      type: "String",
      desc: "Path of external image to use (use if image resides outside of normal asset folder)",
    },
  ],
  attrInfo: [

  ],
}

</script>

