<template>
  <div v-bng-on-ui-nav:back="() => {}">
    <div class="demo-controls">
      <BngSwitch v-model="withInput">Enable text input</BngSwitch>
      <BngInput v-model="unit" prefix="Unit" :disabled="!withInput" />
      <BngSwitch v-model="withReset">Enable reset button</BngSwitch>
    </div>
    <div style="margin-top: 1em">
      Default Slider
      <BngSlider ref="iptChanged" :min="-100" :max="100" :step="1" v-model="defaultSliderValue" @valueChanged="onValueChanged" :with-input="withInput" :with-reset="withReset" :unit="unit" />
      {{ defaultSliderValue }}
      <BngButton v-if="iptChanged" :disabled="!iptChanged.dirty" @click="iptChanged.markClean()">Mark clean</BngButton>
      <span v-if="iptChanged">{{ iptChanged.dirty ? "Dirty" : "Original" }} value</span>
    </div>
    <div style="margin-top: 1em">
      Step Slider
      <BngSlider :min="0" :max="100" :step="10" v-model="stepSliderValue" :with-input="withInput" :with-reset="withReset" :unit="unit" />
      {{ stepSliderValue }}
    </div>
    <div style="margin-top: 1em">
      Disabled Slider
      <BngSlider :min="0" :max="100" v-model="disabledSliderValue" disabled :with-input="withInput" :with-reset="withReset" :unit="unit" />
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { BngSlider, BngButton, BngSwitch, BngInput } from "@/common/components/base"
import { vBngOnUiNav } from "@/common/directives"

const defaultSliderValue = ref(0)
const stepSliderValue = ref(0)
const disabledSliderValue = ref(50)
const withInput = ref(false)
const withReset = ref(false)
const unit = ref("")

const iptChanged = ref()

function onValueChanged(value) {
  console.log("valueChanged", value)
}
</script>

<style scoped>
.demo-controls {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: stretch;
}
</style>

<script>
// Demo Metadata
// -------------------------------------------------------
import source from "./bngSlider_demo.vue?raw"
export default {
  source,
  title: "Slider control",
  description: `Stylised slider control for selecting numerical values`,
  propInfo: [
    {
      name: "modelValue",
      type: "Number",
      desc: "For `v-model` - shouldn't be used directly",
    },
    {
      name: "min",
      type: "Number/String",
      desc: "Minimum value of the slider range (defaul is `0`)",
    },
    {
      name: "max",
      type: "Number/String",
      desc: "[Required] Maxium value of the slider range",
    },
    {
      name: "step",
      type: "Number/String",
      desc: "Step value (granularity) for the slider. Defaul is `0`)",
    },
    {
      name: "withInput",
      type: "Boolean",
      desc: "Flag for showing an input field alongside the slider",
    },
    {
      name: "inputMultiplier",
      type: "Number",
      desc: "Multiplier for the input value (default is `1`)",
    },
    {
      name: "unit",
      type: "String",
      desc: "Unit for the input value",
    },
    {
      name: "disabled",
      type: "Boolean",
      desc: "Flag for disabling the slider",
    },
    {
      name: "uiNavFocus",
      type: "Boolean/Object",
      desc: "For configuring UINav behaviour (see demo page for [`vBngOnUiNavFocus`](#/components/vBngOnUiNavFocus))",
    },
  ],
  attrInfo: [],
}
</script>
