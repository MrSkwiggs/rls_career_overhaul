<template>
  <div class="input-entry">
    <BngMultilineInput
      external-label="Multiline"
      :lines="3"
      :leading-icon="icons.bus"
      :initial-value="'hello world blah blah blah some text here'"
      :trailing-icon="icons.bus"
      floating-label="Floating Label" />
  </div>
  <div class="input-entry">
    <BngMultilineInput
      external-label="Scalable Demo"
      :scalable="true"
      :lines="3"
      :leading-icon="icons.bus"
      :initial-value="'hello world blah blah blah some text here'"
      :trailing-icon="icons.bus"
      floating-label="Floating Label" />
  </div>
</template>

<script setup>
import { BngMultilineInput, icons } from "@/common/components/base"
</script>

<style scoped lang="scss">
.input-entry {
  margin-bottom: 1em;
}
</style>

<script>
// Demo Metadata
// -------------------------------------------------------
import source from "./bngMultilineInput_demo.vue?raw"
export default {
  source,
  title: "Multiline text input component",
  description: `Essentially a wrapper for the native multiline input element, providing additional features and styling`,
  propInfo: [
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
      name: "scalable",
      type: "Boolean",
      desc: "Switch to make the text box sizeable",
    },
    {
      name: "hasError",
      type: "Boolean",
      desc: "Switch to specify that the input has an error (affects styling)",
    },
    {
      name: "errorMessage",
      type: "String",
      desc: "Defines an error message to show",
    },
    {
      name: "lines",
      type: "Number",
      desc: "Number of rows for the multiline input - default is `1`",
    },
    {
      name: "disabled",
      type: "Boolean",
      desc: "Switch for disabling/enabling the input",
    },
  ],
  attrInfo: [],
}
</script>
