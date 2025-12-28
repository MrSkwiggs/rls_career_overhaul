<template>
  <div>
    <span>Normal:</span>
    <BngCondition :integrity="integrity" :integrity-warning="warn" :color="color" :show-tooltip="tooltip" />
    <span>Enlarged:</span>
    <BngCondition :integrity="integrity" :integrity-warning="warn" :color="color" :show-tooltip="tooltip" style="font-size: 3em" />
  </div>
  <div>
    <span>Integrity:</span>
    <BngSlider class="slider" v-model="integrity" :min="0.0" :max="1.0" :step="0.01" />
    <BngSwitch v-model="warn">Warning</BngSwitch>
  </div>
  <div>
    <BngInput v-model="color" floating-label="Colour" />
    <BngSwitch v-model="tooltip">Show tooltip</BngSwitch>
  </div>
  <div>
    <span>Size can be controlled with <code>font-size</code></span>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { BngCondition, BngSlider, BngInput, BngSwitch } from "@/common/components/base"

const integrity = ref(0.5)
const warn = ref(false)
const color = ref("#f60")
const tooltip = ref(false)
</script>

<style scoped>
div {
  display: flex;
  flex-flow: row nowrap;
  justify-content: stretch;
  align-items: baseline;
}
div > * {
  flex: 0 0 auto;
  width: auto !important;
}
.slider {
  min-width: 20em;
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./bngCondition_demo.vue?raw"
export default {
  source,
  title: "Visual condition indicator",
  description: `Simple component to show a condition value (rated from 0 to 1), along with a colour`,
  propInfo: [
    {
      name: "integrity",
      type: "Number",
      desc: "Integrity value (0 to 1)",
    },
    {
      name: "integrityWarning",
      type: "Boolean",
      desc: "Integrity warning style. Also adds a warning to the tooltip if it is enabled.",
    },
    {
      name: "color",
      type: "String/Array",
      desc: "Color for the indicator. Either `String` - CSS colour, or `Array` - RGB array",
    },
    {
      name: "showTooltip",
      type: "Boolean",
      desc: "Determines whether to show tooltip with condition value",
    },
  ],
  attrInfo: [

  ],
}

</script>