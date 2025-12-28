<template>
  <BngButton v-bng-on-ui-nav:ok.asMouse.focusRequired v-bng-popover:right-start.click="'demo-menu'">Menu</BngButton>
  <BngPopoverMenu name="demo-menu">
    <BngButton :accent="ACCENTS.menu">Uno</BngButton>
    <BngButton :accent="ACCENTS.menu">Dos</BngButton>
    <BngButton :accent="ACCENTS.menu" disabled>Tres</BngButton>
    <BngButton :accent="ACCENTS.menu">Quatro</BngButton>
    <BngButton :accent="ACCENTS.menu" :icon="icons.aperture"></BngButton>
    <BngButton :accent="ACCENTS.menu" :icon="icons.aperture">Icon</BngButton>
    <BngButton :accent="ACCENTS.menu" :icon-left="icons.aperture">Icon left</BngButton>
    <BngButton :accent="ACCENTS.menu" :icon-right="icons.aperture">Icon right</BngButton>
    <BngButton :accent="ACCENTS.menu" :icon-left="icons.aperture" :icon-right="icons.aperture">Icon both</BngButton>
  </BngPopoverMenu>
</template>

<script setup>
import { BngPopoverMenu, BngButton, ACCENTS, icons } from "@/common/components/base"
import { vBngPopover, vBngOnUiNav } from "@/common/directives"
</script>

<script>
// Demo Metadata
// -------------------------------------------------------
import source from "./bngPopoverMenu_demo.vue?raw"
import { onMounted } from "vue"
export default {
  source,
  title: "TODO - Friendly name",
  description: `TODO - Description of component`,
  propInfo: [
    {
      name: "sample",
      type: "String",
      desc: "Property description",
    },
  ],
  attrInfo: [],
}
</script>
