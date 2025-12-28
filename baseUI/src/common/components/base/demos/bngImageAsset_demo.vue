<template>
  <span>Plain image:</span>
  <div>
    <BngImageAsset :title="icon" class="demo-icon" v-for="icon in iconTypesList" :src="iconURL(icon)" />
  </div>
  <span><br />Image as '<code>span</code>' background image:</span>
  <div>
    <BngImageAsset span :title="icon" class="demo-icon" v-for="icon in iconTypesList" :src="iconURL(icon)" :bg-color="randomColour()" />
  </div>
  <span><br />Image as '<code>span</code>' mask image:</span>
  <div>
    <BngImageAsset mask :title="icon" class="demo-icon" v-for="icon in iconTypesList" :src="iconURL(icon)" :bg-color="randomColour()" />
  </div>
</template>

<script setup>
import { BngImageAsset } from "@/common/components/base"
import { iconTypesList } from "@/assets/icons"

const randomColour = () => `rgba(${~~(Math.random() * 256)},${~~(Math.random() * 256)},${~~(Math.random() * 256)})`
const iconURL = icon => `icons/${icon}.svg`
</script>

<style scoped>
div {
  display: flex;
  flex-wrap: wrap;
}
.demo-icon {
  min-width: 1.5em;
  min-height: 1.5em;
  width: 1.5em;
  height: 1.5em;
  margin: 0.2em;
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./bngImageAsset_demo.vue?raw"
export default {
  source,
  title: "Display an image",
  description: `Simple component to display an image - either in an \`img\` tag or as a background/mask image in a span element`,
  propInfo: [
    {
      name: "src",
      type: "String",
      desc: "Path (relative to `/ui-vue/src/assets/`) of the image to be used",
    },
    {
      name: "externalSrc",
      type: "String",
      desc: "Path of external image to be used (for images outside of `/ui-vue/src/assets/`)",
    },
    {
      name: "span",
      type: "Boolean",
      desc: "If set to `true`, the image will be used as a background image in a span element",
    },
    {
      name: "mask",
      type: "Boolean",
      desc: "If set to `true`, the image will be used as a mask image in a span element (will override the `span` prop)",
    },
    {
      name: "bgColor",
      type: "String",
      desc: "CSS background colour for the `span` element if the `span` or `mask` props are set to `true`",
    },
  ],
  attrInfo: [

  ],
}

</script>
