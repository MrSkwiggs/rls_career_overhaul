<template>
  <div class="demo-entry">
    <label>Demo with divider</label>
    <div class="columns">
      <div class="col">
        <BngScreenHeading :preheadings="locations" :divider="true">BNG Screen Heading Content</BngScreenHeading>
      </div>
      <div class="col">
        <BngScreenHeadingV2 :preheadings="locations" :divider="true" type="1">BNG Screen Heading Content</BngScreenHeadingV2>
      </div>
    </div>
  </div>
  <div class="demo-entry">
    <label>Demo without divider</label>
    <div class="columns">
      <div class="col">
        <BngScreenHeading :preheadings="locations">BNG Screen Heading Content</BngScreenHeading>
      </div>
      <div class="col">
        <BngScreenHeadingV2 :preheadings="locations" type="2">BNG Screen Heading Content</BngScreenHeadingV2>
      </div>
    </div>
  </div>
  <div class="demo-entry">
    <label>Demo Ribbon</label>
    <div class="columns">
      <div class="col">
        <BngScreenHeading :preheadings="locations" type="ribbon">BNG Screen Heading Content</BngScreenHeading>
      </div>
      <div class="col">
        <BngScreenHeadingV2 :preheadings="locations" type="3">BNG Screen Heading Content</BngScreenHeadingV2>
      </div>
    </div>
  </div>
  <div class="demo-entry">
    <label>Demo Multiline</label>
    <div class="columns">
      <div class="col">
        <BngScreenHeading :preheadings="locations" :divider="true" type="line" style="max-width: 40em">
          If I’m multi-line, then background should behave like a block
        </BngScreenHeading>
      </div>
      <div class="col">
        <BngScreenHeadingV2 :preheadings="locations" :divider="true" type="1" style="max-width: 40em">
          If I’m multi-line, then background should behave like a block
        </BngScreenHeadingV2>
      </div>
    </div>
  </div>
</template>

<script setup>
import { BngScreenHeading, BngScreenHeadingV2 } from "@/common/components/base"

const locations = ["Freeroam", "Freeroam"]
</script>

<style scoped lang="scss">
.demo-entry {
  margin-bottom: 1em;
}

.columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  align-items: start;
}

.col {
  min-width: 0;
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./bngScreenHeading_demo.vue?raw"
export default {
  source,
  title: "A screen heading",
  description: `A large stylised heading. Intended to be used to title a whole UI screen`,
  propInfo: [
    {
      name: "blurDelay",
      type: "Number",
      desc: "Time in ms after which the screen heading background should blur. Shouldn't ordinarily be needed, but there have been a few cases where this could solve a problem (usually animation related)"
    },
    {
      name: "preheadings",
      type: "Array",
      desc: "Array of preheadings to be displayed at the top of the screen heading. Similar to a breadcrumb list"
    },
    {
      name: "divider",
      type: "Boolean",
      desc: "Switch to turn on/off the divider between the preheadings"
    },
    {
      name: "type",
      type: "String",
      desc: "Type/style for the heading. Can be `'line'` (default), or `'ribbon'`"
    },

  ],
  attrInfo: [

  ],
}

</script>

