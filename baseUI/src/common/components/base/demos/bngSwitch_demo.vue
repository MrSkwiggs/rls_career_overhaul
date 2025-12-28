<template>
  <div>
    Default Switch
    <br />
    <BngSwitch v-model="newSwitchValue" />
  </div>
  <div>
    Labelled Switch <br />
    <BngSwitch v-model="newSwitchValue" label="Toggle On/Off" />
  </div>
  <div>
    Switch with custom label content <br />
    <BngSwitch v-model="newSwitchValue">
      <span style="padding-right: 0.25em">Some Label</span>
      <BngIcon :type="icons.beamNG" />
    </BngSwitch>
  </div>
  <div>
    Label is before switch control <br />
    <BngSwitch v-model="newSwitchValue" labelBefore>
      <span style="padding-right: 0.25em">Some Label</span>
      <BngIcon :type="icons.beamNG" />
    </BngSwitch>
  </div>
  <div>
    Label alignments<br />
    <BngSwitch v-model="newSwitchValue" :inline="false" label-alignment="start" label="Start" />
    <BngSwitch v-model="newSwitchValue" :inline="false" label-alignment="center" label="Center" />
    <BngSwitch v-model="newSwitchValue" :inline="false" label-alignment="end" label="End" />

    <BngSwitch v-model="newSwitchValue" :inline="false" label-before label-alignment="start" label="Start" />
    <BngSwitch v-model="newSwitchValue" :inline="false" label-before label-alignment="center" label="Center" />
    <BngSwitch v-model="newSwitchValue" :inline="false" label-before label-alignment="end" label="End" />
  </div>
  <div>
    Full-width switch <br />
    <BngSwitch v-model="newSwitchValue" labelBefore :inline="false">
      <span style="padding-right: 0.25em">Some Label</span>
      <BngIcon :type="icons.beamNG" />
    </BngSwitch>
  </div>

  Disabled Switches <br />
  <div style="display: flex; justify-content: space-evenly; align-items: center">
    <BngSwitch v-model="newSwitchValue" label="Disabled" disabled />
    <BngSwitch v-model="newSwitchValue" disabled>
      <span style="padding-right: 0.25em">Disabled Custom Label</span>
      <BngIcon :type="icons.beamNG" />
    </BngSwitch>
    <BngSwitch v-model="newSwitchValue" disabled />
  </div>

  Static Switches <br />
  <p>A uninteractable switch and for display purpose only. It's value can be programmatically changed by setting <code>checked</code> prop</p>
  <div style="display: flex; justify-content: space-evenly; align-items: center">
    <BngSwitch :checked="true" />
    <BngSwitch :checked="true" label="Static Switch" />
    <BngSwitch :checked="false" />
  </div>

  Change Event <br />
  <p>Use <code>:checked</code> and listen to <code>@change</code> event to manually update the value.</p>
  <div style="display: flex; justify-content: space-evenly; align-items: center">
    <BngSwitch :checked="manualUpdateValue" @change="manualUpdate" />
    <p>Current value is {{ manualUpdateValue }}</p>
  </div>
  <p>Use <code>v-model</code> while listening to <code>@change</code> event.</p>
  <div style="display: flex; justify-content: space-evenly; align-items: center">
    <BngSwitch v-model="autoUpdateValue" @change="printValueChanges" />
    <p>Current value is {{ autoUpdateValue }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { BngSwitch, BngIcon, icons } from "@/common/components/base"

const newSwitchValue = ref(true)
const manualUpdateValue = ref(false)
const autoUpdateValue = ref(false)

const manualUpdate = newValue => {
  console.log("Manual Value changed to ", newValue)
  manualUpdateValue.value = newValue
}

const printValueChanges = newValue => {
  console.log("Value changed to ", newValue)
}
</script>

<script>
// Demo Metadata
// -------------------------------------------------------
import source from "./bngSwitch_demo.vue?raw"
import BngSwitchOld from "../bngSwitchOld.vue"
// import BngSwitchNew from "../bngSwitchNew.vue"
export default {
  source,
  title: "Simple on/off switch",
  description: `A stylised on/off switch component. Should be used instead of standard HTML checkboxes`,
  propInfo: [
    {
      name: "modelValue",
      type: "Boolean",
      desc: "For `v-model` - shouldn't be used directly",
    },
    {
      name: "label",
      type: "String",
      desc: "Displayed as label if no template slot is passed",
    },
    {
      name: "checked",
      type: "Boolean",
      desc: "Initial 'checked' state of the switch",
    },
    {
      name: "disabled",
      type: "Boolean",
      desc: "Flag for disabling the switch",
    },
  ],
  attrInfo: [],
}
</script>

<style scoped>
div {
  margin-bottom: 1em;
}
</style>
