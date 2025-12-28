<template>
  <div style="margin-top: 1em">
    Default Slider
    <BngColorSlider v-model="values.default" @change="onValueChanged" />
    <input type="number" min="0" max="1" step="0.001" v-model.number="values.default" />
  </div>
  <div style="margin-top: 1em">
    Default Slider with custom colours and indicator
    <BngColorSlider
      v-model="values.default"
      @change="onValueChanged"
      :fill="[`#f00`, '#ff0', '#0f0', '#0ff', '#00f', '#f0f', '#f00']"
      :current="`hsl(${values.default * 360}, 100%, 50%)`" />
    <input type="number" min="0" max="1" step="0.001" v-model.number="values.default" />
  </div>
  <div style="margin-top: 1em">
    Labeled Slider with custom colours, range and step
    <BngColorSlider
      :vertical="true"
      v-model="values.labeled"
      :min="-100"
      :max="100"
      :step="5"
      :fill="['#f0f', 'rgba(0, 255, 255, 0.0)', 'rgba(0, 255, 255, 1.0)']"
      @change="onValueChanged"
      >Color slider label ({{ values.labeled }}%)</BngColorSlider
    >
    <input type="number" min="-100" max="100" step="5" v-model.number="values.labeled" />
  </div>
  <div style="margin-top: 1em">
    Slider with popout indicator (on focus)
    <BngColorSlider
      v-model="values.popout"
      indicator="popout"
      :fill="['rgb(255, 0, 255)', 'rgb(0, 255, 255)']"
      :current="`rgb(${(1 - values.popout) * 255}, ${values.popout * 255}, 255)`"
      @change="onValueChanged" />
    <input type="number" min="0" max="1" step="0.001" v-model.number="values.popout" />
  </div>
  <div style="margin-top: 1em">
    Disabled Slider
    <BngColorSlider v-model="values.disabled" @change="onValueChanged" :disabled="true"
      >This one is disabled :( ({{ ~~(values.disabled * 100) }}%)</BngColorSlider
    >
    <input type="number" min="0" max="10" step="1" v-model.number="values.disabled" />
  </div>
</template>

<script setup>
import { reactive } from "vue"
import { BngColorSlider } from "@/common/components/base"

const values = reactive({
  default: 0.5,
  labeled: 0,
  disabled: 0.5,
  popout: 0.5,
})

function onValueChanged(value) {
  console.log("valueChanged", value)
}
</script>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./bngColorSlider_demo.vue?raw"
export default {
  source,
  title: "Colour slider",
  description: `Simple slider for selecting a colour from a defined range. Default slot can be used to apply a label to the slider`,
  propInfo: [
    {
      name: "modelValue",
      type: "Number/String",
      desc: "For `v-model` - shouldn't be used directly",
    },
    {
      name: "min",
      type: "Number",
      desc: "Minimum value for the slider",
    },
    {
      name: "max",
      type: "Number",
      desc: "Maximum value for the slider",
    },
    {
      name: "step",
      type: "Number",
      desc: "Step size for the slider",
    },
    {
      name: "fill",
      type: "Array",
      desc: "Array of colour values to define the available range. Defaults to `[\"rgb(0,0,0)\", \"rgb(255,255,255)\"]` - black to white",
    },
    {
      name: "current",
      type: "String",
      desc: "The 'current' displayed colour value. This is not automatically updated",
    },
    {
      name: "vertical",
      type: "Boolean",
      desc: "Set to `true` to orientate the slider vertically (not currently supported)",
    },
    {
      name: "disabled",
      type: "Boolean",
      desc: "Flag for disabling/enabling the picker",
    },
    {
      name: "indicator",
      type: "String",
      desc: "Defines the type of indicator used to show current value. Should be one of: `inner` (default), `popout`",
    },
    {
      name: "uiNavFocus",
      type: "Boolean/Object",
      desc: "Advanced - defines the way the UINavFocus directive is used on the slider. Default values should suffice for most use cases. Please see the documentation/code in `.../common/directives/BngOnUiNavFocus.js` for more information",
    },
  ],
  attrInfo: [

  ],
}

</script>
