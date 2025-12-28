<template>
  Click this to browse and construct icons:
  <BngButton @click="gotoIconBrowser()">IconBrowser</BngButton>
  <div class="icons">
    <BngIcon :type="icons.beamNG" :color="randomColour()" />
    <BngIcon :type="icons.abandon" :color="randomColour()" />
    <BngIcon :type="icons.adjust" :color="randomColour()" />
    <BngIcon :type="icons.beamNG" :color="randomColour()" />
  </div>
  <h2>(asImage[mask/span])</h2>
  <div class="icons">
    <BngIcon asImage="mask" :type="icons.beamNG" :color="randomColour()" />
    <BngIcon asImage="mask" :type="icons.abandon" :color="randomColour()" />
    <BngIcon asImage="mask" :type="icons.adjust" :color="randomColour()" />
    <BngIcon asImage="mask" :type="icons.beamNG" :color="randomColour()" />
  </div>
  <h2>(asImage)</h2>
  <div class="icons as-image">
    <BngIcon asImage :type="icons.beamNG" :color="randomColour()" />
    <BngIcon asImage :type="icons.abandon" :color="randomColour()" />
    <BngIcon asImage :type="icons.adjust" :color="randomColour()" />
    <BngIcon asImage :type="icons.beamNG" :color="randomColour()" />
  </div>
</template>

<script setup>
import { inject } from "vue"
import { BngIcon, BngButton, icons } from "@/common/components/base"

const randomColour = () => `rgba(${~~(Math.random() * 256)},${~~(Math.random() * 256)},${~~(Math.random() * 256)})`

const loadDemo = inject("loadDemo")
const gotoIconBrowser = () => loadDemo("IconBrowser")
</script>

<style scoped>
div {
  display: flex;
  flex-wrap: wrap;
}

[asImage] {
  height: 3em;
  width: 3em;
}
.as-image {
  background-color: #fc0;
}
.marker {
  font-size: 5em;
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./bngIcon_demo.vue?raw"
export default {
  source,
  title: "A font-based icon",
  description: `Display a font based icon, optionally as an image (if an Object-based \`type\` is provided and \`asImage\` is set)`,
  propInfo: [
    {
      name: "type",
      type: "String/Object",
      desc: "Defines the icon type. Standard icon types (objects) are defined in the `icons` export from `@/common/components/base`. If a String is used, it is assumed to be the glyph representing the icon (this should be useful for modders to eventually use their own icon fonts). Default is `''`",
    },
    {
      name: "color",
      type: "String",
      desc: "CSS colour for the icon"
    }
  ],
  attrInfo: [
    {
      name: "asImage",
      type: "Falsy/String",
      desc: "If present (Truthy), the icon will be rendered as an image. If the provided String is `'mask'` or `'span'` then the image is used as a `mask-image`"
    }
  ],
}

</script>
