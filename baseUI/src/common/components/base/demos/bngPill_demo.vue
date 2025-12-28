<template>
  <div style="margin-top: 1em; width: 90%">
    Plain Pill
    <BngPill> All </BngPill>
  </div>
  <div style="margin-top: 1em; width: 90%">
    Plain Pill Marked
    <BngPill :marked="true"> All </BngPill>
  </div>
  <div style="margin-top: 1em; width: 90%">
    Interactive Pill
    <BngPill @click="onClick"> All </BngPill>
  </div>
  <div style="margin-top: 1em; width: 90%">
    Interactive Pill Marked
    <BngPill :marked="true" @click="onClick"> All </BngPill>
  </div>
</template>

<script setup>
import { BngPill } from "@/common/components/base"
function onClick() {
  console.log("clicked")
}
</script>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./bngPill_demo.vue?raw"
export default {
  source,
  title: "Simple pill component",
  description: `A simple pill component. Content should be placed in the default slot. Will be automatically focusable and styled to indicate interactivity if a click event is defined`,
  propInfo: [
    {
      name: "marked",
      type: "Boolean",
      desc: "Switch to mark the pill (highlighted background)",
    },
  ],
  attrInfo: [

  ],
}

</script>
