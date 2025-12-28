<template>
  Click this to browse and construct icons:
  <BngButton @click="gotoIconBrowser()">IconBrowser</BngButton>
  <br><br>
  <div class="icons marker">
    <div>
    <span class="type">circlePin: </span>
    <BngIconMarker :type="icons.beamNG" marker="circlePin" :color="[randomColour(), randomColour(), randomColour()]" /></div>
<div>
    <span class="type">markerRectanglePin: </span>
    <BngIconMarker :type="icons.abandon" marker="markerRectanglePin" :color="[randomColour(), randomColour(), randomColour()]" /></div>
    <div>
    <span class="type">markerTriangle: </span>
    <BngIconMarker :type="icons.adjust" marker="markerTriangle" :color="[randomColour(), randomColour(), randomColour()]" /></div>
  </div>
</template>

<script setup>
import { inject } from "vue"
import { BngIconMarker, BngButton, icons } from "@/common/components/base"

const randomColour = () => `rgba(${~~(Math.random() * 256)},${~~(Math.random() * 256)},${~~(Math.random() * 256)})`

const loadDemo = inject("loadDemo")
const gotoIconBrowser = () => loadDemo("IconBrowser")
</script>

<style lang="scss" scoped>
div {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

[asImage] {
  height: 3em;
  width: 3em;
}
.as-image {
  background-color: #fc0;
}
.marker {
  font-size: 4em;
}

.marker .type {
  font-size:1rem !important;
  line-height: 3em;
  margin-left:2em;
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./bngIconMarker_demo.vue?raw"
export default {
  source,
  title: "A marker constructed from icons",
  description: `Display an icon marker, coloured and styled as you require`,
  propInfo: [
    {
      name: "marker",
      type: "String",
      desc: "Type of marker (see below) - default is `'circlePin'`",
    },
    {
      name: "type",
      type: "String/Object",
      desc: "Defines the icon type. Standard icon types (objects) are defined in the `icons` export from `@/common/components/base`. If a String is used, it is assumed to be the glyph representing the icon (this should be useful for modders to eventually use their own icon fonts). Default is `''`",
    },
    {
      name: "color",
      type: "String/Array",
      desc: "Colour(s) for the icon marker. If a string is passed, this will be used as the colour for both the icon and the main marker shape, the background of the icon will be black. If an array is passed, it should be in the form: `['mainMarkerColour', 'iconBackgroundColour', 'iconColour']`",
    },
    {
      name: "point",
      type: "String",
      desc: "Defines the 'pointing direction' of the icon marker. Valid values are: `'up'`, `'down'`, `'left'`, and `'right'` - which are defined in the `MARKER_POINTS` export from `@/common/components/base/bngIconMarker.vue`. Default is `'down'`",
    },
  ],

  attrInfo: [],
}

</script>
