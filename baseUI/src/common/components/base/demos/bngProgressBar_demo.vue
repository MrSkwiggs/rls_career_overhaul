<template>
  <div class="controls">
    <BngSwitch v-model="showLabels">Show value labels</BngSwitch>
    <BngSwitch v-model="useGradient">Gradient</BngSwitch>
  </div>
  <div>
    <h3>Default values</h3>
    <BngProgressBar
      :showValueLabel="showLabels"
      ref="defaultProgressBarRef"
      :value="10"
      :max="100"
      :min="0"
      :header-left="'Specialized'"
      :header-right="'lvl. 12'"
      :gradient="useGradient" />
    <div class="controls">
      <BngButton @click="defaultProgressBarRef.decreaseValueBy(10)" :accent="ACCENTS.secondary">Decrease</BngButton>
      <BngButton @click="defaultProgressBarRef.increaseValueBy(10)" :accent="ACCENTS.secondary">Increase</BngButton>
      <BngInput v-model="defaultProgressBarInput" type="number" />
      <BngButton @click="defaultProgressBarRef.setValue(defaultProgressBarInput)" :accent="ACCENTS.secondary">Set Value</BngButton>
    </div>
  </div>
  <div>
    <h3>Negative values</h3>
    <BngProgressBar
      ref="negativeValueProgressBarRef"
      :value="-50"
      :max="100"
      :min="-100"
      :header-left="'Specialized'"
      :header-right="'lvl. 12'"
      :showValueLabel="showLabels"
      valueLabelFormat="Value Label: #value#"
      :gradient="useGradient" />
    <div class="controls">
      <BngButton @click="negativeValueProgressBarRef.decreaseValueBy(10)" :accent="ACCENTS.secondary">Decrease</BngButton>
      <BngButton @click="negativeValueProgressBarRef.increaseValueBy(10)" :accent="ACCENTS.secondary">Increase</BngButton>
      <BngInput v-model="negativeProgressBarInput" type="number" />
      <BngButton @click="negativeValueProgressBarRef.setValue(negativeProgressBarInput)" :accent="ACCENTS.secondary">Set Value</BngButton>
    </div>
  </div>
  <div>
    <h3>Value change</h3>
    <BngProgressBar
      ref="valueChangeProgressBarRef"
      :value="valueChangeValueInput"
      :oldValue="valueChangeOldValueInput"
      :max="100"
      :min="0"
      :header-left="'Specialized'"
      :header-right="'lvl. 12'"
      :animateDifference="useAnimation"
      oldValueColor="#ff6600"
      valueColor="#ff9046"
      valueLabelFormat="Value Label: #value#" />
    <div class="controls">
      <BngInput floating-label="New value" v-model="valueChangeValueInput" type="number" />
      <BngInput floating-label="Old value" v-model="valueChangeOldValueInput" type="number" />
      <BngSwitch v-model="useAnimation">Animation</BngSwitch>
    </div>
  </div>
  <div>
    <h3>Indeterminate value</h3>
    <BngProgressBar :max="100" :showValueLabel="false" :indeterminate="true" />
  </div>
</template>

<script setup>
import { BngProgressBar, BngSwitch, BngInput, BngButton, ACCENTS } from "@/common/components/base"
import { ref } from "vue"
const defaultProgressBarRef = ref(null),
  negativeValueProgressBarRef = ref(null)
const defaultProgressBarInput = ref(0),
  negativeProgressBarInput = ref(0)
const showLabels = ref(true)
const useGradient = ref(false)
const useAnimation = ref(false)

const valueChangeValueInput = ref(50),
  valueChangeOldValueInput = ref(25)
</script>

<style lang="scss" scoped>
.controls {
  display: flex;
  > * {
    flex: 0 0 auto;
  }
}
</style>

<script>
// Demo Metadata
// -------------------------------------------------------
import source from "./bngProgressBar_demo.vue?raw"
export default {
  source,
  title: "Simple progress bar (meter)",
  description: `Displays a simple progress bar with given value, along with optional labels and headers`,
  propInfo: [
    {
      name: "value",
      type: "Number",
      desc: "Numeric value to show in the progress bar (default is `0`)",
    },
    {
      name: "min",
      type: "Number",
      desc: "Minimum value for the progress bar (default is `0`)",
    },
    {
      name: "max",
      type: "Number",
      desc: "Maximum value for the progress bar (required)",
    },
    {
      name: "headerLeft",
      type: "String",
      desc: "Header to show above the progressbar on the left",
    },
    {
      name: "headerRight",
      type: "String",
      desc: "Header to show above the progressbar on the right",
    },
    {
      name: "showValueLabel",
      type: "Boolean",
      desc: "Switch to show/hide the value label in the progress bar (default is `true`)",
    },
    {
      name: "valueLabelFormat",
      type: "String/Function",
      desc: "Format to use for the value label. If a function is provided, it will be called with the current value, and the result will be used as the label. If a string is provided, it will be used as the label - with `#value#` replaced with the current value. The default is the string`'#value#'`",
    },
    {
      name: "indeterminate",
      type: "Boolean",
      desc: "Switch to put the bar into 'indeterminate' mode if the value is not known. This will show an animation",
    },
    {
      name: "gradient",
      type: "Boolean",
      desc: "Enables gradient decoration on top of the progress bar",
    },
    {
      name: "oldValue",
      type: "Number",
      desc: "The previous value in case you want to display a change in value",
    },
    {
      name: "valueColor",
      type: "String",
      desc: "The colour for the value progress bar (defaults to `'#ff6600'`)",
    },
    {
      name: "oldValueColor",
      type: "String",
      desc: "The colour for the progress bar showing the difference between value and oldValue (defaults to `'#ffffff'`)",
    },
    {
      name: "animateDifference",
      type: "Boolean",
      desc: "Enables pulsing animation to highlight the difference between value and oldValue",
    },
  ],
  attrInfo: [],
}
</script>
