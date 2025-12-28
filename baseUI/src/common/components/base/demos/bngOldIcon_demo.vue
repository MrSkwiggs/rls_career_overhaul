<template>
  <div>
    <BngOldIcon :title="type" span class="demo-icon" v-for="type in iconTypesList" :key="type" :type="type" :color="randomColour()" />
  </div>
</template>

<script setup>
import { BngOldIcon } from "@/common/components/base"
import { iconTypesList } from "@/assets/icons"

const randomColour = () => `rgba(${~~(Math.random() * 256)},${~~(Math.random() * 256)},${~~(Math.random() * 256)})`
</script>

<style scoped>
div {
  display: flex;
  flex-wrap: wrap;
}
.demo-icon {
  min-width: 1.5em;
  min-height: 1.5em;
  margin: 0.2em;
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./bngOldIcon_demo.vue?raw"
export default {
  source,
  title: "Our old icon component",
  description: `Our old icon component. Not removed in case it is still needed. Uses SVGs`,
  propInfo: [
    {
      name: "type",
      type: "String",
      desc: "Name of the icon to display. Valid names can be found in the `icons` export from `@/assets/icons`",
    },
    {
      name: "span",
      type: "Boolean",
      desc: "Switch to display the icon as a span element. Using the icon SVG as a background-image. Defaults to `true`",
    },
    {
      name: "mask",
      type: "Boolean",
      desc: "Switch to use the SVG as a mask-image (requires `span` prop to be `true`). Defaults to `true`",
    },
    {
      name: "color",
      type: "String",
      desc: "CSS colour for the icon`",
    },
  ],
  attrInfo: [

  ],
}

</script>
