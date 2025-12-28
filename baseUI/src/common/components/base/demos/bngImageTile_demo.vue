<template>
  Icon, no label
  <BngImageTile :icon="$xp" />
  Icon, label
  <BngImageTile label="Label" :icon="$xp" />
  Image, no label
  <BngImageTile :icon="$xp" />
  Image, label
  <BngImageTile label="Label" :icon="$xp" />
  Label only
  <BngImageTile label="Label" />
</template>

<script setup>
import { BngImageTile, icons } from "@/common/components/base"
const $xp = icons.beamXPLo
</script>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./bngImageTile_demo.vue?raw"
export default {
  source,
  title: "Tile with an image and an optional label",
  description: `A simple tile for showing an image (or icon or old icon), with an optional label`,
  propInfo: [
    {
      name: "oldIcon",
      type: "String",
      desc: "Image shown will use `BngOldIcon` if this prop is set. It will be used as the `type` prop in that component",
    },
    {
      name: "src",
      type: "String",
      desc: "Path (relative to `/ui-vue/src/assets/`) of the image to be used",
    },
    {
      name: "externalSrc",
      type: "String",
      desc: "Same as `src` but for assets external to the Vue project",
    },
    {
      name: "label",
      type: "String",
      desc: "Label for the tile. Appears underneath image or icon",
    },
    {
      name: "image",
      type: "String",
      desc: "Path (relative to `/ui-vue/src/assets/`) of background image (will take up full available space)",
    },
    {
      name: "externalImage",
      type: "String",
      desc: "Same as `image` but for assets external to the Vue project",
    },
    {
      name: "icon",
      type: "String/Object",
      desc: "Defines the icon type (`BngIcon`). Standard icon types (objects) are defined in the `icons` export from `@/common/components/base`. If a String is used, it is assumed to be the glyph representing the icon (this should be useful for modders to eventually use their own icon fonts)",
    },
    {
      name: "ratio",
      type: "String",
      desc: "Aspect ratio to maintain for image specified in `image` or `externalImage`. Default is `'4:3'`",
    },
  ],
  attrInfo: [

  ],
}

</script>
