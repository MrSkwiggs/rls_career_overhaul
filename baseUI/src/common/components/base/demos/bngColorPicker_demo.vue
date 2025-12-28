<template>
  <div class="demo-area">
    <!-- <div class="full-row">
      <BngSwitch v-model="interpolate">Interpolate to percieved values</BngSwitch>
    </div> -->
    <div>
      <h3>Default Picker (luminosity mode with all controls)</h3>
      <BngColorPicker v-model="colour" @change="onValueChanged" />
    </div>
    <div>
      <h3>Picker in simple mode</h3>
      <BngColorPicker v-model="colour" view="simple" @change="onValueChanged" />
    </div>
    <div>
      <h3>Picker in luminosity mode</h3>
      <BngColorPicker v-model="colour" view="luminosity" @change="onValueChanged" />
    </div>
    <div>
      <h3>Picker in saturation mode (old style)</h3>
      <BngColorPicker v-model="colour" view="saturation" @change="onValueChanged" />
    </div>
    <div>
      <h3>Picker in compact luminosity mode</h3>
      <BngColorPicker v-model="colour" view="compact_luminosity" @change="onValueChanged" />
    </div>
    <div>
      <h3>Disabled Picker</h3>
      <BngColorPicker v-model="colour" @change="onValueChanged" :disabled="true" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue"
import { BngColorPicker, BngSwitch } from "@/common/components/base"

const interpolate = ref(false)

const colour = reactive({
  hue: 0.5,
  saturation: 1.0,
  luminosity: 0.5,
})

function onValueChanged(value) {
  console.log("valueChanged", value)
}
</script>

<style lang="scss" scoped>
.demo-area {
  display: flex;
  flex-wrap: wrap;
  > * {
    flex: 1 1 auto;
    width: 100%;
    max-width: 500px;
    padding: 0.5em;
  }
  > .full-row {
    flex: 0 0 100%;
    width: 100%;
    max-width: unset;
  }
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./bngColorPicker_demo.vue?raw"
export default {
  source,
  title: "Colour picker",
  description: `Picker for selecting colours in various colour/selection modes`,
  propInfo: [
    {
      name: "modelValue",
      type: "Object",
      desc: "For `v-model` - shouldn't be used directly",
    },
    {
      name: "view",
      type: "String/Object",
      desc: "Type of view/mode to display. Either use a property from the exported `VIEWS` object, or a string from the following:\n\n`simple`, `saturation`, `luminosity`, `full\\_saturation`, `full\\_luminosity`"
    },
    {
      name: "showText",
      type: "Boolean",
      desc: "Flag controlling whether or not sliders have text labels. Defaults to `true`",
    },
    {
      name: "disabled",
      type: "Boolean",
      desc: "Flag for disabling/enabling the picker",
    },
  ],
  attrInfo: [

  ],
}

</script>
