<template>
  This button won't autofocus:
  <BngButton v-bng-focus-if="false" :accent="ACCENTS.secondary">Button</BngButton>
  <br />
  This will:
  <BngButton v-bng-focus-if="true" :accent="ACCENTS.secondary">Button</BngButton>
</template>

<script setup>
import { vBngFocusIf } from "@/common/directives"
import { BngButton, ACCENTS } from "@/common/components/base"
</script>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./BngFocusIf_demo.vue?raw"
export default {
  source,
  title: "TODO - Friendly name",
  description: `TODO - Description of directive`,
  propInfo: [],
  attrInfo: [],
}

</script>
