<template>
  <div class="input-demo-container">
    <div class="input-entry">
      <BngInput v-model="basicValue" type="text" :min="-10" :max="10" :step="1" @valueChanged="onDefaultValueChanged"> </BngInput>
    </div>
    <div class="input-entry">
      Read only: <BngInput v-model="basicValue" readonly type="number" :min="-10" :max="10" :step="1" @valueChanged="onDefaultValueChanged"> </BngInput>
    </div>
    <div class="input-entry demo-1">
      <BngInput
        ref="iptChanged"
        external-label="Demo 1 (10 chars max)"
        floating-label="Floating Label"
        prefix="Prefix"
        suffix="Suffix"
        maxlength="10"
        v-model="defaultValue"
        :initial-value="'test'"
        :trailing-icon="icons.bus"
        @valueChanged="onDefaultValueChanged"
      >
      </BngInput>
      <span v-if="iptChanged">Value is {{ iptChanged.dirty ? "dirty" : "the same" }}</span>
      <BngButton v-if="iptChanged && iptChanged.dirty" @click="iptChanged.markClean()">Mark clean</BngButton>
    </div>
    <div class="input-entry">
      <BngInput
        external-label="Demo 2"
        floating-label="Floating Label"
        prefix="Prefix"
        suffix="Suffix"
        :leading-icon="icons.bus"
        :trailing-icon="icons.bus"
        :trailing-icon-outside="true"
      >
      </BngInput>
    </div>
    <div class="input-entry">
      <BngInput floatingLabel="Type 'error'" initial-value="test" error-message="Invalid Text" :validate="validate"></BngInput>
    </div>
    <div class="input-entry">
      <BngInput
        external-label="Demo 3"
        floating-label="Floating Label"
        prefix="Prefix"
        suffix="Suffix"
        :leading-icon="icons.bus"
        :trailing-icon="icons.bus"
      >
      </BngInput>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from "vue"
import { BngInput, BngButton } from "@/common/components/base"
import { icons } from '@/common/components/base/bngIcon.vue'

const basicValue = ref(0)
const defaultValue = ref("test1")

const iptChanged = ref()

const stopBasicValueWatcher = watch(
  () => basicValue.value,
  () => console.log("basic value", basicValue.value)
)

const stopValueWatcher = watch(
  () => defaultValue.value,
  () => {
    console.log("default value", defaultValue.value)
  }
)

const onDefaultValueChanged = val => console.log("onDefaultValueChanged", val)

const validate = val => {
  if (val &&val.length > 0 && val.includes("error")) {
    return false
  }
  return true
}

onUnmounted(() => {
  stopValueWatcher()
  stopBasicValueWatcher()
})
</script>

<style scoped lang="scss">
.demo-1 {
  width: 70%;
}
.input-demo-container {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
}

.input-entry {
  margin-top: 1em;
}
</style>

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./bngInput_demo.vue?raw"
export default {
  source,
  title: "Text input component",
  description: `Essentially a wrapper for the native input element, providing additional features and styling`,
  propInfo: [
    {
      name: "modelValue",
      type: "String/Number",
      desc: "For `v-model` - shouldn't be used directly",
    },
    {
      name: "type",
      type: "String",
      desc: "Type of input element. Should be one of: `'text'` (default), `'number'`",
    },
    {
      name: "min",
      type: "Number/String",
      desc: "Mininum value for `number` inputs",
    },
    {
      name: "max",
      type: "Number/String",
      desc: "Maximum value for `number` inputs",
    },
    {
      name: "step",
      type: "Number/String",
      desc: "Numeric step for increase and decrease spinners on `number` inputs (default is `1`)",
    },
    {
      name: "maxlength",
      type: "Number/String",
      desc: "Maximum length for the input text",
    },
    {
      name: "readonly",
      type: "Boolean",
      desc: "Switch to make the input element read-only",
    },
    {
      name: "floatingLabel",
      type: "String",
      desc: "Defines a floating label for the input",
    },
    {
      name: "externalLabel",
      type: "String",
      desc: "Defines an external label for the input",
    },
    {
      name: "placeholder",
      type: "String",
      desc: "Defines placeholder text for the input",
    },
    {
      name: "initialValue",
      type: "String",
      desc: "Initial text for the input",
    },
    {
      name: "leadingIcon",
      type: "Object",
      desc: "Defines an icon to be displayed before the input text",
    },
    {
      name: "trailingIcon",
      type: "Object",
      desc: "Defines an icon to be displayed after the input text",
    },
    {
      name: "trailingIconOutside",
      type: "Boolean",
      desc: "Switch to make the trailing icon appear outside the input",
    },
    {
      name: "disabled",
      type: "Boolean",
      desc: "Switch for disabling/enabling the input",
    },
    {
      name: "validate",
      type: "Function",
      desc: "Validation function for the text",
    },
  ],
  attrInfo: [

  ],
}

</script>
